import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MenuItemProps {
  id: number;
  name: string;
  cuisineId: number;
  categoryId: number;
  spicyLevel: number;
  isVeg: boolean;
  ingredients: string;
  image?: string;
  price: number;
  onAddToCart: () => void;
  onView: (duration: number) => void;
}

export function MenuItem({
  id,
  name,
  cuisineId,
  categoryId,
  spicyLevel,
  isVeg,
  ingredients,
  image,
  price,
  onAddToCart,
  onView,
}: MenuItemProps) {
  const { toast } = useToast();
  const [viewStartTime, setViewStartTime] = useState<number | null>(null);

  // Start tracking view duration when component mounts
  useEffect(() => {
    setViewStartTime(Date.now());

    // When component unmounts, calculate duration and call onView
    return () => {
      if (viewStartTime) {
        const duration = Math.floor((Date.now() - viewStartTime) / 1000); // Convert to seconds
        onView(duration);
      }
    };
  }, []);

  // Render spicy level indicators
  const renderSpicyLevel = () => {
    return Array.from({ length: spicyLevel }).map((_, i) => (
      <Flame key={i} className="h-4 w-4 text-red-500" />
    ));
  };

  const handleAddToCart = () => {
    onAddToCart();
    toast({
      title: "Added to Cart",
      description: `${name} has been added to your cart.`,
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 w-full">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
            No Image
          </div>
        )}
        {isVeg && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
            Veg
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold">{name}</h3>
        <div className="flex items-center mt-1 space-x-2">
          <div className="flex">{renderSpicyLevel()}</div>
          <span className="text-gray-500 text-sm">
            {spicyLevel === 0 ? 'Not Spicy' : `Spicy Level ${spicyLevel}`}
          </span>
        </div>
        <p className="text-gray-600 text-sm mt-2">{ingredients}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold">${price.toFixed(2)}</span>
          <Button onClick={handleAddToCart}>Add to Cart</Button>
        </div>
      </div>
    </Card>
  );
}
