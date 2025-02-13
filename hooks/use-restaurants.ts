// import { useState, useEffect } from 'react';
// import { supabase } from '@/lib/supabase';
// import { Restaurant } from '@/app/types';

// export function useRestaurants() {
//   const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadRestaurants();
//   }, []);

//   async function loadRestaurants() {
//     const { data, error } = await supabase
//       .from('restaurants')
//       .select(`
//         *,
//         menu_items (*)
//       `)
//       .eq('is_approved', true);

//     if (error) {
//       console.error('Error loading restaurants:', error);
//     } else {
//       setRestaurants(data || []);
//     }
//     setLoading(false);
//   }

//   return {
//     restaurants,
//     loading,
//     refresh: loadRestaurants,
//   };
// }