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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      // Get token from response
      const { token, user } = response.data;

      // Set token in cookie
      document.cookie = `auth_token=${token}; path=/; max-age=604800; secure; samesite=strict`;

      // Handle successful login
      toast.success('Login successful');
      
      // Redirect based on user role
      switch (user.role) {
        case 'admin':
          router.push('/dashboard/admin');
          break;
        case 'restaurant':
          router.push('/dashboard/restaurant');
          break;
        case 'customer':
          router.push('/orders');
          break;
        default:
          router.push('/');
      }
    } catch (error) {
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Login to Your Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded relative" role="alert">
                {errors.general}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  name="password" 
                  value={password} 
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  placeholder="Enter your password" 
                  disabled={loading}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Don't have an account? {' '}
                <Link 
                  href="/auth/register" 
                  className="text-primary hover:underline"
                >
                  Register
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
