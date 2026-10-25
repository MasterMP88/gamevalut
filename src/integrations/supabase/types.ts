export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      content_history: {
        Row: { user_id: string; content_id: string; seen_at: string }
        Insert: { user_id: string; content_id: string; seen_at?: string }
        Update: { user_id?: string; content_id?: string; seen_at?: string }
        Relationships: []
      }
      ai_budget_config: {
        Row: {
          enabled: boolean
          id: string
          monthly_reserved_microusd_cap: number
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          id: string
          monthly_reserved_microusd_cap?: number
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          id?: string
          monthly_reserved_microusd_cap?: number
          updated_at?: string
        }
        Relationships: []
      }
      ai_global_usage_monthly: {
        Row: {
          calls: number
          period_start: string
          reserved_microusd: number
          units: number
          updated_at: string
        }
        Insert: {
          calls?: number
          period_start: string
          reserved_microusd?: number
          units?: number
          updated_at?: string
        }
        Update: {
          calls?: number
          period_start?: string
          reserved_microusd?: number
          units?: number
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage_monthly: {
        Row: {
          calls: number
          capability: string
          period_start: string
          reserved_microusd: number
          units: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calls?: number
          capability: string
          period_start: string
          reserved_microusd?: number
          units?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calls?: number
          capability?: string
          period_start?: string
          reserved_microusd?: number
          units?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_versions: {
        Row: {
          game_id: string
          notes: string | null
          released_at: string
          version: number
        }
        Insert: {
          game_id: string
          notes?: string | null
          released_at?: string
          version: number
        }
        Update: {
          game_id?: string
          notes?: string | null
          released_at?: string
          version?: number
        }
        Relationships: []
      }
      entitlements: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          product_key: string
          source: string
          starts_at: string
          status: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          product_key: string
          source?: string
          starts_at?: string
          status?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          product_key?: string
          source?: string
          starts_at?: string
          status?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          chapter: number | null
          completed_at: string | null
          content_version: number
          current_player: number
          energies: Json | null
          game_id: string
          game_slug: string
          history: Json
          id: string
          intensity: number | null
          revision: number
          scene_number: number
          scores: Json | null
          started_at: string
          state: Json
          state_version: number
          status: string
          steer: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter?: number | null
          completed_at?: string | null
          content_version: number
          current_player?: number
          energies?: Json | null
          game_id: string
          game_slug: string
          history?: Json
          id?: string
          intensity?: number | null
          revision?: number
          scene_number?: number
          scores?: Json | null
          started_at?: string
          state: Json
          state_version?: number
          status?: string
          steer?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter?: number | null
          completed_at?: string | null
          content_version?: number
          current_player?: number
          energies?: Json | null
          game_id?: string
          game_slug?: string
          history?: Json
          id?: string
          intensity?: number | null
          revision?: number
          scene_number?: number
          scores?: Json | null
          started_at?: string
          state?: Json
          state_version?: number
          status?: string
          steer?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      preferences: {
        Row: {
          locale: string
          player_names: Json
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          locale?: string
          player_names?: Json
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          locale?: string
          player_names?: Json
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_confirmed_at: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          age_confirmed_at?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          age_confirmed_at?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_moments: {
        Row: {
          body: string
          created_at: string
          game_id: string
          id: string
          scene_title: string | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          game_id: string
          id?: string
          scene_title?: string | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          game_id?: string
          id?: string
          scene_title?: string | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_moments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          created_at: string
          error: string | null
          event_id: string
          event_type: string
          processed_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_id: string
          event_type: string
          processed_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          event_id?: string
          event_type?: string
          processed_at?: string | null
          status?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan_key: string
          provider: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_key: string
          provider: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_key?: string
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ai_refund_usage: {
        Args: {
          p_capability: string
          p_reserved_microusd: number
          p_units: number
          p_user_id: string
        }
        Returns: undefined
      }
      ai_reserve_usage: {
        Args: {
          p_capability: string
          p_global_reserved_microusd_limit: number
          p_reserved_microusd: number
          p_units: number
          p_user_call_limit: number
          p_user_id: string
          p_user_unit_limit: number
        }
        Returns: Json
      }
      gang_collect_stage_actions: {
        Args: { p_player_token: string; p_round_key: string; p_stage: string }
        Returns: Json
      }
      gang_create_room: {
        Args: {
          p_device_kind?: string
          p_display_name: string
          p_entry_mode?: string
          p_max_players?: number
        }
        Returns: Json
      }
      gang_get_private: {
        Args: { p_player_token: string; p_round_key: string }
        Returns: Json
      }
      gang_join_display: {
        Args: { p_code: string; p_device_kind?: string }
        Returns: Json
      }
      gang_join_room: {
        Args: { p_code: string; p_device_kind?: string; p_display_name: string }
        Returns: Json
      }
      gang_leave_room: { Args: { p_player_token: string }; Returns: Json }
      gang_load_runtime: { Args: { p_player_token: string }; Returns: Json }
      gang_reveal_round_data: {
        Args: {
          p_player_token: string
          p_round_key: string
          p_source_stage: string
        }
        Returns: Json
      }
      gang_room_snapshot: { Args: { p_player_token: string }; Returns: Json }
      gang_save_runtime: {
        Args: { p_player_token: string; p_runtime_state: Json }
        Returns: Json
      }
      gang_set_private_payloads: {
        Args: { p_payloads: Json; p_player_token: string; p_round_key: string }
        Returns: Json
      }
      gang_set_room_state: {
        Args: {
          p_expected_version: number
          p_game_id: string
          p_phase: string
          p_player_token: string
          p_public_state: Json
          p_round_key: string
          p_stage: string
        }
        Returns: Json
      }
      gang_stage_progress: { Args: { p_player_token: string }; Returns: Json }
      gang_submit_action: {
        Args: {
          p_action_type: string
          p_payload: Json
          p_player_token: string
          p_round_key: string
          p_stage: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
