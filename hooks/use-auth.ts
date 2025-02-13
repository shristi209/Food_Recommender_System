// import { useEffect, useState } from 'react';
// import { supabase } from '@/lib/supabase';
// import { User } from '@supabase/supabase-js';
// import { useRouter } from 'next/navigation';

// export function useAuth() {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   useEffect(() => {
//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       setUser(session?.user ?? null);
//       setLoading(false);
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const signUp = async ({
//     email,
//     password,
//     ...metadata
//   }: {
//     email: string;
//     password: string;
//     [key: string]: any;
//   }) => {
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         data: metadata,
//       },
//     });

//     if (error) throw error;
//     return data;
//   };

//   const signIn = async ({ email, password }: { email: string; password: string }) => {
//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (error) throw error;
//     return data;
//   };

//   const signOut = async () => {
//     const { error } = await supabase.auth.signOut();
//     if (error) throw error;
//     router.push('/');
//   };

//   return {
//     user,
//     loading,
//     signUp,
//     signIn,
//     signOut,
//   };
// }