'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, FormEvent } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: ''
  });
  const router = useRouter();

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
      general: ''
    };

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Reset previous errors
    setErrors({
      email: '',
      password: '',
      general: ''
    });

    // Validate form
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      console.log("Login response:", data);

      // Store restaurant ID in localStorage if user is a restaurant
      if (data.user.role === 'restaurant') {
        localStorage.setItem('restaurantId', data.user.id.toString());
      }

      // Show success message
      toast.success('Login successful');

      // Wait for cookies to be set
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect based on user role
      const redirectPath = data.user.role === 'admin' 
        ? '/dashboard/admin/restaurants'
        : data.user.role === 'restaurant'
          ? '/dashboard/restaurant'
          : '/';

      // Use replace instead of push to avoid back button issues
      router.replace(redirectPath);
    } catch (error) {
      console.error('Login error:', error);
      if (axios.isAxiosError(error)) {
        const errorResponse = error.response?.data;
        const status = error.response?.status;

        // Detailed error handling
        switch (status) {
          case 400:
            setErrors(prev => ({
              ...prev,
              general: 'Missing required fields. Please check your input.'
            }));
            break;
          case 401:
            setErrors(prev => ({
              ...prev,
              general: 'Invalid credentials. Please check your email and password.'
            }));
            break;
          case 403:
            setErrors(prev => ({
              ...prev,
              general: errorResponse?.message || 'Access denied. Your account may be pending or restricted.'
            }));
            break;
          case 404:
            setErrors(prev => ({
              ...prev,
              general: 'User not found. Please check your email.'
            }));
            break;
          case 500:
            setErrors(prev => ({
              ...prev,
              general: 'Server error. Please try again later.'
            }));
            break;
          default:
            setErrors(prev => ({
              ...prev,
              general: errorResponse?.message || 'An unexpected error occurred'
            }));
        }

        // Show error toast
        toast.error(errors.general);
      } else {
        // Handle unexpected errors
        setErrors(prev => ({
          ...prev,
          general: 'An unexpected error occurred'
        }));
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-50 to-yellow-50 flex items-center justify-center p-4">
    <Card className="w-full max-w-md shadow-xl border border-orange-200">
      <CardHeader className="bg-orange-50">
        <CardTitle className="text-3xl font-bold text-orange-800 flex items-center gap-2">
          <span>Foodhunt</span>
          <span className="text-2xl">🚀</span>
        </CardTitle>
        <p className="text-sm text-orange-600">Welcome back to your food discovery journey</p>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded relative" role="alert">
              {errors.general}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-orange-800">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                name="email" 
                value={email} 
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="Enter your email" 
                disabled={loading}
                className="border-orange-200 focus:border-orange-500"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-orange-800">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  value={password} 
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  placeholder="Enter your password" 
                  className="border-orange-200 focus:border-orange-500 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <div className="text-center mt-4">
              <p className="text-sm text-orange-600">
                Don't have an account? {' '}
                <Link 
                  href="/auth/register" 
                  className="text-orange-800 font-medium hover:underline"
                >
                  Register now
                </Link>
              </p>
            </div>

            {/* <div className="text-center mt-2">
              <p className="text-sm text-orange-600">
                <Link 
                  href="/forgot-password" 
                  className="text-orange-800 font-medium hover:underline"
                >
                  Forgot your password?
                </Link>
              </p>
            </div> */}
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
  );
}
