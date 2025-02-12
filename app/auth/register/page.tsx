'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState } from 'react';
import { UserRole } from '@/app/types';

export default function Register() {
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-4">
              <RadioGroup
                defaultValue="CUSTOMER"
                onValueChange={(value) => setRole(value as UserRole)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CUSTOMER" id="customer" />
                  <Label htmlFor="customer">Customer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="RESTAURANT" id="restaurant" />
                  <Label htmlFor="restaurant">Restaurant</Label>
                </div>
              </RadioGroup>

              {role === 'CUSTOMER' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Enter your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter your email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="Create a password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                    />
                  </div>
                </>
              )}

              {role === 'RESTAURANT' && (
                <>
                  {step === 1 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="restaurantName">Restaurant Name</Label>
                        <Input id="restaurantName" placeholder="Enter restaurant name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="restaurantEmail">Email</Label>
                        <Input
                          id="restaurantEmail"
                          type="email"
                          placeholder="Enter business email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" placeholder="Enter phone number" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" placeholder="Enter restaurant address" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="restaurantPassword">Password</Label>
                        <Input
                          id="restaurantPassword"
                          type="password"
                          placeholder="Create a password"
                        />
                      </div>
                      <Button type="button" onClick={() => setStep(2)}>
                        Next
                      </Button>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="certificate">Registration Certificate</Label>
                        <Input id="certificate" type="file" accept="image/*" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="panNumber">PAN Number</Label>
                        <Input id="panNumber" placeholder="Enter PAN number" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="panImage">PAN Card Image</Label>
                        <Input id="panImage" type="file" accept="image/*" />
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

              {role === 'CUSTOMER' && <Button type="submit">Register</Button>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}