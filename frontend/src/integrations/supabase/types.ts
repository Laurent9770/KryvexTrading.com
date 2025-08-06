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
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          country: string | null
          date_of_birth: string | null
          account_balance: number
          is_verified: boolean
          kyc_status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
          account_status: 'active' | 'suspended' | 'blocked'
          suspension_reason: string | null
          suspended_until: string | null
          last_login: string | null
          login_attempts: number
          trade_outcome_mode: 'default' | 'force_win' | 'force_loss'
          trade_outcome_applies_to: 'all_trades' | 'new_trades'
          trade_outcome_reason: string | null
          trade_outcome_enabled_at: string | null
          trade_outcome_enabled_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          country?: string | null
          date_of_birth?: string | null
          account_balance?: number
          is_verified?: boolean
          kyc_status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
          account_status?: 'active' | 'suspended' | 'blocked'
          suspension_reason?: string | null
          suspended_until?: string | null
          last_login?: string | null
          login_attempts?: number
          trade_outcome_mode?: 'default' | 'force_win' | 'force_loss'
          trade_outcome_applies_to?: 'all_trades' | 'new_trades'
          trade_outcome_reason?: string | null
          trade_outcome_enabled_at?: string | null
          trade_outcome_enabled_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          country?: string | null
          date_of_birth?: string | null
          account_balance?: number
          is_verified?: boolean
          kyc_status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
          account_status?: 'active' | 'suspended' | 'blocked'
          suspension_reason?: string | null
          suspended_until?: string | null
          last_login?: string | null
          login_attempts?: number
          trade_outcome_mode?: 'default' | 'force_win' | 'force_loss'
          trade_outcome_applies_to?: 'all_trades' | 'new_trades'
          trade_outcome_reason?: string | null
          trade_outcome_enabled_at?: string | null
          trade_outcome_enabled_by?: string | null
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'user'
        }
        Insert: {
          id?: string
          user_id: string
          role?: 'admin' | 'user'
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'user'
        }
      }
      kyc_documents: {
        Row: {
          id: string
          user_id: string
          document_type: 'passport' | 'drivers_license' | 'national_id'
          document_front_url: string
          document_back_url: string | null
          selfie_url: string
          status: 'pending' | 'approved' | 'rejected'
          admin_notes: string | null
          submitted_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          document_type: 'passport' | 'drivers_license' | 'national_id'
          document_front_url: string
          document_back_url?: string | null
          selfie_url: string
          status?: 'pending' | 'approved' | 'rejected'
          admin_notes?: string | null
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          document_type?: 'passport' | 'drivers_license' | 'national_id'
          document_front_url?: string
          document_back_url?: string | null
          selfie_url?: string
          status?: 'pending' | 'approved' | 'rejected'
          admin_notes?: string | null
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
      }
      trading_pairs: {
        Row: {
          id: string
          symbol: string
          base_currency: string
          quote_currency: string
          current_price: number
          price_change_24h: number
          volume_24h: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          symbol: string
          base_currency: string
          quote_currency: string
          current_price: number
          price_change_24h?: number
          volume_24h?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          symbol?: string
          base_currency?: string
          quote_currency?: string
          current_price?: number
          price_change_24h?: number
          volume_24h?: number
          is_active?: boolean
          created_at?: string
        }
      }
      trades: {
        Row: {
          id: string
          user_id: string
          trading_pair_id: string
          trade_type: 'buy' | 'sell'
          amount: number
          price: number
          total_value: number
          status: 'pending' | 'completed' | 'cancelled'
          result: 'win' | 'loss' | 'pending' | null
          profit_loss: number
          created_at: string
          completed_at: string | null
          forced_outcome: boolean
        }
        Insert: {
          id?: string
          user_id: string
          trading_pair_id: string
          trade_type: 'buy' | 'sell'
          amount: number
          price: number
          total_value: number
          status?: 'pending' | 'completed' | 'cancelled'
          result?: 'win' | 'loss' | 'pending' | null
          profit_loss?: number
          created_at?: string
          completed_at?: string | null
          forced_outcome?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          trading_pair_id?: string
          trade_type?: 'buy' | 'sell'
          amount?: number
          price?: number
          total_value?: number
          status?: 'pending' | 'completed' | 'cancelled'
          result?: 'win' | 'loss' | 'pending' | null
          profit_loss?: number
          created_at?: string
          completed_at?: string | null
          forced_outcome?: boolean
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          transaction_type: 'deposit' | 'withdrawal' | 'trade_profit' | 'trade_loss'
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed' | 'cancelled'
          payment_method: string | null
          transaction_hash: string | null
          admin_notes: string | null
          processed_by: string | null
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          transaction_type: 'deposit' | 'withdrawal' | 'trade_profit' | 'trade_loss'
          amount: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          payment_method?: string | null
          transaction_hash?: string | null
          admin_notes?: string | null
          processed_by?: string | null
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          transaction_type?: 'deposit' | 'withdrawal' | 'trade_profit' | 'trade_loss'
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          payment_method?: string | null
          transaction_hash?: string | null
          admin_notes?: string | null
          processed_by?: string | null
          created_at?: string
          processed_at?: string | null
        }
      }
      support_tickets: {
        Row: {
          id: string
          user_id: string
          subject: string
          status: 'open' | 'in_progress' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          status?: 'open' | 'in_progress' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          status?: 'open' | 'in_progress' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      support_messages: {
        Row: {
          id: string
          ticket_id: string
          sender_id: string
          message: string
          attachments: Json
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          sender_id: string
          message: string
          attachments?: Json
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          sender_id?: string
          message?: string
          attachments?: Json
          is_admin?: boolean
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          is_read: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: 'info' | 'success' | 'warning' | 'error'
          is_read?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error'
          is_read?: boolean
          created_by?: string | null
          created_at?: string
        }
      }
      admin_actions: {
        Row: {
          id: string
          admin_id: string
          action_type: string
          target_user_id: string | null
          target_table: string | null
          target_id: string | null
          old_values: Json | null
          new_values: Json | null
          description: string
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action_type: string
          target_user_id?: string | null
          target_table?: string | null
          target_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          description: string
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action_type?: string
          target_user_id?: string | null
          target_table?: string | null
          target_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          description?: string
          ip_address?: string | null
          created_at?: string
        }
      }
      admin_notifications: {
        Row: {
          id: string
          admin_id: string
          target_user_id: string | null
          title: string
          message: string
          notification_type: 'info' | 'warning' | 'success' | 'error'
          is_broadcast: boolean
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          target_user_id?: string | null
          title: string
          message: string
          notification_type?: 'info' | 'warning' | 'success' | 'error'
          is_broadcast?: boolean
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          target_user_id?: string | null
          title?: string
          message?: string
          notification_type?: 'info' | 'warning' | 'success' | 'error'
          is_broadcast?: boolean
          is_read?: boolean
          created_at?: string
        }
      }
      wallet_adjustments: {
        Row: {
          id: string
          user_id: string
          admin_id: string
          adjustment_type: 'add' | 'subtract'
          amount: number
          currency: string
          reason: string
          previous_balance: number
          new_balance: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          admin_id: string
          adjustment_type: 'add' | 'subtract'
          amount: number
          currency?: string
          reason: string
          previous_balance: number
          new_balance: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          admin_id?: string
          adjustment_type?: 'add' | 'subtract'
          amount?: number
          currency?: string
          reason?: string
          previous_balance?: number
          new_balance?: number
          created_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string | null
          ip_address: string | null
          user_agent: string | null
          is_active: boolean
          login_at: string
          last_activity: string | null
          logout_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          session_token?: string | null
          ip_address?: string | null
          user_agent?: string | null
          is_active?: boolean
          login_at?: string
          last_activity?: string | null
          logout_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string | null
          ip_address?: string | null
          user_agent?: string | null
          is_active?: boolean
          login_at?: string
          last_activity?: string | null
          logout_at?: string | null
        }
      }
      trade_outcome_logs: {
        Row: {
          id: string
          admin_id: string
          user_id: string
          previous_mode: string
          new_mode: string
          applies_to: 'all_trades' | 'new_trades'
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          user_id: string
          previous_mode: string
          new_mode: string
          applies_to: 'all_trades' | 'new_trades'
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          user_id?: string
          previous_mode?: string
          new_mode?: string
          applies_to?: 'all_trades' | 'new_trades'
          reason?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: 'admin' | 'user'
        }
        Returns: boolean
      }
      get_user_trade_outcome_mode: {
        Args: {
          p_user_id: string
        }
        Returns: string
      }
      apply_forced_trade_outcome: {
        Args: {
          p_trade_id: string
        }
        Returns: boolean
      }
      get_trade_outcome_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          force_win_users: number
          force_loss_users: number
          default_users: number
        }[]
      }
      get_user_trade_outcome_history: {
        Args: {
          p_user_id: string
        }
        Returns: {
          log_id: string
          admin_name: string
          admin_email: string
          previous_mode: string
          new_mode: string
          applies_to: string
          reason: string | null
          created_at: string
        }[]
      }
      log_admin_action: {
        Args: {
          p_admin_id: string
          p_action_type: string
          p_target_user_id?: string
          p_target_table?: string
          p_target_id?: string
          p_old_values?: Json
          p_new_values?: Json
          p_description?: string
          p_ip_address?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: 'admin' | 'user'
    }
  }
}

