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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      active_neighborhoods: {
        Row: {
          city: string
          created_at: string
          id: string
          is_active: boolean
          lat: number
          lng: number
          name: string
          provider_count: number
          updated_at: string
        }
        Insert: {
          city?: string
          created_at?: string
          id?: string
          is_active?: boolean
          lat: number
          lng: number
          name: string
          provider_count?: number
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_active?: boolean
          lat?: number
          lng?: number
          name?: string
          provider_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_employees: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          position: string
          position_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          position?: string
          position_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          position?: string
          position_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "job_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_report_settings: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean | null
          last_sent_at: string | null
          recipients: string[] | null
          report_type: string
          schedule: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_sent_at?: string | null
          recipients?: string[] | null
          report_type: string
          schedule?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_sent_at?: string | null
          recipients?: string[] | null
          report_type?: string
          schedule?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      app_versions: {
        Row: {
          created_at: string
          id: string
          is_current: boolean | null
          release_notes: string | null
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_current?: boolean | null
          release_notes?: string | null
          version: string
        }
        Update: {
          created_at?: string
          id?: string
          is_current?: boolean | null
          release_notes?: string | null
          version?: string
        }
        Relationships: []
      }
      commission_settings: {
        Row: {
          commission_rate: number
          created_at: string | null
          description_ar: string | null
          id: string
          is_active: boolean | null
          payment_method: string
          updated_at: string | null
        }
        Insert: {
          commission_rate?: number
          created_at?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          payment_method: string
          updated_at?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          payment_method?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_settings: {
        Row: {
          created_at: string
          email: string
          id: string
          location: string
          phone: string
          updated_at: string
          whatsapp: string
          working_hours: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          location?: string
          phone?: string
          updated_at?: string
          whatsapp?: string
          working_hours?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          location?: string
          phone?: string
          updated_at?: string
          whatsapp?: string
          working_hours?: string
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          id: string
          order_id: string | null
          used_at: string
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          id?: string
          order_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          id?: string
          order_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
        }
        Relationships: []
      }
      delivery_route_history: {
        Row: {
          id: string
          lat: number
          lng: number
          order_id: string
          recorded_at: string
          speed: number | null
        }
        Insert: {
          id?: string
          lat: number
          lng: number
          order_id: string
          recorded_at?: string
          speed?: number | null
        }
        Update: {
          id?: string
          lat?: number
          lng?: number
          order_id?: string
          recorded_at?: string
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_route_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_tracking: {
        Row: {
          created_at: string
          current_lat: number
          current_lng: number
          heading: number | null
          id: string
          order_id: string
          speed: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_lat: number
          current_lng: number
          heading?: number | null
          id?: string
          order_id: string
          speed?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_lat?: number
          current_lng?: number
          heading?: number | null
          id?: string
          order_id?: string
          speed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      edfapay_features: {
        Row: {
          config: Json | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          feature_key: string
          feature_name_ar: string
          feature_name_en: string | null
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          feature_key: string
          feature_name_ar: string
          feature_name_en?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          feature_key?: string
          feature_name_ar?: string
          feature_name_en?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      employee_activity_log: {
        Row: {
          action_description: string
          action_type: string
          created_at: string
          details: Json | null
          employee_id: string | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_table: string | null
          user_id: string
        }
        Insert: {
          action_description: string
          action_type: string
          created_at?: string
          details?: Json | null
          employee_id?: string | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_table?: string | null
          user_id: string
        }
        Update: {
          action_description?: string
          action_type?: string
          created_at?: string
          details?: Json | null
          employee_id?: string | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_table?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_activity_log_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "admin_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_claimed_rewards: {
        Row: {
          claimed_at: string | null
          employee_id: string
          id: string
          points_spent: number
          reward_id: string
          status: string | null
        }
        Insert: {
          claimed_at?: string | null
          employee_id: string
          id?: string
          points_spent: number
          reward_id: string
          status?: string | null
        }
        Update: {
          claimed_at?: string | null
          employee_id?: string
          id?: string
          points_spent?: number
          reward_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_claimed_rewards_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "admin_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_claimed_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "employee_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_contracts: {
        Row: {
          admin_signature: string | null
          admin_signed_at: string | null
          contract_number: string
          contract_type: string
          created_at: string | null
          duties: Json | null
          employee_id: string
          employee_signature: string | null
          employee_signed_at: string | null
          end_date: string | null
          id: string
          position_id: string
          salary: number
          signing_token: string | null
          signing_token_expires_at: string | null
          start_date: string
          status: string | null
          terms_ar: string | null
          terms_en: string | null
          updated_at: string | null
        }
        Insert: {
          admin_signature?: string | null
          admin_signed_at?: string | null
          contract_number: string
          contract_type?: string
          created_at?: string | null
          duties?: Json | null
          employee_id: string
          employee_signature?: string | null
          employee_signed_at?: string | null
          end_date?: string | null
          id?: string
          position_id: string
          salary: number
          signing_token?: string | null
          signing_token_expires_at?: string | null
          start_date: string
          status?: string | null
          terms_ar?: string | null
          terms_en?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_signature?: string | null
          admin_signed_at?: string | null
          contract_number?: string
          contract_type?: string
          created_at?: string | null
          duties?: Json | null
          employee_id?: string
          employee_signature?: string | null
          employee_signed_at?: string | null
          end_date?: string | null
          id?: string
          position_id?: string
          salary?: number
          signing_token?: string | null
          signing_token_expires_at?: string | null
          start_date?: string
          status?: string | null
          terms_ar?: string | null
          terms_en?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "admin_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_contracts_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "job_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_permissions: {
        Row: {
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          employee_id: string
          id: string
          permission_key: string
        }
        Insert: {
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          employee_id: string
          id?: string
          permission_key: string
        }
        Update: {
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          employee_id?: string
          id?: string
          permission_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_permissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "admin_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_points: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          last_reset_at: string | null
          monthly_points: number | null
          total_points: number | null
          updated_at: string | null
          weekly_points: number | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          last_reset_at?: string | null
          monthly_points?: number | null
          total_points?: number | null
          updated_at?: string | null
          weekly_points?: number | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          last_reset_at?: string | null
          monthly_points?: number | null
          total_points?: number | null
          updated_at?: string | null
          weekly_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_points_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "admin_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_points_history: {
        Row: {
          action_type: string
          created_at: string | null
          description: string | null
          employee_id: string
          id: string
          points: number
        }
        Insert: {
          action_type: string
          created_at?: string | null
          description?: string | null
          employee_id: string
          id?: string
          points: number
        }
        Update: {
          action_type?: string
          created_at?: string | null
          description?: string | null
          employee_id?: string
          id?: string
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_points_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "admin_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_positions: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          is_primary: boolean | null
          position_id: string
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          is_primary?: boolean | null
          position_id: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          is_primary?: boolean | null
          position_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_positions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "admin_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_positions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "job_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_rewards: {
        Row: {
          created_at: string | null
          description_ar: string | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string | null
          points_required: number
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en?: string | null
          points_required: number
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string | null
          points_required?: number
        }
        Relationships: []
      }
      invoice_settings: {
        Row: {
          address: string | null
          business_name: string | null
          business_name_en: string | null
          cr_number: string | null
          created_at: string
          email: string | null
          footer_text: string | null
          id: string
          logo_url: string | null
          phone: string | null
          primary_color: string | null
          show_qr_code: boolean | null
          show_vat_number: boolean | null
          slogan: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          business_name_en?: string | null
          cr_number?: string | null
          created_at?: string
          email?: string | null
          footer_text?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          show_qr_code?: boolean | null
          show_vat_number?: boolean | null
          slogan?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          business_name_en?: string | null
          cr_number?: string | null
          created_at?: string
          email?: string | null
          footer_text?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          show_qr_code?: boolean | null
          show_vat_number?: boolean | null
          slogan?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      job_positions: {
        Row: {
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          duties: Json | null
          id: string
          is_active: boolean | null
          permissions_template: Json | null
          salary_range_max: number | null
          salary_range_min: number | null
          title_ar: string
          title_en: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          duties?: Json | null
          id?: string
          is_active?: boolean | null
          permissions_template?: Json | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          title_ar: string
          title_en?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          duties?: Json | null
          id?: string
          is_active?: boolean | null
          permissions_template?: Json | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          title_ar?: string
          title_en?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempt_type: string
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          ip_address: string | null
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          attempt_type?: string
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          attempt_type?: string
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          created_at: string
          id: string
          lifetime_points: number
          tier: string
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lifetime_points?: number
          tier?: string
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lifetime_points?: number
          tier?: string
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          selected_options: Json | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          selected_options?: Json | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          selected_options?: Json | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_discount: number | null
          coupon_id: string | null
          created_at: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          discount_amount: number
          id: string
          notes: string | null
          order_type: Database["public"]["Enums"]["order_type"]
          payment_completed_at: string | null
          payment_method: string | null
          payment_status: string | null
          payment_transaction_id: string | null
          points_earned: number
          points_redeemed: number
          provider_id: string | null
          scheduled_for: string | null
          scheduled_notification_sent: boolean | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          coupon_discount?: number | null
          coupon_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivery_address?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          discount_amount?: number
          id?: string
          notes?: string | null
          order_type: Database["public"]["Enums"]["order_type"]
          payment_completed_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_transaction_id?: string | null
          points_earned?: number
          points_redeemed?: number
          provider_id?: string | null
          scheduled_for?: string | null
          scheduled_notification_sent?: boolean | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          coupon_discount?: number | null
          coupon_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          discount_amount?: number
          id?: string
          notes?: string | null
          order_type?: Database["public"]["Enums"]["order_type"]
          payment_completed_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_transaction_id?: string | null
          points_earned?: number
          points_redeemed?: number
          provider_id?: string | null
          scheduled_for?: string | null
          scheduled_notification_sent?: boolean | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          id: string
          order_id: string | null
          payment_method: string
          provider_response: Json | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string
          provider_response?: Json | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string
          provider_response?: Json | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      points_history: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          points_change: number
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points_change: number
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points_change?: number
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          created_at: string
          id: string
          name_ar: string
          name_en: string | null
          option_id: string
          price_modifier: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name_ar: string
          name_en?: string | null
          option_id: string
          price_modifier?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string | null
          option_id?: string
          price_modifier?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          name_ar: string
          name_en: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          name_ar: string
          name_en?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          name_ar?: string
          name_en?: string | null
        }
        Relationships: []
      }
      product_options_link: {
        Row: {
          id: string
          option_id: string
          product_id: string
        }
        Insert: {
          id?: string
          option_id: string
          product_id: string
        }
        Update: {
          id?: string
          option_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_options_link_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_options_link_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          description_ar: string | null
          id: string
          image_url: string | null
          is_available: boolean
          is_featured: boolean
          name_ar: string
          name_en: string | null
          price: number
          provider_id: string | null
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description_ar?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          name_ar: string
          name_en?: string | null
          price: number
          provider_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description_ar?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          name_ar?: string
          name_en?: string | null
          price?: number
          provider_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          referral_code: string | null
          updated_at: string
          user_id: string
          vehicle_brand: string | null
          vehicle_color: string | null
          vehicle_model: string | null
          vehicle_plate: string | null
          vehicle_year: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
          user_id: string
          vehicle_brand?: string | null
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_year?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
          user_id?: string
          vehicle_brand?: string | null
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_year?: string | null
        }
        Relationships: []
      }
      provider_contracts: {
        Row: {
          apple_google_pay_fees: string | null
          auto_renew: boolean | null
          bank_name: string | null
          beneficiary_name: string | null
          contract_date: string | null
          contract_file_url: string | null
          contract_number: string | null
          contract_type: string
          cr_flc_number: string | null
          created_at: string
          duration_months: number | null
          end_date: string | null
          entity_activities: string | null
          entity_type: string | null
          iban: string | null
          id: string
          merchant_email: string | null
          merchant_id_number: string | null
          merchant_name: string
          merchant_phone: string | null
          monthly_fees: number | null
          national_address: string | null
          notes: string | null
          provider_id: string | null
          settlement_fees: number | null
          setup_fees: number | null
          start_date: string | null
          status: string | null
          transaction_fees_percent: number | null
          updated_at: string
          vat_number: string | null
          vat_percent: number | null
          visa_mc_fees: string | null
        }
        Insert: {
          apple_google_pay_fees?: string | null
          auto_renew?: boolean | null
          bank_name?: string | null
          beneficiary_name?: string | null
          contract_date?: string | null
          contract_file_url?: string | null
          contract_number?: string | null
          contract_type?: string
          cr_flc_number?: string | null
          created_at?: string
          duration_months?: number | null
          end_date?: string | null
          entity_activities?: string | null
          entity_type?: string | null
          iban?: string | null
          id?: string
          merchant_email?: string | null
          merchant_id_number?: string | null
          merchant_name: string
          merchant_phone?: string | null
          monthly_fees?: number | null
          national_address?: string | null
          notes?: string | null
          provider_id?: string | null
          settlement_fees?: number | null
          setup_fees?: number | null
          start_date?: string | null
          status?: string | null
          transaction_fees_percent?: number | null
          updated_at?: string
          vat_number?: string | null
          vat_percent?: number | null
          visa_mc_fees?: string | null
        }
        Update: {
          apple_google_pay_fees?: string | null
          auto_renew?: boolean | null
          bank_name?: string | null
          beneficiary_name?: string | null
          contract_date?: string | null
          contract_file_url?: string | null
          contract_number?: string | null
          contract_type?: string
          cr_flc_number?: string | null
          created_at?: string
          duration_months?: number | null
          end_date?: string | null
          entity_activities?: string | null
          entity_type?: string | null
          iban?: string | null
          id?: string
          merchant_email?: string | null
          merchant_id_number?: string | null
          merchant_name?: string
          merchant_phone?: string | null
          monthly_fees?: number | null
          national_address?: string | null
          notes?: string | null
          provider_id?: string | null
          settlement_fees?: number | null
          setup_fees?: number | null
          start_date?: string | null
          status?: string | null
          transaction_fees_percent?: number | null
          updated_at?: string
          vat_number?: string | null
          vat_percent?: number | null
          visa_mc_fees?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_contracts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_delivery_route_history: {
        Row: {
          id: string
          lat: number
          lng: number
          order_id: string
          recorded_at: string
          speed: number | null
        }
        Insert: {
          id?: string
          lat: number
          lng: number
          order_id: string
          recorded_at?: string
          speed?: number | null
        }
        Update: {
          id?: string
          lat?: number
          lng?: number
          order_id?: string
          recorded_at?: string
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_delivery_route_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "provider_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_delivery_tracking: {
        Row: {
          created_at: string
          current_lat: number
          current_lng: number
          heading: number | null
          id: string
          order_id: string
          speed: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_lat: number
          current_lng: number
          heading?: number | null
          id?: string
          order_id: string
          speed?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_lat?: number
          current_lng?: number
          heading?: number | null
          id?: string
          order_id?: string
          speed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_delivery_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "provider_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          selected_options: Json | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          selected_options?: Json | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          selected_options?: Json | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "provider_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "provider_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "provider_products"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          id: string
          notes: string | null
          order_type: string
          provider_id: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivery_address?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          id?: string
          notes?: string | null
          order_type?: string
          provider_id: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          id?: string
          notes?: string | null
          order_type?: string
          provider_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_orders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_payouts: {
        Row: {
          amount: number
          commission_amount: number
          created_at: string
          id: string
          net_amount: number
          notes: string | null
          payout_method: string
          period_end: string
          period_start: string
          processed_at: string | null
          provider_id: string
          status: string
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          commission_amount: number
          created_at?: string
          id?: string
          net_amount: number
          notes?: string | null
          payout_method?: string
          period_end: string
          period_start: string
          processed_at?: string | null
          provider_id: string
          status?: string
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          commission_amount?: number
          created_at?: string
          id?: string
          net_amount?: number
          notes?: string | null
          payout_method?: string
          period_end?: string
          period_start?: string
          processed_at?: string | null
          provider_id?: string
          status?: string
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_payouts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "provider_products"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_products: {
        Row: {
          category: string
          created_at: string
          description_ar: string | null
          id: string
          image_url: string | null
          is_available: boolean
          is_featured: boolean
          name_ar: string
          name_en: string | null
          price: number
          provider_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description_ar?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          name_ar: string
          name_en?: string | null
          price: number
          provider_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description_ar?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          name_ar?: string
          name_en?: string | null
          price?: number
          provider_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_products_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          provider_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          provider_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          ends_at: string
          id: string
          is_trial: boolean
          payment_id: string | null
          plan_id: string
          provider_id: string
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          ends_at: string
          id?: string
          is_trial?: boolean
          payment_id?: string | null
          plan_id: string
          provider_id: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          ends_at?: string
          id?: string
          is_trial?: boolean
          payment_id?: string | null
          plan_id?: string
          provider_id?: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_subscriptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_subscriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referred_points_awarded: number | null
          referrer_id: string
          referrer_points_awarded: number | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referred_points_awarded?: number | null
          referrer_id: string
          referrer_points_awarded?: number | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referred_points_awarded?: number | null
          referrer_id?: string
          referrer_points_awarded?: number | null
          status?: string
        }
        Relationships: []
      }
      service_provider_applications: {
        Row: {
          admin_notes: string | null
          business_name: string
          created_at: string
          email: string
          full_name: string
          id: string
          neighborhood: string
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          business_name: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          neighborhood: string
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          business_name?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          neighborhood?: string
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_providers: {
        Row: {
          application_id: string | null
          bank_name: string | null
          business_name: string
          business_name_en: string | null
          commission_rate: number | null
          created_at: string
          delivery_radius_km: number | null
          delivery_scope: string | null
          description: string | null
          edfapay_credentials_verified: boolean | null
          edfapay_merchant_id_encrypted: string | null
          edfapay_verified_at: string | null
          email: string
          freelance_certificate_url: string | null
          gateway_account_id: string | null
          gateway_approval_url: string | null
          iban: string | null
          id: string
          is_active: boolean
          is_payment_verified: boolean | null
          is_verified: boolean
          last_payout_date: string | null
          logo_url: string | null
          national_address: string | null
          neighborhood_id: string | null
          payment_method: string | null
          payout_frequency: string | null
          pending_payout: number | null
          phone: string | null
          store_lat: number | null
          store_lng: number | null
          store_settings: Json | null
          store_theme: Json | null
          subscription_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          bank_name?: string | null
          business_name: string
          business_name_en?: string | null
          commission_rate?: number | null
          created_at?: string
          delivery_radius_km?: number | null
          delivery_scope?: string | null
          description?: string | null
          edfapay_credentials_verified?: boolean | null
          edfapay_merchant_id_encrypted?: string | null
          edfapay_verified_at?: string | null
          email: string
          freelance_certificate_url?: string | null
          gateway_account_id?: string | null
          gateway_approval_url?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean
          is_payment_verified?: boolean | null
          is_verified?: boolean
          last_payout_date?: string | null
          logo_url?: string | null
          national_address?: string | null
          neighborhood_id?: string | null
          payment_method?: string | null
          payout_frequency?: string | null
          pending_payout?: number | null
          phone?: string | null
          store_lat?: number | null
          store_lng?: number | null
          store_settings?: Json | null
          store_theme?: Json | null
          subscription_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          bank_name?: string | null
          business_name?: string
          business_name_en?: string | null
          commission_rate?: number | null
          created_at?: string
          delivery_radius_km?: number | null
          delivery_scope?: string | null
          description?: string | null
          edfapay_credentials_verified?: boolean | null
          edfapay_merchant_id_encrypted?: string | null
          edfapay_verified_at?: string | null
          email?: string
          freelance_certificate_url?: string | null
          gateway_account_id?: string | null
          gateway_approval_url?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean
          is_payment_verified?: boolean | null
          is_verified?: boolean
          last_payout_date?: string | null
          logo_url?: string | null
          national_address?: string | null
          neighborhood_id?: string | null
          payment_method?: string | null
          payout_frequency?: string | null
          pending_payout?: number | null
          phone?: string | null
          store_lat?: number | null
          store_lng?: number | null
          store_settings?: Json | null
          store_theme?: Json | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "service_provider_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_providers_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "active_neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      special_offers: {
        Row: {
          created_at: string
          discount_percentage: number
          ends_at: string
          id: string
          is_active: boolean
          offer_price: number
          original_price: number
          product_id: string | null
          starts_at: string
          title_ar: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percentage: number
          ends_at: string
          id?: string
          is_active?: boolean
          offer_price: number
          original_price: number
          product_id?: string | null
          starts_at?: string
          title_ar: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percentage?: number
          ends_at?: string
          id?: string
          is_active?: boolean
          offer_price?: number
          original_price?: number
          product_id?: string | null
          starts_at?: string
          title_ar?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "special_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          created_at: string
          delivery_radius_meters: number
          id: string
          points_per_order: number
          points_to_currency_ratio: number
          store_location_lat: number
          store_location_lng: number
          store_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_radius_meters?: number
          id?: string
          points_per_order?: number
          points_to_currency_ratio?: number
          store_location_lat?: number
          store_location_lng?: number
          store_name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_radius_meters?: number
          id?: string
          points_per_order?: number
          points_to_currency_ratio?: number
          store_location_lat?: number
          store_location_lng?: number
          store_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean
          is_trial: boolean
          name_ar: string
          name_en: string | null
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          duration_days: number
          features?: Json | null
          id?: string
          is_active?: boolean
          is_trial?: boolean
          name_ar: string
          name_en?: string | null
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean
          is_trial?: boolean
          name_ar?: string
          name_en?: string | null
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      suggested_neighborhoods: {
        Row: {
          address: string | null
          admin_notes: string | null
          application_id: string | null
          city: string
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggested_by_email: string
          suggested_by_name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          application_id?: string | null
          city: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_by_email: string
          suggested_by_name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          application_id?: string | null
          city?: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_by_email?: string
          suggested_by_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggested_neighborhoods_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "service_provider_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_app_versions: {
        Row: {
          id: string
          last_seen_version: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          last_seen_version: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          last_seen_version?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_loyalty_tier: { Args: { points: number }; Returns: string }
      employee_has_permission: {
        Args: { _action?: string; _permission_key: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "service_provider"
      order_status:
        | "pending"
        | "preparing"
        | "ready"
        | "out_for_delivery"
        | "completed"
        | "cancelled"
      order_type: "pickup" | "delivery"
      product_category: "coffee" | "sweets" | "cold_drinks"
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
      app_role: ["admin", "user", "service_provider"],
      order_status: [
        "pending",
        "preparing",
        "ready",
        "out_for_delivery",
        "completed",
        "cancelled",
      ],
      order_type: ["pickup", "delivery"],
      product_category: ["coffee", "sweets", "cold_drinks"],
    },
  },
} as const
