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
      admin_activity_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ai_search_index: {
        Row: {
          content_type: string
          created_at: string
          id: string
          indexed_content: string
          metadata: Json | null
          reference_id: string
          search_keywords: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_type: string
          created_at?: string
          id?: string
          indexed_content: string
          metadata?: Json | null
          reference_id: string
          search_keywords?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_type?: string
          created_at?: string
          id?: string
          indexed_content?: string
          metadata?: Json | null
          reference_id?: string
          search_keywords?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      api_requests_log: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_address: string | null
          method: string
          request_size: number | null
          response_size: number | null
          response_time_ms: number | null
          status_code: number
          token_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: string | null
          method: string
          request_size?: number | null
          response_size?: number | null
          response_time_ms?: number | null
          status_code: number
          token_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string | null
          method?: string
          request_size?: number | null
          response_size?: number | null
          response_time_ms?: number | null
          status_code?: number
          token_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_requests_log_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "api_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      api_tokens: {
        Row: {
          active: boolean
          created_at: string
          expires_at: string | null
          id: string
          last_used_at: string | null
          permissions: Json
          rate_limit: number | null
          token_hash: string
          token_name: string
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          permissions?: Json
          rate_limit?: number | null
          token_hash: string
          token_name: string
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          permissions?: Json
          rate_limit?: number | null
          token_hash?: string
          token_name?: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      competitor_analysis: {
        Row: {
          analysis_date: string
          competitor_description: string | null
          competitor_images: Json | null
          competitor_name: string
          competitor_price: number | null
          competitor_url: string | null
          created_at: string
          id: string
          our_price: number | null
          price_difference: number | null
          price_difference_percent: number | null
          product_sku: string
          user_id: string
        }
        Insert: {
          analysis_date?: string
          competitor_description?: string | null
          competitor_images?: Json | null
          competitor_name: string
          competitor_price?: number | null
          competitor_url?: string | null
          created_at?: string
          id?: string
          our_price?: number | null
          price_difference?: number | null
          price_difference_percent?: number | null
          product_sku: string
          user_id: string
        }
        Update: {
          analysis_date?: string
          competitor_description?: string | null
          competitor_images?: Json | null
          competitor_name?: string
          competitor_price?: number | null
          competitor_url?: string | null
          created_at?: string
          id?: string
          our_price?: number | null
          price_difference?: number | null
          price_difference_percent?: number | null
          product_sku?: string
          user_id?: string
        }
        Relationships: []
      }
      competitor_prices: {
        Row: {
          active: boolean | null
          competitor_name: string
          id: string
          price_ttc: number | null
          product_sku: string
          scraped_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          competitor_name: string
          id?: string
          price_ttc?: number | null
          product_sku: string
          scraped_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          competitor_name?: string
          id?: string
          price_ttc?: number | null
          product_sku?: string
          scraped_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_notifications: {
        Row: {
          approval_token: string | null
          approved_at: string | null
          content: Json
          id: string
          notification_type: string
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          approval_token?: string | null
          approved_at?: string | null
          content?: Json
          id?: string
          notification_type: string
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          approval_token?: string | null
          approved_at?: string | null
          content?: Json
          id?: string
          notification_type?: string
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      enhanced_descriptions: {
        Row: {
          basic_description: string
          competitor_analysis: Json | null
          confidence_score: number | null
          created_at: string
          enhanced_description: string | null
          id: string
          marketing_copy: Json | null
          multi_language_descriptions: Json | null
          product_name: string
          seo_description: Json | null
          target_languages: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          basic_description: string
          competitor_analysis?: Json | null
          confidence_score?: number | null
          created_at?: string
          enhanced_description?: string | null
          id?: string
          marketing_copy?: Json | null
          multi_language_descriptions?: Json | null
          product_name: string
          seo_description?: Json | null
          target_languages?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          basic_description?: string
          competitor_analysis?: Json | null
          confidence_score?: number | null
          created_at?: string
          enhanced_description?: string | null
          id?: string
          marketing_copy?: Json | null
          multi_language_descriptions?: Json | null
          product_name?: string
          seo_description?: Json | null
          target_languages?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      enriched_product_data: {
        Row: {
          category: string | null
          compatibility_info: Json | null
          compliance_info: Json | null
          confidence_score: number | null
          created_at: string
          cross_sell_suggestions: Json | null
          description: string
          id: string
          keywords: string[] | null
          product_name: string
          product_tags: Json | null
          sustainability_info: Json | null
          technical_specifications: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          compatibility_info?: Json | null
          compliance_info?: Json | null
          confidence_score?: number | null
          created_at?: string
          cross_sell_suggestions?: Json | null
          description: string
          id?: string
          keywords?: string[] | null
          product_name: string
          product_tags?: Json | null
          sustainability_info?: Json | null
          technical_specifications?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          compatibility_info?: Json | null
          compliance_info?: Json | null
          confidence_score?: number | null
          created_at?: string
          cross_sell_suggestions?: Json | null
          description?: string
          id?: string
          keywords?: string[] | null
          product_name?: string
          product_tags?: Json | null
          sustainability_info?: Json | null
          technical_specifications?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      integration_configs: {
        Row: {
          config_data: Json
          created_at: string
          credentials_encrypted: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          platform_name: string
          sync_frequency: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          config_data?: Json
          created_at?: string
          credentials_encrypted?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform_name: string
          sync_frequency?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          config_data?: Json
          created_at?: string
          credentials_encrypted?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform_name?: string
          sync_frequency?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      magic_tools_results: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          metadata: Json | null
          model_used: string | null
          processing_time_ms: number | null
          product_name: string
          provider_type: string | null
          result_data: Json
          status: string | null
          suggestions: string[] | null
          tool_id: string
          tool_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          model_used?: string | null
          processing_time_ms?: number | null
          product_name: string
          provider_type?: string | null
          result_data?: Json
          status?: string | null
          suggestions?: string[] | null
          tool_id: string
          tool_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          model_used?: string | null
          processing_time_ms?: number | null
          product_name?: string
          provider_type?: string | null
          result_data?: Json
          status?: string | null
          suggestions?: string[] | null
          tool_id?: string
          tool_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      odoo_configurations: {
        Row: {
          created_at: string
          custom_fields_created: boolean | null
          database: string
          field_mappings: Json | null
          id: string
          password: string
          test_connection: boolean | null
          updated_at: string
          url: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          custom_fields_created?: boolean | null
          database: string
          field_mappings?: Json | null
          id?: string
          password: string
          test_connection?: boolean | null
          updated_at?: string
          url: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          custom_fields_created?: boolean | null
          database?: string
          field_mappings?: Json | null
          id?: string
          password?: string
          test_connection?: boolean | null
          updated_at?: string
          url?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      payment_analytics: {
        Row: {
          amount: number
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          metadata: Json | null
          payment_date: string
          payment_method: string | null
          retry_count: number | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          payment_date: string
          payment_method?: string | null
          retry_count?: number | null
          status: string
          stripe_customer_id?: string | null
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          payment_date?: string
          payment_method?: string | null
          retry_count?: number | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_connections: {
        Row: {
          configuration: Json
          connection_status: string
          created_at: string
          credentials_encrypted: string | null
          error_message: string | null
          id: string
          last_sync_at: string | null
          last_test_at: string | null
          platform_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          configuration?: Json
          connection_status?: string
          created_at?: string
          credentials_encrypted?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          last_test_at?: string | null
          platform_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          configuration?: Json
          connection_status?: string
          created_at?: string
          credentials_encrypted?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          last_test_at?: string | null
          platform_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prestashop_configurations: {
        Row: {
          created_at: string
          enabled: boolean | null
          field_mappings: Json | null
          id: string
          image_quality: string | null
          language_id: number | null
          secret_key_name: string
          shop_url: string
          sync_categories: boolean | null
          sync_images: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          field_mappings?: Json | null
          id?: string
          image_quality?: string | null
          language_id?: number | null
          secret_key_name: string
          shop_url: string
          sync_categories?: boolean | null
          sync_images?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          field_mappings?: Json | null
          id?: string
          image_quality?: string | null
          language_id?: number | null
          secret_key_name?: string
          shop_url?: string
          sync_categories?: boolean | null
          sync_images?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prestashop_products: {
        Row: {
          active: boolean | null
          categories: Json | null
          created_at: string
          description: string | null
          ean13: string | null
          id: string
          images: Json | null
          last_sync_at: string | null
          name: string
          odoo_product_id: number | null
          prestashop_id: number
          price: number | null
          reference: string | null
          short_description: string | null
          stock_quantity: number | null
          synced_to_odoo: boolean | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          categories?: Json | null
          created_at?: string
          description?: string | null
          ean13?: string | null
          id?: string
          images?: Json | null
          last_sync_at?: string | null
          name: string
          odoo_product_id?: number | null
          prestashop_id: number
          price?: number | null
          reference?: string | null
          short_description?: string | null
          stock_quantity?: number | null
          synced_to_odoo?: boolean | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          categories?: Json | null
          created_at?: string
          description?: string | null
          ean13?: string | null
          id?: string
          images?: Json | null
          last_sync_at?: string | null
          name?: string
          odoo_product_id?: number | null
          prestashop_id?: number
          price?: number | null
          reference?: string | null
          short_description?: string | null
          stock_quantity?: number | null
          synced_to_odoo?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      prestashop_sync_history: {
        Row: {
          completed_at: string | null
          error_log: Json | null
          id: string
          products_failed: number | null
          products_synced: number | null
          started_at: string | null
          status: string | null
          sync_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          error_log?: Json | null
          id?: string
          products_failed?: number | null
          products_synced?: number | null
          started_at?: string | null
          status?: string | null
          sync_type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          error_log?: Json | null
          id?: string
          products_failed?: number | null
          products_synced?: number | null
          started_at?: string | null
          status?: string | null
          sync_type?: string
          user_id?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          alert_type: string
          created_at: string
          current_value: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          product_name: string
          product_sku: string
          threshold_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          current_value?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          product_name: string
          product_sku: string
          threshold_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          current_value?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          product_name?: string
          product_sku?: string
          threshold_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      price_evolution_history: {
        Row: {
          change_date: string
          change_percent: number | null
          id: string
          new_price_ht: number | null
          new_stock: number | null
          old_price_ht: number | null
          old_stock: number | null
          product_id: string
          user_id: string
        }
        Insert: {
          change_date?: string
          change_percent?: number | null
          id?: string
          new_price_ht?: number | null
          new_stock?: number | null
          old_price_ht?: number | null
          old_stock?: number | null
          product_id: string
          user_id: string
        }
        Update: {
          change_date?: string
          change_percent?: number | null
          id?: string
          new_price_ht?: number | null
          new_stock?: number | null
          old_price_ht?: number | null
          old_stock?: number | null
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_evolution_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          competitor_name: string | null
          id: string
          metadata: Json | null
          price: number
          product_sku: string
          recorded_at: string
          source: string | null
          user_id: string
        }
        Insert: {
          competitor_name?: string | null
          id?: string
          metadata?: Json | null
          price: number
          product_sku: string
          recorded_at?: string
          source?: string | null
          user_id: string
        }
        Update: {
          competitor_name?: string | null
          id?: string
          metadata?: Json | null
          price?: number
          product_sku?: string
          recorded_at?: string
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      price_updates_queue: {
        Row: {
          approval_token: string | null
          created_at: string
          current_price: number | null
          id: string
          margin_calculation: Json | null
          product_id: string
          reason: string | null
          requires_approval: boolean | null
          status: string
          suggested_price: number | null
          supplier_id: string
          user_id: string
        }
        Insert: {
          approval_token?: string | null
          created_at?: string
          current_price?: number | null
          id?: string
          margin_calculation?: Json | null
          product_id: string
          reason?: string | null
          requires_approval?: boolean | null
          status?: string
          suggested_price?: number | null
          supplier_id: string
          user_id: string
        }
        Update: {
          approval_token?: string | null
          created_at?: string
          current_price?: number | null
          id?: string
          margin_calculation?: Json | null
          product_id?: string
          reason?: string | null
          requires_approval?: boolean | null
          status?: string
          suggested_price?: number | null
          supplier_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_updates_queue_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_updates_queue_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules_ai: {
        Row: {
          auto_apply: boolean | null
          conditions: Json | null
          created_at: string
          id: string
          ollama_prompt: string
          rule_name: string
          user_id: string
        }
        Insert: {
          auto_apply?: boolean | null
          conditions?: Json | null
          created_at?: string
          id?: string
          ollama_prompt: string
          rule_name: string
          user_id: string
        }
        Update: {
          auto_apply?: boolean | null
          conditions?: Json | null
          created_at?: string
          id?: string
          ollama_prompt?: string
          rule_name?: string
          user_id?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          keywords: string[] | null
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string[] | null
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string[] | null
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_history: {
        Row: {
          content_html: string | null
          content_markdown: string | null
          created_at: string
          id: string
          images: Json | null
          product_data: Json
          product_sku: string
          supplier_id: string
          updated_at: string
          user_id: string
          version_number: number
        }
        Insert: {
          content_html?: string | null
          content_markdown?: string | null
          created_at?: string
          id?: string
          images?: Json | null
          product_data?: Json
          product_sku: string
          supplier_id: string
          updated_at?: string
          user_id: string
          version_number?: number
        }
        Update: {
          content_html?: string | null
          content_markdown?: string | null
          created_at?: string
          id?: string
          images?: Json | null
          product_data?: Json
          product_sku?: string
          supplier_id?: string
          updated_at?: string
          user_id?: string
          version_number?: number
        }
        Relationships: []
      }
      provider_configurations: {
        Row: {
          api_key_secret_name: string | null
          configuration: Json
          created_at: string
          endpoint: string | null
          id: string
          is_active: boolean
          is_default: boolean
          preferred_models: Json
          provider_name: string
          provider_type: Database["public"]["Enums"]["provider_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_secret_name?: string | null
          configuration?: Json
          created_at?: string
          endpoint?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          preferred_models?: Json
          provider_name: string
          provider_type: Database["public"]["Enums"]["provider_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_secret_name?: string | null
          configuration?: Json
          created_at?: string
          endpoint?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          preferred_models?: Json
          provider_name?: string
          provider_type?: Database["public"]["Enums"]["provider_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      public_plans: {
        Row: {
          created_at: string | null
          currency: string
          description: string | null
          display_name: string
          id: string
          max_products: number
          max_suppliers: number
          monthly_price_cents: number
          plan_type: string
          popular: boolean | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          description?: string | null
          display_name: string
          id?: string
          max_products: number
          max_suppliers: number
          monthly_price_cents: number
          plan_type: string
          popular?: boolean | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          description?: string | null
          display_name?: string
          id?: string
          max_products?: number
          max_suppliers?: number
          monthly_price_cents?: number
          plan_type?: string
          popular?: boolean | null
        }
        Relationships: []
      }
      retailer_configurations: {
        Row: {
          created_at: string
          css_selectors: Json | null
          enabled: boolean | null
          id: string
          retailer_name: string
          search_url: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          css_selectors?: Json | null
          enabled?: boolean | null
          id?: string
          retailer_name: string
          search_url: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          css_selectors?: Json | null
          enabled?: boolean | null
          id?: string
          retailer_name?: string
          search_url?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          executed_at: string
          id: string
          metadata: Json | null
          results: Json | null
          status: string
          template_id: string
          user_id: string
        }
        Insert: {
          executed_at?: string
          id?: string
          metadata?: Json | null
          results?: Json | null
          status?: string
          template_id: string
          user_id: string
        }
        Update: {
          executed_at?: string
          id?: string
          metadata?: Json | null
          results?: Json | null
          status?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "search_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          created_at: string | null
          descriptions: Json
          duration: number | null
          ean_code: string | null
          id: string
          product_name: string
          tokens: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          descriptions: Json
          duration?: number | null
          ean_code?: string | null
          id?: string
          product_name: string
          tokens?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          descriptions?: Json
          duration?: number | null
          ean_code?: string | null
          id?: string
          product_name?: string
          tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      search_templates: {
        Row: {
          alerts: Json | null
          created_at: string
          created_by: string
          description: string | null
          description_types: Json | null
          filters: Json | null
          id: string
          is_shared: boolean | null
          name: string
          query: string
          schedule: Json | null
          updated_at: string
        }
        Insert: {
          alerts?: Json | null
          created_at?: string
          created_by: string
          description?: string | null
          description_types?: Json | null
          filters?: Json | null
          id?: string
          is_shared?: boolean | null
          name: string
          query: string
          schedule?: Json | null
          updated_at?: string
        }
        Update: {
          alerts?: Json | null
          created_at?: string
          created_by?: string
          description?: string | null
          description_types?: Json | null
          filters?: Json | null
          id?: string
          is_shared?: boolean | null
          name?: string
          query?: string
          schedule?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_limits: {
        Row: {
          created_at: string | null
          currency: string
          features: Json | null
          id: string
          max_products: number
          max_suppliers: number
          monthly_price_cents: number
          plan_type: string
        }
        Insert: {
          created_at?: string | null
          currency: string
          features?: Json | null
          id?: string
          max_products: number
          max_suppliers: number
          monthly_price_cents: number
          plan_type: string
        }
        Update: {
          created_at?: string | null
          currency?: string
          features?: Json | null
          id?: string
          max_products?: number
          max_suppliers?: number
          monthly_price_cents?: number
          plan_type?: string
        }
        Relationships: []
      }
      super_admin_logs: {
        Row: {
          action_details: Json
          action_type: string
          admin_user_id: string
          created_at: string
          id: string
          ip_address: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_details?: Json
          action_type: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_details?: Json
          action_type?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      supplier_configurations: {
        Row: {
          active: boolean
          created_at: string
          email_config: Json | null
          ftp_config: Json | null
          id: string
          import_method: string
          name: string
          sftp_config: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email_config?: Json | null
          ftp_config?: Json | null
          id?: string
          import_method: string
          name: string
          sftp_config?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email_config?: Json | null
          ftp_config?: Json | null
          id?: string
          import_method?: string
          name?: string
          sftp_config?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supplier_price_files: {
        Row: {
          file_hash: string | null
          file_path: string | null
          id: string
          imported_at: string
          products_count: number | null
          status: string
          supplier_id: string
          user_id: string
          version_number: number
        }
        Insert: {
          file_hash?: string | null
          file_path?: string | null
          id?: string
          imported_at?: string
          products_count?: number | null
          status?: string
          supplier_id: string
          user_id: string
          version_number: number
        }
        Update: {
          file_hash?: string | null
          file_path?: string | null
          id?: string
          imported_at?: string
          products_count?: number | null
          status?: string
          supplier_id?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_price_files_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          category: string | null
          created_at: string
          file_version_id: string
          id: string
          margin_percent: number | null
          name: string
          purchase_price_ht: number | null
          sku: string
          stock: number | null
          supplier_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_version_id: string
          id?: string
          margin_percent?: number | null
          name: string
          purchase_price_ht?: number | null
          sku: string
          stock?: number | null
          supplier_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          file_version_id?: string
          id?: string
          margin_percent?: number | null
          name?: string
          purchase_price_ht?: number | null
          sku?: string
          stock?: number | null
          supplier_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_file_version_id_fkey"
            columns: ["file_version_id"]
            isOneToOne: false
            referencedRelation: "supplier_price_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          api_calls_count: number | null
          created_at: string | null
          id: string
          last_reset_date: string | null
          products_count: number | null
          suppliers_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_calls_count?: number | null
          created_at?: string | null
          id?: string
          last_reset_date?: string | null
          products_count?: number | null
          suppliers_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_calls_count?: number | null
          created_at?: string | null
          id?: string
          last_reset_date?: string | null
          products_count?: number | null
          suppliers_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_configurations: {
        Row: {
          auto_provider_selection: boolean | null
          created_at: string | null
          endpoint: string
          fallback_provider_type:
            | Database["public"]["Enums"]["provider_type"]
            | null
          id: string
          options: Json
          prompts: Json
          provider_configs: Json | null
          provider_type: Database["public"]["Enums"]["provider_type"] | null
          selected_model: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_provider_selection?: boolean | null
          created_at?: string | null
          endpoint?: string
          fallback_provider_type?:
            | Database["public"]["Enums"]["provider_type"]
            | null
          id?: string
          options?: Json
          prompts?: Json
          provider_configs?: Json | null
          provider_type?: Database["public"]["Enums"]["provider_type"] | null
          selected_model?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_provider_selection?: boolean | null
          created_at?: string | null
          endpoint?: string
          fallback_provider_type?:
            | Database["public"]["Enums"]["provider_type"]
            | null
          id?: string
          options?: Json
          prompts?: Json
          provider_configs?: Json | null
          provider_type?: Database["public"]["Enums"]["provider_type"] | null
          selected_model?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          country_code: string | null
          created_at: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      provider_type: "local" | "cloud"
      user_role: "user" | "admin" | "super_admin"
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
      provider_type: ["local", "cloud"],
      user_role: ["user", "admin", "super_admin"],
    },
  },
} as const
