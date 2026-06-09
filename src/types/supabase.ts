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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      api_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          value: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at: string
          value: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          value?: Json
        }
        Relationships: []
      }
      api_call_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          endpoint: string
          error_msg: string | null
          id: string
          success: boolean
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          endpoint: string
          error_msg?: string | null
          id?: string
          success: boolean
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          endpoint?: string
          error_msg?: string | null
          id?: string
          success?: boolean
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupang_products: {
        Row: {
          buy_count: number | null
          category: string
          category_l1: string
          category_l2: string | null
          conversion_rate: number | null
          conversion_source: string | null
          coupang_url: string
          crawled_at: string
          created_at: string
          estimated_monthly_revenue: number | null
          estimated_monthly_sales: number | null
          id: string
          image_url: string | null
          is_excluded_brand: boolean
          item_name: string | null
          main_keyword: string | null
          price: number
          product_name: string
          rating: number | null
          review_count: number
          sub_keyword1: string | null
          sub_keyword2: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          buy_count?: number | null
          category: string
          category_l1: string
          category_l2?: string | null
          conversion_rate?: number | null
          conversion_source?: string | null
          coupang_url: string
          crawled_at?: string
          created_at?: string
          estimated_monthly_revenue?: number | null
          estimated_monthly_sales?: number | null
          id?: string
          image_url?: string | null
          is_excluded_brand?: boolean
          item_name?: string | null
          main_keyword?: string | null
          price: number
          product_name: string
          rating?: number | null
          review_count?: number
          sub_keyword1?: string | null
          sub_keyword2?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          buy_count?: number | null
          category?: string
          category_l1?: string
          category_l2?: string | null
          conversion_rate?: number | null
          conversion_source?: string | null
          coupang_url?: string
          crawled_at?: string
          created_at?: string
          estimated_monthly_revenue?: number | null
          estimated_monthly_sales?: number | null
          id?: string
          image_url?: string | null
          is_excluded_brand?: boolean
          item_name?: string | null
          main_keyword?: string | null
          price?: number
          product_name?: string
          rating?: number | null
          review_count?: number
          sub_keyword1?: string | null
          sub_keyword2?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      coupang_user_costs: {
        Row: {
          coupang_product_id: string
          id: string
          import_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coupang_product_id: string
          id?: string
          import_cost: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coupang_product_id?: string
          id?: string
          import_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupang_user_costs_coupang_product_id_fkey"
            columns: ["coupang_product_id"]
            isOneToOne: false
            referencedRelation: "coupang_products"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_chat_conversations: {
        Row: {
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          status: string
          unread_admin: number
          unread_user: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          status?: string
          unread_admin?: number
          unread_user?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          status?: string
          unread_admin?: number
          unread_user?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cs_chat_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender: string
          sender_id: string | null
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender: string
          sender_id?: string | null
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cs_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "cs_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_faqs: {
        Row: {
          answer: string
          category: string
          created_at: string | null
          id: string
          is_published: boolean
          question: string
          sort_order: number | null
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string | null
          id?: string
          is_published?: boolean
          question: string
          sort_order?: number | null
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string | null
          id?: string
          is_published?: boolean
          question?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      cs_inquiries: {
        Row: {
          admin_replied_at: string | null
          admin_reply: string | null
          category: string
          content: string
          created_at: string | null
          id: string
          order_id: string | null
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_replied_at?: string | null
          admin_reply?: string | null
          category: string
          content: string
          created_at?: string | null
          id?: string
          order_id?: string | null
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_replied_at?: string | null
          admin_reply?: string | null
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          order_id?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_inquiries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sourcing_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_returns: {
        Row: {
          admin_note: string | null
          created_at: string | null
          detail: string
          id: string
          order_id: string
          reason: string
          refund_amount: number | null
          return_type: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string | null
          detail: string
          id?: string
          order_id: string
          reason: string
          refund_amount?: number | null
          return_type: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string | null
          detail?: string
          id?: string
          order_id?: string
          reason?: string
          refund_amount?: number | null
          return_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "sourcing_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          fetched_at: string
          from_currency: string
          id: string
          rate: number
          to_currency: string
        }
        Insert: {
          fetched_at?: string
          from_currency: string
          id?: string
          rate: number
          to_currency: string
        }
        Update: {
          fetched_at?: string
          from_currency?: string
          id?: string
          rate?: number
          to_currency?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Insert: {
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity?: number
        }
        Update: {
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
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
          created_at: string
          id: string
          order_number: string
          payment_key: string | null
          payment_method: string | null
          shipping_address: Json | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_number: string
          payment_key?: string | null
          payment_method?: string | null
          shipping_address?: Json | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_number?: string
          payment_key?: string | null
          payment_method?: string | null
          shipping_address?: Json | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          content_html: string | null
          created_at: string
          description: string | null
          discount_price: number | null
          id: string
          is_published: boolean
          price: number
          slug: string
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          content_html?: string | null
          created_at?: string
          description?: string | null
          discount_price?: number | null
          id?: string
          is_published?: boolean
          price?: number
          slug: string
          thumbnail_url?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          content_html?: string | null
          created_at?: string
          description?: string | null
          discount_price?: number | null
          id?: string
          is_published?: boolean
          price?: number
          slug?: string
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          phone: string | null
          role: string
          subscription_expires_at: string | null
          subscription_plan: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name?: string | null
          phone?: string | null
          role?: string
          subscription_expires_at?: string | null
          subscription_plan?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          role?: string
          subscription_expires_at?: string | null
          subscription_plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          id: string
          keyword: string
          searched_at: string
          user_id: string
        }
        Insert: {
          id?: string
          keyword: string
          searched_at?: string
          user_id: string
        }
        Update: {
          id?: string
          keyword?: string
          searched_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sourcing_orders: {
        Row: {
          admin_note: string | null
          business_info: Json | null
          created_at: string
          id: string
          items: Json
          order_number: string
          payment_key: string | null
          payment_method: string | null
          service_fee: number
          shipping_address: Json | null
          shipping_fee: number
          status: string
          terms_agreed: Json | null
          total_cny: number
          total_krw: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          business_info?: Json | null
          created_at?: string
          id?: string
          items?: Json
          order_number: string
          payment_key?: string | null
          payment_method?: string | null
          service_fee?: number
          shipping_address?: Json | null
          shipping_fee?: number
          status?: string
          terms_agreed?: Json | null
          total_cny?: number
          total_krw?: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          business_info?: Json | null
          created_at?: string
          id?: string
          items?: Json
          order_number?: string
          payment_key?: string | null
          payment_method?: string | null
          service_fee?: number
          shipping_address?: Json | null
          shipping_fee?: number
          status?: string
          terms_agreed?: Json | null
          total_cny?: number
          total_krw?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sourcing_products: {
        Row: {
          created_at: string
          id: string
          images: Json | null
          price_cny: number
          price_krw: number
          product_id: string
          seller: Json | null
          skus: Json | null
          stock: number | null
          title: string
          title_zh: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          images?: Json | null
          price_cny: number
          price_krw: number
          product_id: string
          seller?: Json | null
          skus?: Json | null
          stock?: number | null
          title: string
          title_zh?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          images?: Json | null
          price_cny?: number
          price_krw?: number
          product_id?: string
          seller?: Json | null
          skus?: Json | null
          stock?: number | null
          title?: string
          title_zh?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sourcing_wishlist_items: {
        Row: {
          added_at: string
          id: string
          image: string | null
          price_cny: number | null
          price_krw: number | null
          product_id: string
          seller_name: string | null
          title: string
          title_zh: string | null
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          image?: string | null
          price_cny?: number | null
          price_krw?: number | null
          product_id: string
          seller_name?: string | null
          title: string
          title_zh?: string | null
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          image?: string | null
          price_cny?: number | null
          price_krw?: number | null
          product_id?: string
          seller_name?: string | null
          title?: string
          title_zh?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_key: string | null
          plan: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_key?: string | null
          plan: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_key?: string | null
          plan?: string
          user_id?: string
        }
        Relationships: []
      }
      translation_api_usage_daily: {
        Row: {
          api_calls: number
          direction: string
          model: string
          text_items: number
          updated_at: string
          usage_date: string
        }
        Insert: {
          api_calls?: number
          direction: string
          model: string
          text_items?: number
          updated_at?: string
          usage_date: string
        }
        Update: {
          api_calls?: number
          direction?: string
          model?: string
          text_items?: number
          updated_at?: string
          usage_date?: string
        }
        Relationships: []
      }
      translation_cache: {
        Row: {
          created_at: string | null
          direction: string
          original: string
          translated: string
        }
        Insert: {
          created_at?: string | null
          direction: string
          original: string
          translated: string
        }
        Update: {
          created_at?: string | null
          direction?: string
          original?: string
          translated?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
    Enums: {},
  },
} as const
