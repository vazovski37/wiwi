// types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      websites: {
        Row: {
          id: number;
          name: string;
          repo_name: string; // Add this field
          url: string;
          status: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          name: string;
          repo_name: string; // Add this field
          url: string;
          status: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          name?: string;
          repo_name?: string; // Add this field
          url?: string;
          status?: string;
          created_at?: string;
          user_id?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};