export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organization_members: {
        Row: {
          organization_id: number
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          organization_id: number
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          organization_id?: number
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: number
          name: string
          owner_id: string
          public_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          owner_id: string
          public_id?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          owner_id?: string
          public_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          project_id: number
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          project_id: number
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          project_id?: number
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: number
          name: string
          organization_id: number
          public_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          organization_id: number
          public_id?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          organization_id?: number
          public_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      websites: {
        Row: {
          created_at: string
          id: number
          name: string
          project_id: number
          public_id: string
          repo_name: string
          status: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          project_id: number
          public_id?: string
          repo_name: string
          status: string
          url: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          project_id?: number
          public_id?: string
          repo_name?: string
          status?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "websites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_org_member: {
        Args: {
          org_id: number
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      member_role: "admin" | "member" | "editor" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

