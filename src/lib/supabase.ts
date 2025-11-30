import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Database types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          created_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          created_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          period_days: number;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          period_days: number;
          start_date: string;
          end_date: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          period_days?: number;
          start_date?: string;
          end_date?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      routines: {
        Row: {
          id: string;
          goal_id: string;
          user_id: string;
          name: string;
          auth_time_start: string;
          auth_time_end: string;
          frequency: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          user_id: string;
          name: string;
          auth_time_start: string;
          auth_time_end: string;
          frequency: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          goal_id?: string;
          user_id?: string;
          name?: string;
          auth_time_start?: string;
          auth_time_end?: string;
          frequency?: string[];
          created_at?: string;
        };
      };
      verifications: {
        Row: {
          id: string;
          routine_id: string;
          user_id: string;
          media_url: string;
          media_type: 'image' | 'video';
          is_late: boolean;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          routine_id: string;
          user_id: string;
          media_url: string;
          media_type: 'image' | 'video';
          is_late?: boolean;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          routine_id?: string;
          user_id?: string;
          media_url?: string;
          media_type?: 'image' | 'video';
          is_late?: boolean;
          created_at?: string;
          expires_at?: string;
        };
      };
    };
  };
};
