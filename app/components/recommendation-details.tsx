'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Info } from 'lucide-react';

interface MatchingFactors {
  cuisine: boolean;
  category: boolean;
  spicyLevel: boolean;
  dietaryMatch: boolean;
}

interface RecommendationDetailsProps {
  type: 'popular' | 'content-based' | 'collaborative' | 'hybrid' | 'no_data' | 'no_user_ratings' | 'no_recommendations' | 'no_preferences';
  similarityScore?: number;
  predictedRating?: number | null;
  hybridScore?: number;
  matchingFactors?: MatchingFactors;
  explanation?: string;
  itemName: string;
  cuisineName: string;
  categoryName: string;
  spicyLevel: number;
  isVeg: number;
}

export function RecommendationDetails({ 
  type, 
  similarityScore, 
  predictedRating, 
  hybridScore,
  matchingFactors, 
  explanation,
  itemName,
  cuisineName,
  categoryName,
  spicyLevel,
  isVeg
}: RecommendationDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1" 
        onClick={() => setIsOpen(true)}
      >
        <Info className="h-3 w-3" />
        <span>Why recommended?</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Why "{itemName}" is recommended</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Recommendation Type */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Recommendation Type:</h3>
              <div className="flex items-center gap-2">
                {type === 'hybrid' && (
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    Hybrid (Content-Based + Collaborative)
                  </div>
                )}
                {type === 'content-based' && (
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    Content-Based
                  </div>
                )}
                {type === 'collaborative' && (
                  <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                    Collaborative
                  </div>
                )}
                {type === 'popular' && (
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    Popular Item
                  </div>
                )}
              </div>
            </div>

            {/* Explanation */}
            {explanation && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Explanation:</h3>
                <p className="text-sm text-muted-foreground">{explanation}</p>
              </div>
            )}

            {/* Scores */}
            {type === 'hybrid' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Recommendation Scores:</h3>
                <div className="grid grid-cols-1 gap-3">
                  {/* Content-Based Score */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-blue-900">Content-Based Score</div>
                        <div className="text-xs text-blue-700 mt-0.5">Based on your preferences</div>
                      </div>
                      <div className="text-2xl font-bold text-blue-700">{Math.round(similarityScore! * 100)}%</div>
                    </div>
                  </div>

                  {/* Collaborative Score */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-purple-900">Collaborative Score</div>
                        <div className="text-xs text-purple-700 mt-0.5">Based on similar users</div>
                      </div>
                      <div className="text-2xl font-bold text-purple-700 flex items-center">
                        {predictedRating?.toFixed(1)}
                        <span className="text-yellow-500 ml-1">★</span>
                      </div>
                    </div>
                  </div>

                  {/* Combined Score */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">Final Combined Score</div>
                        <div className="text-xs text-gray-600 mt-0.5">60% content + 40% collaborative</div>
                      </div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                        {Math.round(hybridScore! * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {type === 'content-based' && similarityScore !== undefined && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-900">Content Match Score</div>
                    <div className="text-xs text-blue-700 mt-0.5">Based on your preferences</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">{Math.round(similarityScore * 100)}%</div>
                </div>
              </div>
            )}

            {type === 'collaborative' && predictedRating !== undefined && predictedRating !== null && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-purple-900">Predicted Rating</div>
                    <div className="text-xs text-purple-700 mt-0.5">Based on similar users</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-700 flex items-center">
                    {predictedRating.toFixed(1)}
                    <span className="text-yellow-500 ml-1">★</span>
                  </div>
                </div>
              </div>
            )}

            {/* Matching Factors */}
            {matchingFactors && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Matching Factors:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded-lg ${matchingFactors.cuisine ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    <div className="text-xs">Cuisine</div>
                    <div className="font-medium">{cuisineName}</div>
                  </div>
                  <div className={`p-2 rounded-lg ${matchingFactors.category ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                    <div className="text-xs">Category</div>
                    <div className="font-medium">{categoryName}</div>
                  </div>
                  <div className={`p-2 rounded-lg ${matchingFactors.spicyLevel ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'}`}>
                    <div className="text-xs">Spice Level</div>
                    <div className="font-medium">{spicyLevel}/5</div>
                  </div>
                  <div className={`p-2 rounded-lg ${matchingFactors.dietaryMatch ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-500'}`}>
                    <div className="text-xs">Dietary</div>
                    <div className="font-medium">{isVeg ? 'Vegetarian' : 'Non-Vegetarian'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
              <p>
                {type === 'hybrid' ? (
                  "This recommendation combines what you like with what similar users enjoy."
                ) : type === 'content-based' ? (
                  "This recommendation is based on your food preferences and past interactions."
                ) : type === 'collaborative' ? (
                  "This recommendation is based on ratings from users with similar tastes."
                ) : (
                  "This is a popular item enjoyed by many users."
                )}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
