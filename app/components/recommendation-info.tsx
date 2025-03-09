'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info } from 'lucide-react';

export function RecommendationInfo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground" 
        onClick={() => setIsOpen(true)}
      >
        <Info className="h-4 w-4" />
        <span>How recommendations work</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">How Our Recommendation System Works</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content-Based</TabsTrigger>
              <TabsTrigger value="collaborative">Collaborative</TabsTrigger>
              <TabsTrigger value="hybrid">Hybrid System</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Hybrid Recommendation System</h3>
                <p>
                  Our food recommendation system uses a hybrid approach that combines the strengths of 
                  both content-based filtering and collaborative filtering to provide you with the most 
                  relevant and personalized food recommendations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-medium">Content-Based Filtering (60%)</h4>
                  <p className="text-sm text-muted-foreground">
                    Recommends items similar to what you've liked before based on food characteristics 
                    like cuisine type, spice level, and dietary preferences.
                  </p>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-medium">Collaborative Filtering (40%)</h4>
                  <p className="text-sm text-muted-foreground">
                    Recommends items based on what similar users have liked. If users with similar 
                    tastes to yours enjoyed certain dishes, you might like them too.
                  </p>
                </div>
              </div>

              <div className="bg-secondary/50 rounded-lg p-4">
                <h4 className="font-medium">What You'll See</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  For each recommendation, you'll see:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
                  <li>The type of recommendation (hybrid, content-based, or popular)</li>
                  <li>A match percentage showing how well it fits your preferences</li>
                  <li>Detailed explanation of why it was recommended</li>
                  <li>Matching factors like cuisine, category, spice level, and dietary preferences</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">How We Personalize Your Experience</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>We analyze your viewing and interaction history</li>
                  <li>We consider your explicit ratings of menu items</li>
                  <li>We track your cuisine and category preferences</li>
                  <li>We account for your dietary preferences (vegetarian/non-vegetarian)</li>
                  <li>We consider your spice level tolerance</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="content" className="mt-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Content-Based Filtering</h3>
                <p>
                  Content-based filtering recommends items similar to what you've liked before by analyzing 
                  the characteristics of the food items themselves.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">How It Works</h4>
                <p className="text-sm">
                  1. We create a "feature vector" for each menu item based on:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Cuisine type (e.g., Nepali, Italian, Chinese)</li>
                  <li>Food category (e.g., Appetizer, Main Course, Dessert)</li>
                  <li>Spice level (from mild to very spicy)</li>
                  <li>Dietary type (vegetarian or non-vegetarian)</li>
                </ul>
                <p className="text-sm mt-2">
                  2. We create a similar vector for your preferences based on your past interactions
                </p>
                <p className="text-sm mt-2">
                  3. We calculate how similar each menu item is to your preference vector using 
                  cosine similarity (a mathematical measure of similarity between vectors)
                </p>
                <p className="text-sm mt-2">
                  4. We recommend the items with the highest similarity scores
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Advantages</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Works well even when you're new to the system</li>
                  <li>Can explain why items are recommended</li>
                  <li>Helps you discover items similar to what you already like</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="collaborative" className="mt-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Item-Item Collaborative Filtering</h3>
                <p>
                  Collaborative filtering recommends items based on what similar users have liked, 
                  without needing to know the specific characteristics of the items.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">How It Works</h4>
                <p className="text-sm">
                  1. We build a user-item ratings matrix where:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Each row represents a user</li>
                  <li>Each column represents a menu item</li>
                  <li>Each cell contains the rating a user gave to an item (1-5 stars)</li>
                </ul>
                <p className="text-sm mt-2">
                  2. We calculate item-item similarity by comparing how users have rated pairs of items
                </p>
                <p className="text-sm mt-2">
                  3. For items you haven't rated, we predict how much you might like them based on:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>How you rated similar items</li>
                  <li>How similar those items are to the unrated item</li>
                </ul>
                <p className="text-sm mt-2">
                  4. We recommend items with the highest predicted ratings
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Example</h4>
                <p className="text-sm">
                  If you rated Chicken Momo 5 stars, and many other users who rated Chicken Momo highly 
                  also rated Chicken Chowmein highly, we might recommend Chicken Chowmein to you, even if 
                  you've never tried it before.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Advantages</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Can discover unexpected items you might like</li>
                  <li>Gets better as more users rate items</li>
                  <li>Can identify subtle patterns in user preferences</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="hybrid" className="mt-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Our Hybrid Recommendation Approach</h3>
                <p>
                  Our hybrid system combines content-based and collaborative filtering to provide the best of both worlds.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <h4 className="font-medium">How We Combine Methods</h4>
                <p className="text-sm mt-1">
                  When you have enough ratings in the system:
                </p>
                <div className="flex items-center mt-2">
                  <div className="w-3/5 h-8 bg-blue-400 rounded-l-md flex items-center justify-center text-white font-medium">
                    60% Content-Based
                  </div>
                  <div className="w-2/5 h-8 bg-purple-400 rounded-r-md flex items-center justify-center text-white font-medium">
                    40% Collaborative
                  </div>
                </div>
                <p className="text-sm mt-3">
                  This weighted approach ensures that your specific preferences (content-based) are prioritized 
                  while still benefiting from the wisdom of similar users (collaborative).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Adaptive System</h4>
                <p className="text-sm">
                  Our system adapts based on available data:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm mt-1">
                  <li><span className="font-medium">New users:</span> 100% content-based recommendations based on your initial preferences</li>
                  <li><span className="font-medium">Users with ratings:</span> 60/40 hybrid approach when enough rating data is available</li>
                  <li><span className="font-medium">No preferences set:</span> Popular recommendations until you set preferences or rate items</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Benefits of Our Hybrid Approach</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Overcomes the "cold start" problem for new users</li>
                  <li>Provides more diverse recommendations than either method alone</li>
                  <li>Balances familiar recommendations with new discoveries</li>
                  <li>Adapts to your changing preferences over time</li>
                  <li>Offers clear explanations for why items are recommended</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
