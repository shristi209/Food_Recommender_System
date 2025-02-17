import { useAuth } from '@/contexts/auth-context';
import { useCallback } from 'react';
import { INTERACTION_WEIGHTS } from '@/utils/interactionWeights';

// Map interaction types to database columns
const interactionTypeToColumn = {
  view: 'viewCount',
  cart_add: 'cartAddCount',
  search: 'searchCount',
  restaurant_view: 'viewCount',         // Maps to viewCount
  restaurant_menu_view: 'viewCount',    // Maps to viewCount
  menu_item_cart_add: 'cartAddCount'    // Maps to cartAddCount
} as const;

// Map interaction types to their base types for database
const interactionTypeToBaseType = {
  view: 'view',
  cart_add: 'cart_add',
  search: 'search',
  restaurant_view: 'view',
  restaurant_menu_view: 'view',
  menu_item_cart_add: 'cart_add'
} as const;

type InteractionType = keyof typeof INTERACTION_WEIGHTS;

interface TrackInteractionParams {
  type: InteractionType;
  itemId: number;
  metadata?: Record<string, any>;
}

export function useInteractions() {
  const { user } = useAuth();

  const trackInteraction = useCallback(async ({
    type,
    itemId,
    metadata = {}
  }: TrackInteractionParams) => {
    if (!user?.id) {
      console.warn('User must be logged in to track interactions');
      return;
    }

    try {
      const column = interactionTypeToColumn[type];
      const baseType = interactionTypeToBaseType[type];
      
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menuItemId: itemId,
          interactionType: column,
          weight: INTERACTION_WEIGHTS[type],  // Pass the specific weight for this interaction type
          metadata
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to track interaction:', errorData);
        return; // Don't throw, just log and continue
      }

      return await response.json();
    } catch (error) {
      console.error('Error tracking interaction:', error);
      // Don't throw, just log the error
    }
  }, [user]);

  return {
    trackInteraction,
    // Legacy methods for backward compatibility
    trackView: (itemId: number) => trackInteraction({ 
      type: 'view',
      itemId
    }),
    trackCartAdd: (itemId: number) => trackInteraction({ 
      type: 'cart_add',
      itemId
    }),
    trackSearch: (itemId: number) => trackInteraction({ 
      type: 'search',
      itemId
    })
  };
}
