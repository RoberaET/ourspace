import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.warn('Supabase URL or Key is missing. Make sure to configure your .env file.');
}

// We wrap it in a mock object if it's missing just so the UI doesn't crash during development without keys
export const supabase = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL' 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : { 
      auth: { 
        getSession: () => Promise.resolve({data: {session: null}}), 
        onAuthStateChange: () => ({data: {subscription: {unsubscribe: () => {}}}}), 
        signInWithPassword: () => Promise.resolve({error: null}), 
        signUp: () => Promise.resolve({data: null, error: null}), 
        signOut: () => Promise.resolve({error: null}) 
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }), order: () => Promise.resolve({ data: [], error: null }) }), limit: () => ({single: () => Promise.resolve({data: null})}) }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({}) }) }),
        update: () => ({ eq: () => Promise.resolve({}) }),
        delete: () => ({ eq: () => Promise.resolve({}) }),
        upsert: () => Promise.resolve({})
      }),
      storage: { from: () => ({ upload: () => Promise.resolve({}), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
      channel: () => ({ on: () => ({ subscribe: () => {} }) }),
      removeChannel: () => {}
    };
