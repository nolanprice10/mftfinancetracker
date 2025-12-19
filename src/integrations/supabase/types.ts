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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      connected_accounts: {
        Row: {
          access_token: string | null
          connected_at: string | null
          expires_at: string | null
          id: string
          provider: string
          provider_account_id: string
          provider_email: string | null
          refresh_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connected_at?: string | null
          expires_at?: string | null
          id?: string
          provider: string
          provider_account_id: string
          provider_email?: string | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          connected_at?: string | null
          expires_at?: string | null
          id?: string
          provider?: string
          provider_account_id?: string
          provider_email?: string | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          account_id: string | null
          created_at: string | null
          current_amount: number | null
          end_date: string
          id: string
          name: string
          notes: string | null
          start_date: string
          target_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          current_amount?: number | null
          end_date: string
          id?: string
          name: string
          notes?: string | null
          start_date: string
          target_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          current_amount?: number | null
          end_date?: string
          id?: string
          name?: string
          notes?: string | null
          start_date?: string
          target_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          annual_apy: number | null
          annual_return_pct: number | null
          created_at: string | null
          current_value: number | null
          id: string
          monthly_contribution: number | null
          name: string
          purchase_price_per_share: number | null
          shares_owned: number | null
          source_account_id: string | null
          ticker_symbol: string | null
          type: Database["public"]["Enums"]["investment_type"]
          updated_at: string | null
          user_id: string
          years_remaining: number | null
        }
        Insert: {
          annual_apy?: number | null
          annual_return_pct?: number | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          monthly_contribution?: number | null
          name: string
          purchase_price_per_share?: number | null
          shares_owned?: number | null
          source_account_id?: string | null
          ticker_symbol?: string | null
          type: Database["public"]["Enums"]["investment_type"]
          updated_at?: string | null
          user_id: string
          years_remaining?: number | null
        }
        Update: {
          annual_apy?: number | null
          annual_return_pct?: number | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          monthly_contribution?: number | null
          name?: string
          purchase_price_per_share?: number | null
          shares_owned?: number | null
          source_account_id?: string | null
          ticker_symbol?: string | null
          type?: Database["public"]["Enums"]["investment_type"]
          updated_at?: string | null
          user_id?: string
          years_remaining?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "investments_source_account_id_fkey"
            columns: ["source_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          steps_completed: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          steps_completed?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          steps_completed?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birthday: string | null
          created_at: string | null
          default_account_id: string | null
          email: string | null
          id: string
          name: string | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          birthday?: string | null
          created_at?: string | null
          default_account_id?: string | null
          email?: string | null
          id: string
          name?: string | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          birthday?: string | null
          created_at?: string | null
          default_account_id?: string | null
          email?: string | null
          id?: string
          name?: string | null
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_user_id: string | null
          referral_code: string
          referred_email: string | null
          status: string
          reward_granted: boolean
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_user_id?: string | null
          referral_code: string
          referred_email?: string | null
          status?: string
          reward_granted?: boolean
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_user_id?: string | null
          referral_code?: string
          referred_email?: string | null
          status?: string
          reward_granted?: boolean
          created_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
      user_referral_codes: {
        Row: {
          id: string
          user_id: string
          referral_code: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          referral_code: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          referral_code?: string
          created_at?: string
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          id: string
          user_id: string
          reward_type: string
          reward_description: string
          expires_at: string | null
          is_active: boolean
          granted_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reward_type: string
          reward_description: string
          expires_at?: string | null
          is_active?: boolean
          granted_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reward_type?: string
          reward_description?: string
          expires_at?: string | null
          is_active?: boolean
          granted_at?: string
          created_at?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          action_payload: Json | null
          active: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          message: string
          source: string | null
          type: Database["public"]["Enums"]["recommendation_type"]
          user_id: string
        }
        Insert: {
          action_payload?: Json | null
          active?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message: string
          source?: string | null
          type: Database["public"]["Enums"]["recommendation_type"]
          user_id: string
        }
        Update: {
          action_payload?: Json | null
          active?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          source?: string | null
          type?: Database["public"]["Enums"]["recommendation_type"]
          user_id?: string
        }
        Relationships: []
      }
      risk_profiles: {
        Row: {
          created_at: string | null
          id: string
          quiz_responses: Json | null
          recommended_profile: string | null
          risk_capacity: string | null
          risk_tolerance: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          quiz_responses?: Json | null
          recommended_profile?: string | null
          risk_capacity?: string | null
          risk_tolerance?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          quiz_responses?: Json | null
          recommended_profile?: string | null
          risk_capacity?: string | null
          risk_tolerance?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      spending_limits: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          limit_amount: number
          period_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          limit_amount: number
          period_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          limit_amount?: number
          period_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category: string
          created_at: string | null
          date: string
          goal_id: string | null
          id: string
          notes: string | null
          related_transaction_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category: string
          created_at?: string | null
          date: string
          goal_id?: string | null
          id?: string
          notes?: string | null
          related_transaction_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          goal_id?: string | null
          id?: string
          notes?: string | null
          related_transaction_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_type: "checking" | "savings" | "brokerage" | "retirement" | "cash"
      investment_type:
        | "roth_ira"
        | "taxable_etf"
        | "index_fund"
        | "savings"
        | "other"
        | "individual_stock"
        | "crypto"
      recommendation_type: "spending" | "saving" | "investment" | "goal"
      transaction_type: "income" | "expense" | "transfer"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["checking", "savings", "brokerage", "retirement", "cash"],
      investment_type: [
        "roth_ira",
        "taxable_etf",
        "index_fund",
        "savings",
        "other",
        "individual_stock",
        "crypto",
      ],
      recommendation_type: ["spending", "saving", "investment", "goal"],
      transaction_type: ["income", "expense", "transfer"],
    },
  },
} as const
