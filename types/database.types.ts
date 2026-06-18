// Generated from the Supabase schema. Regenerate with:
//   supabase gen types typescript --project-id tsnukavodlfpswqjrrhn > types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      calorie_goals: {
        Row: {
          contest_id: string
          created_at: string
          effective_from: string
          goal_calories: number
          id: string
          profile_id: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          effective_from: string
          goal_calories: number
          id?: string
          profile_id: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          effective_from?: string
          goal_calories?: number
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'calorie_goals_contest_id_fkey'
            columns: ['contest_id']
            isOneToOne: false
            referencedRelation: 'contests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'calorie_goals_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      checkins: {
        Row: {
          completed_at: string | null
          contest_id: string
          created_at: string
          id: string
          notes: string | null
          photo_url: string | null
          profile_id: string
          week_no: number
        }
        Insert: {
          completed_at?: string | null
          contest_id: string
          created_at?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          profile_id: string
          week_no: number
        }
        Update: {
          completed_at?: string | null
          contest_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          profile_id?: string
          week_no?: number
        }
        Relationships: [
          {
            foreignKeyName: 'checkins_contest_id_fkey'
            columns: ['contest_id']
            isOneToOne: false
            referencedRelation: 'contests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'checkins_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      contest_invites: {
        Row: {
          accepted_at: string | null
          color: string | null
          contest_id: string
          created_at: string
          email: string
          id: string
          invited_by: string | null
        }
        Insert: {
          accepted_at?: string | null
          color?: string | null
          contest_id: string
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
        }
        Update: {
          accepted_at?: string | null
          color?: string | null
          contest_id?: string
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'contest_invites_contest_id_fkey'
            columns: ['contest_id']
            isOneToOne: false
            referencedRelation: 'contests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contest_invites_invited_by_fkey'
            columns: ['invited_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      contest_participants: {
        Row: {
          color: string | null
          contest_id: string
          id: string
          joined_at: string
          profile_id: string
          status: Database['public']['Enums']['participant_status']
        }
        Insert: {
          color?: string | null
          contest_id: string
          id?: string
          joined_at?: string
          profile_id: string
          status?: Database['public']['Enums']['participant_status']
        }
        Update: {
          color?: string | null
          contest_id?: string
          id?: string
          joined_at?: string
          profile_id?: string
          status?: Database['public']['Enums']['participant_status']
        }
        Relationships: [
          {
            foreignKeyName: 'contest_participants_contest_id_fkey'
            columns: ['contest_id']
            isOneToOne: false
            referencedRelation: 'contests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contest_participants_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      contests: {
        Row: {
          cheat_total_allowance: number
          checkin_weeks: number[]
          created_at: string
          created_by: string | null
          default_daily_calorie_goal: number
          end_date: string
          id: string
          name: string
          num_weeks: number
          start_date: string
          status: Database['public']['Enums']['contest_status']
          updated_at: string
          weekly_calorie_cap: number
          weekly_gym_target: number
        }
        Insert: {
          cheat_total_allowance?: number
          checkin_weeks?: number[]
          created_at?: string
          created_by?: string | null
          default_daily_calorie_goal?: number
          end_date: string
          id?: string
          name: string
          num_weeks: number
          start_date: string
          status?: Database['public']['Enums']['contest_status']
          updated_at?: string
          weekly_calorie_cap?: number
          weekly_gym_target?: number
        }
        Update: {
          cheat_total_allowance?: number
          checkin_weeks?: number[]
          created_at?: string
          created_by?: string | null
          default_daily_calorie_goal?: number
          end_date?: string
          id?: string
          name?: string
          num_weeks?: number
          start_date?: string
          status?: Database['public']['Enums']['contest_status']
          updated_at?: string
          weekly_calorie_cap?: number
          weekly_gym_target?: number
        }
        Relationships: [
          {
            foreignKeyName: 'contests_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      daily_logs: {
        Row: {
          calories: number
          cheat: boolean
          coffees: number
          contest_id: string
          created_at: string
          gym: boolean
          id: string
          junk_calories: number
          log_date: string
          muscles: Database['public']['Enums']['muscle_group'][]
          profile_id: string
          protein_g: number
          updated_at: string
        }
        Insert: {
          calories?: number
          cheat?: boolean
          coffees?: number
          contest_id: string
          created_at?: string
          gym?: boolean
          id?: string
          junk_calories?: number
          log_date: string
          muscles?: Database['public']['Enums']['muscle_group'][]
          profile_id: string
          protein_g?: number
          updated_at?: string
        }
        Update: {
          calories?: number
          cheat?: boolean
          coffees?: number
          contest_id?: string
          created_at?: string
          gym?: boolean
          id?: string
          junk_calories?: number
          log_date?: string
          muscles?: Database['public']['Enums']['muscle_group'][]
          profile_id?: string
          protein_g?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'daily_logs_contest_id_fkey'
            columns: ['contest_id']
            isOneToOne: false
            referencedRelation: 'contests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'daily_logs_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string
          handle: string | null
          id: string
          reminder_time: string | null
          reminders_enabled: boolean
          theme: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          email: string
          handle?: string | null
          id: string
          reminder_time?: string | null
          reminders_enabled?: boolean
          theme?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string
          handle?: string | null
          id?: string
          reminder_time?: string | null
          reminders_enabled?: boolean
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_series_standings: {
        Row: {
          contest_id: string | null
          profile_id: string | null
          rounds_won: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'contest_participants_contest_id_fkey'
            columns: ['contest_id']
            isOneToOne: false
            referencedRelation: 'contests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contest_participants_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      v_weekly_participant_summary: {
        Row: {
          avg_protein: number | null
          cheats: number | null
          contest_id: string | null
          days_logged: number | null
          gym_sessions: number | null
          profile_id: string | null
          total_calories: number | null
          total_junk: number | null
          total_protein: number | null
          week_no: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'daily_logs_contest_id_fkey'
            columns: ['contest_id']
            isOneToOne: false
            referencedRelation: 'contests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'daily_logs_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      v_weekly_results: {
        Row: {
          cal_hit: boolean | null
          complete: boolean | null
          contest_id: string | null
          gym_hit: boolean | null
          is_winner: boolean | null
          points: number | null
          profile_id: string | null
          total_calories: number | null
          week_decided: boolean | null
          week_no: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'daily_logs_contest_id_fkey'
            columns: ['contest_id']
            isOneToOne: false
            referencedRelation: 'contests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'daily_logs_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      v_weekly_scored: {
        Row: {
          avg_protein: number | null
          cal_hit: boolean | null
          cheats: number | null
          complete: boolean | null
          contest_id: string | null
          days_logged: number | null
          gym_hit: boolean | null
          gym_sessions: number | null
          points: number | null
          profile_id: string | null
          total_calories: number | null
          total_junk: number | null
          total_protein: number | null
          week_no: number | null
          weekly_calorie_cap: number | null
          weekly_gym_target: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'daily_logs_contest_id_fkey'
            columns: ['contest_id']
            isOneToOne: false
            referencedRelation: 'contests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'daily_logs_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {
      accept_invite: { Args: { p_invite_id: string }; Returns: undefined }
      decline_invite: { Args: { p_invite_id: string }; Returns: undefined }
      get_my_challenges: {
        Args: Record<string, never>
        Returns: {
          color: string
          contest_id: string
          contest_name: string
          created_at: string
          invite_id: string
          inviter_name: string
        }[]
      }
      is_contest_member: { Args: { _contest_id: string }; Returns: boolean }
      is_contest_owner: { Args: { _contest_id: string }; Returns: boolean }
      shares_contest_with: { Args: { _other: string }; Returns: boolean }
    }
    Enums: {
      contest_status: 'draft' | 'active' | 'finished' | 'archived'
      muscle_group:
        | 'Chest'
        | 'Back'
        | 'Shoulders'
        | 'Biceps'
        | 'Triceps'
        | 'Legs'
        | 'Abs'
        | 'Cardio'
      participant_status: 'active' | 'invited' | 'left'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
