import { createClient } from '@supabase/supabase-js';
import { isDemoMode } from './demoData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Use dummy values in demo mode to prevent errors
const url = isDemoMode() ? 'https://demo.supabase.co' : supabaseUrl;
const key = isDemoMode() ? 'demo-key' : supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Demo Mode: Supabase credentials not found. Running with mock data.');
  console.warn('💡 To enable full functionality, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Override supabase methods in demo mode
if (isDemoMode()) {
  // Mock auth methods with proper types
  supabase.auth.getSession = async () => ({ data: { session: null }, error: null });
  supabase.auth.onAuthStateChange = () => ({ 
    data: { 
      subscription: { 
        id: 'demo',
        callback: () => {},
        unsubscribe: () => {}
      } 
    } 
  } as any);
  supabase.auth.signInWithPassword = async () => ({ 
    data: { user: null, session: null }, 
    error: { message: 'Demo mode - sign in disabled' } as any 
  });
  supabase.auth.signUp = async () => ({ 
    data: { user: null, session: null }, 
    error: { message: 'Demo mode - sign up disabled' } as any 
  });
  supabase.auth.signOut = async () => ({ error: null });
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          role: 'user' | 'moderator' | 'admin';
        };
      };
      farms: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          platform: string[];
          versions: string[];
          video_url: string | null;
          materials: any;
          optional_materials: any;
          images: string[];
          preview_image: string | null;
          author_id: string;
          public: boolean;
          upvotes_count: number;
          created_at: string;
          updated_at: string;
          search_vector: string | null;
          steps: any | null;
          tags: string[];
          estimated_time: number | null;
          chunk_requirements: string | null;
          height_requirements: string | null;
          notes: string | null;
        };
      };
      comments: {
        Row: {
          id: string;
          farm_id: string;
          user_id: string;
          body: string;
          parent_comment_id: string | null;
          created_at: string;
          edited_at: string | null;
        };
      };
      reports: {
        Row: {
          id: string;
          item_type: 'farm' | 'comment';
          item_id: string;
          reason: string;
          reporter_id: string;
          status: 'pending' | 'resolved' | 'dismissed';
          created_at: string;
        };
      };
      farm_tags: {
        Row: {
          farm_id: string;
          tag_name: string;
        };
      };
      upvotes: {
        Row: {
          farm_id: string;
          user_id: string;
          created_at: string;
        };
      };
    };
  };
};

