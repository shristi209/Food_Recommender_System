'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import { Order } from '@/types/auth';

export default function CustomerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/customer/orders');
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to fetch orders');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold">Order #{order.id}</h3>
                      <span className="px-2 py-1 rounded text-sm capitalize" 
                        style={{
                          backgroundColor: 
                            order.status === 'completed' ? 'rgb(34 197 94)' :
                            order.status === 'confirmed' ? 'rgb(59 130 246)' :
                            order.status === 'cancelled' ? 'rgb(239 68 68)' :
                            'rgb(234 179 8)',
                          color: 'white'
                        }}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                    <div className="border-t pt-2 mt-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm py-1">
                          <span>{item.quantity}x Item #{item.menuItemId}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {orders.length === 0 && (
              <p className="text-center text-gray-500">No orders found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
