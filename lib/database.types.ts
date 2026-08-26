// Generated from the Supabase schema; do not edit by hand.
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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      approvals: {
        Row: {
          amount_minor: number
          business_id: string
          due_date: string | null
          id: string
          kind: Database["public"]["Enums"]["approval_kind"]
          requested_by: string
          status: Database["public"]["Enums"]["approval_status"]
          title: string
        }
        Insert: {
          amount_minor: number
          business_id: string
          due_date?: string | null
          id?: string
          kind: Database["public"]["Enums"]["approval_kind"]
          requested_by: string
          status?: Database["public"]["Enums"]["approval_status"]
          title: string
        }
        Update: {
          amount_minor?: number
          business_id?: string
          due_date?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["approval_kind"]
          requested_by?: string
          status?: Database["public"]["Enums"]["approval_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_name: string
          actor_type: Database["public"]["Enums"]["audit_actor_type"]
          created_at: string
          id: string
          target: string
        }
        Insert: {
          action: string
          actor_name: string
          actor_type: Database["public"]["Enums"]["audit_actor_type"]
          created_at?: string
          id?: string
          target: string
        }
        Update: {
          action?: string
          actor_name?: string
          actor_type?: Database["public"]["Enums"]["audit_actor_type"]
          created_at?: string
          id?: string
          target?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle_type"]
          created_at: string
          currency: string
          id: string
          name: string
          owner_user_id: string
          plan: Database["public"]["Enums"]["plan_type"]
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle_type"]
          created_at?: string
          currency?: string
          id?: string
          name: string
          owner_user_id: string
          plan?: Database["public"]["Enums"]["plan_type"]
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle_type"]
          created_at?: string
          currency?: string
          id?: string
          name?: string
          owner_user_id?: string
          plan?: Database["public"]["Enums"]["plan_type"]
        }
        Relationships: []
      }
      categories: {
        Row: {
          business_id: string | null
          id: string
          kind: Database["public"]["Enums"]["category_kind"]
          name: string
        }
        Insert: {
          business_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["category_kind"]
          name: string
        }
        Update: {
          business_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["category_kind"]
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      category_keyword_rules: {
        Row: {
          category_id: string
          id: string
          keyword: string
        }
        Insert: {
          category_id: string
          id?: string
          keyword: string
        }
        Update: {
          category_id?: string
          id?: string
          keyword?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_keyword_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          business_id: string
          contact_email: string | null
          contact_whatsapp: string | null
          id: string
          name: string
          source: string | null
        }
        Insert: {
          business_id: string
          contact_email?: string | null
          contact_whatsapp?: string | null
          id?: string
          name: string
          source?: string | null
        }
        Update: {
          business_id?: string
          contact_email?: string | null
          contact_whatsapp?: string | null
          id?: string
          name?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_accounts: {
        Row: {
          business_id: string
          created_by: string | null
          enabled: boolean
          encrypted_credentials: string | null
          forwarding_token_hash: string | null
          id: string
          last_synced_at: string | null
          metadata: Json
          provider: Database["public"]["Enums"]["account_provider"]
          status: Database["public"]["Enums"]["connection_status"]
        }
        Insert: {
          business_id: string
          created_by?: string | null
          enabled?: boolean
          encrypted_credentials?: string | null
          forwarding_token_hash?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json
          provider: Database["public"]["Enums"]["account_provider"]
          status?: Database["public"]["Enums"]["connection_status"]
        }
        Update: {
          business_id?: string
          created_by?: string | null
          enabled?: boolean
          encrypted_credentials?: string | null
          forwarding_token_hash?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json
          provider?: Database["public"]["Enums"]["account_provider"]
          status?: Database["public"]["Enums"]["connection_status"]
        }
        Relationships: [
          {
            foreignKeyName: "connected_accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          discount_description: string
          expires_at: string | null
          id: string
          redemption_count: number
          redemption_limit: number | null
        }
        Insert: {
          code: string
          discount_description: string
          expires_at?: string | null
          id?: string
          redemption_count?: number
          redemption_limit?: number | null
        }
        Update: {
          code?: string
          discount_description?: string
          expires_at?: string | null
          id?: string
          redemption_count?: number
          redemption_limit?: number | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          enabled: boolean
          key: string
          rollout_plan: string[]
        }
        Insert: {
          enabled?: boolean
          key: string
          rollout_plan?: string[]
        }
        Update: {
          enabled?: boolean
          key?: string
          rollout_plan?: string[]
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_minor: number
          business_id: string
          client_id: string
          currency: string
          due_date: string
          id: string
          invoice_number: string
          status: Database["public"]["Enums"]["invoice_status"]
        }
        Insert: {
          amount_minor: number
          business_id: string
          client_id: string
          currency: string
          due_date: string
          id?: string
          invoice_number: string
          status?: Database["public"]["Enums"]["invoice_status"]
        }
        Update: {
          amount_minor?: number
          business_id?: string
          client_id?: string
          currency?: string
          due_date?: string
          id?: string
          invoice_number?: string
          status?: Database["public"]["Enums"]["invoice_status"]
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_cache: {
        Row: {
          business_id: string
          category_id: string
          id: string
          last_matched_at: string | null
          match_count: number
          merchant_pattern: string
        }
        Insert: {
          business_id: string
          category_id: string
          id?: string
          last_matched_at?: string | null
          match_count?: number
          merchant_pattern: string
        }
        Update: {
          business_id?: string
          category_id?: string
          id?: string
          last_matched_at?: string | null
          match_count?: number
          merchant_pattern?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_cache_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_cache_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          business_id: string
          created_at: string
          id: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          body: string
          business_id: string
          created_at?: string
          id?: string
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          body?: string
          business_id?: string
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      parsing_failures: {
        Row: {
          business_id: string | null
          created_at: string
          encrypted_raw_body: string | null
          id: string
          provider: Database["public"]["Enums"]["account_provider"]
          reason: string
          source_id: string | null
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          encrypted_raw_body?: string | null
          id?: string
          provider: Database["public"]["Enums"]["account_provider"]
          reason: string
          source_id?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          encrypted_raw_body?: string | null
          id?: string
          provider?: Database["public"]["Enums"]["account_provider"]
          reason?: string
          source_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parsing_failures_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staging_transactions: {
        Row: {
          amount_minor: number
          business_id: string
          counterparty: string | null
          created_at: string
          currency: string
          description: string
          direction: Database["public"]["Enums"]["transaction_direction"]
          encrypted_raw_body: string | null
          error: string | null
          id: string
          occurred_at: string
          processed_at: string | null
          provider: Database["public"]["Enums"]["account_provider"]
          source_id: string
          status: Database["public"]["Enums"]["ingestion_status"]
          user_id: string
        }
        Insert: {
          amount_minor: number
          business_id: string
          counterparty?: string | null
          created_at?: string
          currency: string
          description: string
          direction: Database["public"]["Enums"]["transaction_direction"]
          encrypted_raw_body?: string | null
          error?: string | null
          id?: string
          occurred_at: string
          processed_at?: string | null
          provider: Database["public"]["Enums"]["account_provider"]
          source_id: string
          status?: Database["public"]["Enums"]["ingestion_status"]
          user_id: string
        }
        Update: {
          amount_minor?: number
          business_id?: string
          counterparty?: string | null
          created_at?: string
          currency?: string
          description?: string
          direction?: Database["public"]["Enums"]["transaction_direction"]
          encrypted_raw_body?: string | null
          error?: string | null
          id?: string
          occurred_at?: string
          processed_at?: string | null
          provider?: Database["public"]["Enums"]["account_provider"]
          source_id?: string
          status?: Database["public"]["Enums"]["ingestion_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staging_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          business_id: string
          current_period_end: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          business_id: string
          current_period_end?: string | null
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          business_id?: string
          current_period_end?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          business_id: string
          invited_email: string | null
          joined_at: string | null
          role: Database["public"]["Enums"]["team_role"]
          status: Database["public"]["Enums"]["team_status"]
          user_id: string | null
        }
        Insert: {
          business_id: string
          invited_email?: string | null
          joined_at?: string | null
          role: Database["public"]["Enums"]["team_role"]
          status?: Database["public"]["Enums"]["team_status"]
          user_id?: string | null
        }
        Update: {
          business_id?: string
          invited_email?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          status?: Database["public"]["Enums"]["team_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_minor: number
          business_id: string
          category_id: string | null
          confidence: Database["public"]["Enums"]["transaction_confidence"]
          created_at: string
          currency: string
          description: string
          direction: Database["public"]["Enums"]["transaction_direction"]
          id: string
          occurred_at: string
          raw_source_id: string
          source_provider: Database["public"]["Enums"]["account_provider"]
          status: Database["public"]["Enums"]["transaction_status"]
          user_id: string
        }
        Insert: {
          amount_minor: number
          business_id: string
          category_id?: string | null
          confidence: Database["public"]["Enums"]["transaction_confidence"]
          created_at?: string
          currency: string
          description: string
          direction: Database["public"]["Enums"]["transaction_direction"]
          id?: string
          occurred_at: string
          raw_source_id: string
          source_provider: Database["public"]["Enums"]["account_provider"]
          status?: Database["public"]["Enums"]["transaction_status"]
          user_id: string
        }
        Update: {
          amount_minor?: number
          business_id?: string
          category_id?: string | null
          confidence?: Database["public"]["Enums"]["transaction_confidence"]
          created_at?: string
          currency?: string
          description?: string
          direction?: Database["public"]["Enums"]["transaction_direction"]
          id?: string
          occurred_at?: string
          raw_source_id?: string
          source_provider?: Database["public"]["Enums"]["account_provider"]
          status?: Database["public"]["Enums"]["transaction_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bump_merchant_cache: { Args: { cache_id: string }; Returns: undefined }
      create_business: {
        Args: {
          business_currency?: string
          business_name: string
          business_plan?: Database["public"]["Enums"]["plan_type"]
          cycle?: Database["public"]["Enums"]["billing_cycle_type"]
        }
        Returns: string
      }
      is_active_member: {
        Args: { bid: string; uid?: string }
        Returns: boolean
      }
      is_business_owner: {
        Args: { bid: string; uid?: string }
        Returns: boolean
      }
      is_staff: { Args: { uid?: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      account_provider:
        | "gmail"
        | "payoneer"
        | "wise"
        | "upwork"
        | "fiverr"
        | "jazzcash"
        | "easypaisa"
        | "bank_sms"
        | "whatsapp"
      approval_kind: "bill" | "payout"
      approval_status: "pending" | "approved" | "declined"
      audit_actor_type: "staff" | "system"
      billing_cycle_type: "monthly" | "yearly"
      category_kind: "income" | "expense"
      connection_status: "connected" | "disconnected" | "error"
      ingestion_status: "pending" | "processing" | "processed" | "failed"
      invoice_status: "paid" | "pending" | "overdue"
      notification_type: "pay" | "rem" | "alert" | "team"
      plan_type: "khata" | "pro" | "teams"
      team_role: "owner" | "member"
      team_status: "active" | "pending"
      transaction_confidence: "high" | "med" | "low" | "learned"
      transaction_direction: "credit" | "debit"
      transaction_status: "ok" | "review"
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
      account_provider: [
        "gmail",
        "payoneer",
        "wise",
        "upwork",
        "fiverr",
        "jazzcash",
        "easypaisa",
        "bank_sms",
        "whatsapp",
      ],
      approval_kind: ["bill", "payout"],
      approval_status: ["pending", "approved", "declined"],
      audit_actor_type: ["staff", "system"],
      billing_cycle_type: ["monthly", "yearly"],
      category_kind: ["income", "expense"],
      connection_status: ["connected", "disconnected", "error"],
      ingestion_status: ["pending", "processing", "processed", "failed"],
      invoice_status: ["paid", "pending", "overdue"],
      notification_type: ["pay", "rem", "alert", "team"],
      plan_type: ["khata", "pro", "teams"],
      team_role: ["owner", "member"],
      team_status: ["active", "pending"],
      transaction_confidence: ["high", "med", "low", "learned"],
      transaction_direction: ["credit", "debit"],
      transaction_status: ["ok", "review"],
    },
  },
} as const
