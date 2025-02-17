// Define weights for different interaction types
export const INTERACTION_WEIGHTS = {
  view: 1,                  
  cart_add: 3,              
  search: 2,                 // Medium weight for appearing in search results
  restaurant_view: 2,        // Weight for viewing restaurant details
  restaurant_menu_view: 2.5, // Higher weight for viewing restaurant menu
  menu_item_cart_add: 4      // Highest weight for adding menu items to cart
} as const;

// Time decay factor (in days) - reduce weight of older interactions
export const TIME_DECAY_FACTOR = 0.1; // Smaller number means slower decay

// Calculate time-decayed weight
export function calculateTimeDecayedWeight(
  interactionCount: number,
  interactionType: keyof typeof INTERACTION_WEIGHTS,
  lastInteractionDate: Date
): number {
  const baseWeight = INTERACTION_WEIGHTS[interactionType];
  const daysSinceLastInteraction = (Date.now() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24);
  const timeDecay = Math.exp(-TIME_DECAY_FACTOR * daysSinceLastInteraction);
  
  return interactionCount * baseWeight * timeDecay;
}


// Regular view = score × 1
// Restaurant view = score × 2
// Restaurant menu view = score × 2.5
// Regular cart add = score × 3
// Menu item cart add = score × 4
