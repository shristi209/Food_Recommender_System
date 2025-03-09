/** 
 * Represents the role of a user in the system.
 * - 'CUSTOMER': A user who can browse and order items.
 * - 'RESTAURANT': A user who can manage a restaurant's menu and orders.
 * - 'ADMIN': A user with elevated permissions for managing the system.
 */
export type UserRole = 'customer' | 'restaurant' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  allergies?: string[];
  address?: string;
  phone?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isApproved: boolean;
  registrationCertificate: string;
  panNumber: string;
  panImage: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  picture: string;
  price: number;
  image: string;
  restaurantId: string;
  category: string;
  isVegetarian: boolean;
  containsAllergens: string[];
}

export interface CartItem extends MenuItem {
  quantity: number;
}

/**
 * Represents the matching factors between a menu item and user preferences
 */
export interface MatchingFactors {
  cuisine: boolean;
  category: boolean;
  spicyLevel: boolean;
  dietaryMatch: boolean;
}

/**
 * Types of recommendations that can be provided by the system
 */
export type RecommendationType = 
  | 'popular'           // Popular items when no user data is available
  | 'content-based'     // Based on user preferences and item features
  | 'collaborative'     // Based on ratings from similar users
  | 'hybrid'            // Combination of content-based and collaborative
  | 'no_data'           // No data available for recommendations
  | 'no_user_ratings'   // No ratings available for the current user
  | 'no_recommendations' // No recommendations could be generated
  | 'no_preferences';   // User has not set any preferences yet

/**
 * Represents a menu item with additional recommendation data
 */
export interface RecommendationItem extends MenuItem {
  // Content-based filtering data
  similarityScore?: number;
  matchingFactors?: MatchingFactors;
  
  // Collaborative filtering data
  predictedRating?: number;
  
  // Hybrid recommendation data
  hybridScore?: number;
  
  // Explanation for the recommendation
  explanation?: string;
  
  // Type of recommendation that produced this item
  recommendationType: RecommendationType;
}

/**
 * User preference data used for content-based filtering
 */
export interface UserPreferences {
  preferredCuisines: string[];
  spicyPreference: number;
  vegPreference: boolean;
  preferredCategories?: string[];
}

/**
 * Complete recommendation response from the API
 */
export interface RecommendationsResponse {
  type: RecommendationType;
  message: string;
  recommendations: RecommendationItem[];
  userPreferences?: UserPreferences;
  contentWeight?: number;  // Weight given to content-based filtering (0-1)
  collaborativeWeight?: number; // Weight given to collaborative filtering (0-1)
}
