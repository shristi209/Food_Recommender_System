'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, FormEvent } from 'react';
import { UserRole } from '@/app/types';
import { toast } from 'sonner';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>();
  const [step, setStep] = useState(1);

  // Customer form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCustomerPassword, setShowCustomerPassword] = useState(false);
  const [showCustomerConfirmPassword, setShowCustomerConfirmPassword] = useState(false);

  // Restaurant form state
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantEmail, setRestaurantEmail] = useState('');
  const [restaurantPhone, setRestaurantPhone] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [restaurantPassword, setRestaurantPassword] = useState('');
  const [restaurantConfirmPassword, setRestaurantConfirmPassword] = useState('');
  const [showRestaurantPassword, setShowRestaurantPassword] = useState(false);
  const [showRestaurantConfirmPassword, setShowRestaurantConfirmPassword] = useState(false);
  const [panNumber, setPanNumber] = useState('');
  const [registrationCertificate, setRegistrationCertificate] = useState<File | null>(null);
  const [panImage, setPanImage] = useState<File | null>(null);

  // Add error state for customer form
  const [customerErrors, setCustomerErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    general: ''
  });

  // Add error state for restaurant form
  const [restaurantErrors, setRestaurantErrors] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    panNumber: '',
    registrationCertificate: '',
    panImage: '',
    general: ''
  });

  const [loading, setLoading] = useState(false);

  const validateCustomerForm = () => {
    // Reset previous errors
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      general: ''
    };
    let isValid = true;

    if (!customerName.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }
    if (!customerEmail.trim() || !/\S+@\S+\.\S+/.test(customerEmail)) {
      newErrors.email = 'Valid email is required';
      isValid = false;
    }
    if (customerPassword.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }
    if (customerPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setCustomerErrors(newErrors);
    return isValid;
  };

  const validateRestaurantForm = () => {
    // Reset previous errors
    const newErrors = {
      name: '',
      email: '',
      phone: '',
      address: '',
      password: '',
      confirmPassword: '',
      panNumber: '',
      registrationCertificate: '',
      panImage: '',
      general: ''
    };
    let isValid = true;

    if (!restaurantName.trim()) {
      newErrors.name = 'Restaurant name is required';
      isValid = false;
    }
    if (!restaurantEmail.trim() || !/\S+@\S+\.\S+/.test(restaurantEmail)) {
      newErrors.email = 'Valid business email is required';
      isValid = false;
    }
    if (!restaurantPhone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    }
    if (!restaurantAddress.trim()) {
      newErrors.address = 'Restaurant address is required';
      isValid = false;
    }
    if (restaurantPassword.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }
    if (restaurantPassword !== restaurantConfirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    if (!panNumber.trim()) {
      newErrors.panNumber = 'PAN number is required';
      isValid = false;
    }
    if (!registrationCertificate) {
      newErrors.registrationCertificate = 'Registration certificate is required';
      isValid = false;
    }
    if (!panImage) {
      newErrors.panImage = 'PAN card image is required';
      isValid = false;
    }

    setRestaurantErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (role === 'customer') {
        if (!validateCustomerForm()) {
          setLoading(false);
          return;
        }

        try {
          const response = await axios.post('/api/auth/register', {
            role: 'customer',
            name: customerName,
            email: customerEmail,
            password: customerPassword
          });

          toast.success('Customer account created successfully!');
          router.push('/auth/login');
        } catch (error: any) {
          handleRegistrationError(error);
        }
      } else if (role === 'restaurant') {
        if (!validateRestaurantForm()) {
          setLoading(false);
          return;
        }

        // Check if passwords match
        if (restaurantPassword !== restaurantConfirmPassword) {
          setRestaurantErrors(prev => ({
            ...prev,
            confirmPassword: 'Passwords do not match'
          }));
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('role', 'restaurant');
        formData.append('restaurantName', restaurantName);
        formData.append('email', restaurantEmail);
        formData.append('password', restaurantPassword);
        formData.append('phone', restaurantPhone);
        formData.append('address', restaurantAddress);
        formData.append('panNumber', panNumber);
        if (registrationCertificate) {
          formData.append('registrationCertificate', registrationCertificate);
        }
        if (panImage) {
          formData.append('panImage', panImage);
        }

        try {
          const response = await axios.post('/api/auth/register', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          toast.success('Restaurant registration submitted successfully! Please wait for admin approval.');
          router.push('/auth/login');
        } catch (error: any) {
          handleRegistrationError(error);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationError = (error: any) => {
    if (axios.isAxiosError(error)) {
      const errorResponse = error.response?.data;

      // Specific error handling for email-related issues
      if (error.response?.status === 400) {
        // Email uniqueness error
        const emailErrorMessage = 'This email is already in use. Please try a different email.';

        // Optional: Show a toast for additional visibility
        toast.error(emailErrorMessage);
      } else {
        // Generic error handling for other types of errors
        toast.error(
          errorResponse?.message || 'Registration failed'
        );
      }
    } else {
      // Handle unexpected errors
      toast.error('An unexpected error occurred during registration');
    }
  };

  // Error message component
  const ErrorMessage = ({ message }: { message: string }) => (
    message ? <p className="text-red-500 text-sm mt-1">{message}</p> : null
  );

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border border-orange-200">
        <CardHeader className="bg-orange-50">
          <CardTitle className="text-3xl font-bold text-orange-800 flex items-center gap-2">
            <span>Foodhunt</span>
            <span className="text-2xl">🚀</span>
          </CardTitle>
          <p className="text-sm text-orange-600">Start your food discovery journey</p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {customerErrors.general && (
              <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded relative" role="alert">
                {customerErrors.general}
              </div>
            )}
            {restaurantErrors.general && (
              <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded relative" role="alert">
                {restaurantErrors.general}
              </div>
            )}

            {!role && (
              <RadioGroup
                onValueChange={(value) => {
                  setRole(value as UserRole);
                  setStep(1);
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="customer" id="customer" />
                  <Label htmlFor="customer" className="text-orange-800">Customer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="restaurant" id="restaurant" />
                  <Label htmlFor="restaurant" className="text-orange-800">Restaurant</Label>
                </div>
              </RadioGroup>
            )}

            {role && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold capitalize text-orange-800">
                    {role} Registration
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Reset all states when changing role
                      setRole(undefined);
                      setStep(1);

                      // Reset customer form
                      setCustomerName('');
                      setCustomerEmail('');
                      setCustomerPassword('');
                      setConfirmPassword('');
                      setCustomerErrors({
                        name: '',
                        email: '',
                        password: '',
                        confirmPassword: '',
                        general: ''
                      });

                      // Reset restaurant form
                      setRestaurantName('');
                      setRestaurantEmail('');
                      setRestaurantPhone('');
                      setRestaurantAddress('');
                      setRestaurantPassword('');
                      setRestaurantConfirmPassword('');
                      setPanNumber('');
                      setRegistrationCertificate(null);
                      setPanImage(null);
                      setRestaurantErrors({
                        name: '',
                        email: '',
                        phone: '',
                        address: '',
                        password: '',
                        confirmPassword: '',
                        panNumber: '',
                        registrationCertificate: '',
                        panImage: '',
                        general: ''
                      });
                    }}
                  >
                    Change Role
                  </Button>
                </div>

                {role === 'customer' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-orange-800">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        name="name"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          setCustomerErrors(prev => ({ ...prev, name: '' }));
                        }}
                        placeholder="Enter your full name"
                        disabled={loading}
                        className="border-orange-200 focus:border-orange-500"
                      />
                      <ErrorMessage message={customerErrors.name} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-orange-800">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        name="email"
                        value={customerEmail}
                        onChange={(e) => {
                          setCustomerEmail(e.target.value);
                          setCustomerErrors(prev => ({ ...prev, email: '' }));
                        }}
                        placeholder="Enter your email"
                        disabled={loading}
                        className="border-orange-200 focus:border-orange-500"
                      />
                      <ErrorMessage message={customerErrors.email} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-orange-800">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showCustomerPassword ? 'text' : 'password'}
                          name="password"
                          value={customerPassword}
                          onChange={(e) => {
                            setCustomerPassword(e.target.value);
                            setCustomerErrors(prev => ({ ...prev, password: '' }));
                          }}
                          placeholder="Enter your password"
                          className="border-orange-200 focus:border-orange-500 pr-10"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustomerPassword(!showCustomerPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-700"
                        >
                          {showCustomerPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <ErrorMessage message={customerErrors.password} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-orange-800">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showCustomerConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setCustomerErrors(prev => ({ ...prev, confirmPassword: '' }));
                          }}
                          placeholder="Confirm your password"
                          className="border-orange-200 focus:border-orange-500 pr-10"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustomerConfirmPassword(!showCustomerConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-700"
                        >
                          {showCustomerConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <ErrorMessage message={customerErrors.confirmPassword} />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      disabled={loading}
                    >
                      {loading ? 'Creating account...' : 'Sign Up'}
                    </Button>
                  </>
                )}

                {role === 'restaurant' && (
                  <>
                    {step === 1 && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="restaurantName" className="text-orange-800">Restaurant Name</Label>
                          <Input
                            id="restaurantName"
                            name="restaurantName"
                            placeholder="Enter restaurant name"
                            value={restaurantName}
                            onChange={(e) => {
                              setRestaurantName(e.target.value);
                              setRestaurantErrors(prev => ({ ...prev, name: '' }));
                            }}
                            className="border-orange-200 focus:border-orange-500"
                            disabled={loading}
                          />
                          <ErrorMessage message={restaurantErrors.name} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="restaurantEmail" className="text-orange-800">Business Email</Label>
                          <Input
                            id="restaurantEmail"
                            name="restaurantEmail"
                            type="email"
                            placeholder="Enter business email"
                            value={restaurantEmail}
                            onChange={(e) => {
                              setRestaurantEmail(e.target.value);
                              setRestaurantErrors(prev => ({ ...prev, email: '' }));
                            }}
                            className="border-orange-200 focus:border-orange-500"
                            disabled={loading}
                          />
                          <ErrorMessage message={restaurantErrors.email} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-orange-800">Phone Number</Label>
                          <Input
                            id="phone"
                            name='restaurantPhone'
                            placeholder="Enter phone number"
                            value={restaurantPhone}
                            onChange={(e) => {
                              setRestaurantPhone(e.target.value);
                              setRestaurantErrors(prev => ({ ...prev, phone: '' }));
                            }}
                            className="border-orange-200 focus:border-orange-500"
                            disabled={loading}
                          />
                          <ErrorMessage message={restaurantErrors.phone} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address" className="text-orange-800">Restaurant Address</Label>
                          <Input
                            id="address"
                            name="restaurantAddress"
                            placeholder="Enter restaurant address"
                            value={restaurantAddress}
                            onChange={(e) => {
                              setRestaurantAddress(e.target.value);
                              setRestaurantErrors(prev => ({ ...prev, address: '' }));
                            }}
                            className="border-orange-200 focus:border-orange-500"
                            disabled={loading}
                          />
                          <ErrorMessage message={restaurantErrors.address} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="restaurantPassword" className="text-orange-800">Password</Label>
                          <div className="relative">
                            <Input
                              id="restaurantPassword"
                              name="restaurantPassword"
                              type={showRestaurantPassword ? 'text' : 'password'}
                              placeholder="Enter password"
                              value={restaurantPassword}
                              onChange={(e) => {
                                setRestaurantPassword(e.target.value);
                                setRestaurantErrors(prev => ({ ...prev, password: '' }));
                              }}
                              className="border-orange-200 focus:border-orange-500 pr-10"
                              disabled={loading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowRestaurantPassword(!showRestaurantPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-700"
                            >
                              {showRestaurantPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <ErrorMessage message={restaurantErrors.password} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="restaurantConfirmPassword" className="text-orange-800">Confirm Password</Label>
                          <div className="relative">
                            <Input
                              id="restaurantConfirmPassword"
                              name="restaurantConfirmPassword"
                              type={showRestaurantConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirm password"
                              value={restaurantConfirmPassword}
                              onChange={(e) => {
                                setRestaurantConfirmPassword(e.target.value);
                                setRestaurantErrors(prev => ({ ...prev, confirmPassword: '' }));
                              }}
                              className="border-orange-200 focus:border-orange-500 pr-10"
                              disabled={loading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowRestaurantConfirmPassword(!showRestaurantConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-700"
                            >
                              {showRestaurantConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <ErrorMessage message={restaurantErrors.confirmPassword} />
                        </div>

                        <Button
                          type="button"
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                          onClick={() => {
                            const isValid = !!(restaurantName.trim() &&
                              restaurantEmail.trim() &&
                              /\S+@\S+\.\S+/.test(restaurantEmail));

                            if (isValid) {
                              setStep(2);
                            } else {
                              validateRestaurantForm();
                            }
                          }}
                          disabled={loading}
                        >
                          Next
                        </Button>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="panNumber" className="text-orange-800">PAN Number</Label>
                          <Input
                            id="panNumber"
                            name="panNumber"
                            placeholder="Enter PAN number"
                            value={panNumber}
                            onChange={(e) => {
                              setPanNumber(e.target.value);
                              setRestaurantErrors(prev => ({ ...prev, panNumber: '' }));
                            }}
                            className="border-orange-200 focus:border-orange-500"
                            disabled={loading}
                          />
                          <ErrorMessage message={restaurantErrors.panNumber} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="registrationCertificate" className="text-orange-800">Registration Certificate</Label>
                          <Input
                            id="registrationCertificate"
                            name="registrationCertificate"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setRegistrationCertificate(file);
                                setRestaurantErrors(prev => ({ ...prev, registrationCertificate: '' }));
                              }
                            }}
                            disabled={loading}
                          />
                          <ErrorMessage message={restaurantErrors.registrationCertificate} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="panImage" className="text-orange-800">PAN Card Image</Label>
                          <Input
                            id="panImage"
                            name="panImage"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setPanImage(file);
                                setRestaurantErrors(prev => ({ ...prev, panImage: '' }));
                              }
                            }}
                            disabled={loading}
                          />
                          <ErrorMessage message={restaurantErrors.panImage} />
                        </div>

                        <div className="flex space-x-2">
                          <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={loading}>
                            Back
                          </Button>
                          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white" disabled={loading}>
                            {loading ? 'Creating account...' : 'Sign Up'}
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </form>
          <div className="text-center mt-4">
            <p className="text-sm text-orange-600">
              Already have an account? {' '}
              <Button
                variant="link"
                className="p-0 text-orange-800 font-medium hover:underline"
                onClick={() => router.push('/auth/login')}
              >
                Login now
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}