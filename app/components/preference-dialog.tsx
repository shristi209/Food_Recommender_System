'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PreferenceDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (preferences: {
    cuisineId: string;
    categoryId: string;
    spicyLevel: number;
    isVeg: boolean;
  }) => void;
  cuisines: Array<{ 
    id: number; 
    name: string; 
    categoryId: number;
    categoryName: string;
  }>;
  userId?: string;
}

export function PreferenceDialog({
  open,
  onClose,
  onSave,
  cuisines,
  userId,
}: PreferenceDialogProps) {
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [spicyLevel, setSpicyLevel] = useState(2);
  const [isVeg, setIsVeg] = useState<boolean | null>(null);
  const [shouldShow, setShouldShow] = useState(open);

  // Group cuisines by category
  const groupedCuisines = cuisines.reduce((acc, cuisine) => {
    const category = cuisine.categoryName || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(cuisine);
    return acc;
  }, {} as Record<string, typeof cuisines>);

  // Check for existing interactions when dialog opens
  useEffect(() => {
    if (open && userId) {
      checkExistingInteractions();
    }
    setShouldShow(open);
  }, [open, userId]);

  const checkExistingInteractions = async () => {
    try {
      const response = await fetch(`/api/user-interactions?userId=${userId}`);
      const data = await response.json();
      
      if (data.hasInteractions) {
        onClose();
        setShouldShow(false);
      }
    } catch (error) {
      console.error('Failed to check user interactions:', error);
    }
  };

  if (!shouldShow) return null;

  const handleSave = () => {
    if (!selectedCuisine || isVeg === null) {
      return;
    }

    const selectedCuisineData = cuisines.find(c => c.id.toString() === selectedCuisine);
    if (!selectedCuisineData) return;

    onSave({
      cuisineId: selectedCuisine,
      categoryId: selectedCuisineData.categoryId.toString(),
      spicyLevel,
      isVeg,
    });
  };

  const handleClose = () => {
    // Reset form
    setSelectedCuisine('');
    setSpicyLevel(2);
    setIsVeg(null);
    // Close dialog
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome! Tell us your food preferences</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cuisine">Select Your Preferred Cuisine</Label>
            <Select
              value={selectedCuisine}
              onValueChange={setSelectedCuisine}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cuisine" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupedCuisines).sort().map(([category, categoryCuisines]) => (
                  <SelectGroup key={category}>
                    <SelectLabel className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {category}
                    </SelectLabel>
                    {categoryCuisines.map((cuisine) => (
                      <SelectItem key={cuisine.id} value={cuisine.id.toString()}>
                        {cuisine.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Spicy Level Preference</Label>
            <Slider
              value={[spicyLevel]}
              onValueChange={(value) => setSpicyLevel(value[0])}
              max={5}
              min={1}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mild</span>
              <span>Medium</span>
              <span>Hot</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Dietary Preference</Label>
            <RadioGroup
              value={isVeg === null ? undefined : isVeg.toString()}
              onValueChange={(value) => setIsVeg(value === 'true')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="veg" />
                <Label htmlFor="veg">Vegetarian</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="non-veg" />
                <Label htmlFor="non-veg">Non-Vegetarian</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedCuisine || isVeg === null}
          >
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