// Type aliases for easier use
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Trade = Database['public']['Tables']['trades']['Row']
export type TradeInsert = Database['public']['Tables']['trades']['Insert']
export type TradeUpdate = Database['public']['Tables']['trades']['Update']

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

export type TradingPair = Database['public']['Tables']['trading_pairs']['Row']
export type TradingPairInsert = Database['public']['Tables']['trading_pairs']['Insert']
export type TradingPairUpdate = Database['public']['Tables']['trading_pairs']['Update']

export type KycDocument = Database['public']['Tables']['kyc_documents']['Row']
export type KycDocumentInsert = Database['public']['Tables']['kyc_documents']['Insert']
export type KycDocumentUpdate = Database['public']['Tables']['kyc_documents']['Update']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

export type SupportTicket = Database['public']['Tables']['support_tickets']['Row']
export type SupportTicketInsert = Database['public']['Tables']['support_tickets']['Insert']
export type SupportTicketUpdate = Database['public']['Tables']['support_tickets']['Update']

export type SupportMessage = Database['public']['Tables']['support_messages']['Row']
export type SupportMessageInsert = Database['public']['Tables']['support_messages']['Insert']
export type SupportMessageUpdate = Database['public']['Tables']['support_messages']['Update']

export type AdminAction = Database['public']['Tables']['admin_actions']['Row']
export type AdminActionInsert = Database['public']['Tables']['admin_actions']['Insert']
export type AdminActionUpdate = Database['public']['Tables']['admin_actions']['Update']

export type WalletAdjustment = Database['public']['Tables']['wallet_adjustments']['Row']
export type WalletAdjustmentInsert = Database['public']['Tables']['wallet_adjustments']['Insert']
export type WalletAdjustmentUpdate = Database['public']['Tables']['wallet_adjustments']['Update']

export type UserSession = Database['public']['Tables']['user_sessions']['Row']
export type UserSessionInsert = Database['public']['Tables']['user_sessions']['Insert']
export type UserSessionUpdate = Database['public']['Tables']['user_sessions']['Update']

export type TradeOutcomeLog = Database['public']['Tables']['trade_outcome_logs']['Row']
export type TradeOutcomeLogInsert = Database['public']['Tables']['trade_outcome_logs']['Insert']
export type TradeOutcomeLogUpdate = Database['public']['Tables']['trade_outcome_logs']['Update']
