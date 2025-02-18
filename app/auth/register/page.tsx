'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
    confirmPassword: ''
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
    panImage: ''
  });

  const validateCustomerForm = () => {
    // Reset previous errors
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
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
      panImage: ''
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

    try {
      if (role === 'customer') {
        if (!validateCustomerForm()) return;

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
        if (!validateRestaurantForm()) return;

        // Check if passwords match
        if (restaurantPassword !== restaurantConfirmPassword) {
          setRestaurantErrors(prev => ({
            ...prev,
            confirmPassword: 'Passwords do not match'
          }));
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {!role && (
              <RadioGroup
                onValueChange={(value) => {
                  setRole(value as UserRole);
                  setStep(1);
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="customer" id="customer" />
                  <Label htmlFor="customer">Customer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="restaurant" id="restaurant" />
                  <Label htmlFor="restaurant">Restaurant</Label>
                </div>
              </RadioGroup>
            )}

            {role && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold capitalize">
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
                        confirmPassword: ''
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
                        panImage: ''
                      });
                    }}
                  >
                    Change Role
                  </Button>
                </div>

                {role === 'customer' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Enter your name"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          setCustomerErrors(prev => ({ ...prev, name: '' }));
                        }}
                      />
                      <ErrorMessage message={customerErrors.name} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={customerEmail}
                        onChange={(e) => {
                          setCustomerEmail(e.target.value);
                          setCustomerErrors(prev => ({ ...prev, email: '' }));
                        }}
                      />
                      <ErrorMessage message={customerErrors.email} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showCustomerPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={customerPassword}
                          onChange={(e) => {
                            setCustomerPassword(e.target.value);
                            setCustomerErrors(prev => ({ ...prev, password: '' }));
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustomerPassword(!showCustomerPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showCustomerPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                      <ErrorMessage message={customerErrors.password} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showCustomerConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setCustomerErrors(prev => ({ ...prev, confirmPassword: '' }));
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustomerConfirmPassword(!showCustomerConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showCustomerConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                      <ErrorMessage message={customerErrors.confirmPassword} />
                    </div>

                    <Button type="submit" className="w-full">
                      Create Customer Account
                    </Button>
                  </>
                )}

                {role === 'restaurant' && (
                  <>
                    {step === 1 && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="restaurantName">Restaurant Name</Label>
                          <Input
                            id="restaurantName"
                            name="restaurantName"
                            placeholder="Enter restaurant name"
                            value={restaurantName}
                            onChange={(e) => {
                              setRestaurantName(e.target.value);
                              setRestaurantErrors(prev => ({ ...prev, name: '' }));
                            }}
                          />
                          <ErrorMessage message={restaurantErrors.name} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="restaurantEmail">Business Email</Label>
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
                          />
                          <ErrorMessage message={restaurantErrors.email} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            name='restaurantPhone'
                            placeholder="Enter phone number"
                            value={restaurantPhone}
                            onChange={(e) => {
                              setRestaurantPhone(e.target.value);
                              setRestaurantErrors(prev => ({ ...prev, phone: '' }));
                            }}
                          />
                          <ErrorMessage message={restaurantErrors.phone} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address">Restaurant Address</Label>
                          <Input
                            id="address"
                            name="restaurantAddress"
                            placeholder="Enter restaurant address"
                            value={restaurantAddress}
                            onChange={(e) => {
                              setRestaurantAddress(e.target.value);
                              setRestaurantErrors(prev => ({ ...prev, address: '' }));
                            }}
                          />
                          <ErrorMessage message={restaurantErrors.address} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="restaurantPassword">Password</Label>
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
                            />
                            <button
                              type="button"
                              onClick={() => setShowRestaurantPassword(!showRestaurantPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              {showRestaurantPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-500" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                          <ErrorMessage message={restaurantErrors.password} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="restaurantConfirmPassword">Confirm Password</Label>
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
                            />
                            <button
                              type="button"
                              onClick={() => setShowRestaurantConfirmPassword(!showRestaurantConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              {showRestaurantConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-500" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                          <ErrorMessage message={restaurantErrors.confirmPassword} />
                        </div>

                        <Button
                          type="button"
                          className="w-full"
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
                        >
                          Next
                        </Button>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="panNumber">PAN Number</Label>
                          <Input
                            id="panNumber"
                            name="panNumber"
                            placeholder="Enter PAN number"
                            value={panNumber}
                            onChange={(e) => {
                              setPanNumber(e.target.value);
                              setRestaurantErrors(prev => ({ ...prev, panNumber: '' }));
                            }}
                          />
                          <ErrorMessage message={restaurantErrors.panNumber} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="registrationCertificate">Registration Certificate</Label>
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
                          />
                          <ErrorMessage message={restaurantErrors.registrationCertificate} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="panImage">PAN Card Image</Label>
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
                          />
                          <ErrorMessage message={restaurantErrors.panImage} />
                        </div>

                        <div className="flex space-x-2">
                          <Button type="button" variant="outline" onClick={() => setStep(1)}>
                            Back
                          </Button>
                          <Button type="submit">Register</Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Button
                variant="link"
                className="p-0 text-primary hover:text-primary/80"
                onClick={() => router.push('/auth/login')}
              >
                Login
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}