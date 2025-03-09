'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import RatingStars from './RatingStars';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';

interface MenuItem {
  id: number | string;
  name: string;
  picture: string;
  restaurantName: string;
  cuisineName: string;
  categoryName: string;
  isVeg: number;
  spicyLevel: number;
}

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem | null;
  onRatingSubmit?: () => void;
}

export function RatingModal({ isOpen, onClose, menuItem, onRatingSubmit }: RatingModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [currentRating, setCurrentRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingRating, setFetchingRating] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isOpen && menuItem && isAuthenticated) {
      fetchUserRating();
    }
  }, [isOpen, menuItem, isAuthenticated]);

  const fetchUserRating = async () => {
    if (!menuItem) return;
    
    try {
      setFetchingRating(true);
      const response = await fetch(`/api/ratings?menuId=${menuItem.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setCurrentRating(data.rating);
        if (data.rating) {
          setRating(data.rating);
        } else {
          setRating(0);
        }
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    } finally {
      setFetchingRating(false);
    }
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
  };

  const handleSubmit = async () => {
    if (!menuItem || !isAuthenticated) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menuId: menuItem.id,
          rating: rating,
        }),
      });
      
      if (response.ok) {
        toast({
          title: currentRating ? "Rating updated!" : "Rating submitted!",
          description: `You rated ${menuItem.name} ${rating} stars.`,
        });
        
        if (onRatingSubmit) {
          onRatingSubmit();
        }
        
        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSpicyLevelText = (level: number) => {
    switch (level) {
      case 0: return 'Not Spicy';
      case 1: return 'Mild';
      case 2: return 'Medium';
      case 3: return 'Hot';
      case 4: return 'Very Hot';
      default: return 'Unknown';
    }
  };

  if (!menuItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{currentRating ? "Update Rating" : "Rate This Item"}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="relative h-40 w-full rounded-md overflow-hidden">
            <Image
              src={menuItem.picture || "/placeholder-food.jpg"}
              alt={menuItem.name}
              fill
              className="object-cover"
            />
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold">{menuItem.name}</h3>
            <p className="text-sm text-muted-foreground">{menuItem.restaurantName}</p>
            
            <div className="flex justify-center gap-2 mt-2">
              <Badge variant={menuItem.isVeg === 1 ? "default" : "destructive"}>
                {menuItem.isVeg === 1 ? "Vegetarian" : "Non-Vegetarian"}
              </Badge>
              <Badge variant="secondary">
                {getSpicyLevelText(menuItem.spicyLevel)}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm font-medium">
              {currentRating 
                ? `Your current rating: ${currentRating} stars` 
                : "How would you rate this item?"}
            </p>
            
            {fetchingRating ? (
              <div className="h-8 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading your rating...</p>
              </div>
            ) : (
              <RatingStars 
                initialRating={rating} 
                onRatingChange={handleRatingChange} 
              />
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || rating === 0}
          >
            {loading ? "Submitting..." : currentRating ? "Update Rating" : "Submit Rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
