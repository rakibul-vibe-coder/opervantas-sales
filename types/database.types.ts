// types/database.types.ts
// Supabase Database TypeScript Types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'manager' | 'salesman'
export type UserStatus = 'active' | 'hold' | 'archived'
export type SaleStatus = 'active' | 'voided'
export type ExpenseStatus = 'active' | 'deleted'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string
          role: UserRole
          status: UserStatus
          employee_id: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name: string
          role?: UserRole
          status?: UserStatus
          employee_id: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string
          role?: UserRole
          status?: UserStatus
          employee_id?: string
          created_by?: string | null
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          sale_number: string
          salesman_id: string
          salesman_name: string
          model_name: string
          quantity: number
          unit_purchase_price: number
          unit_selling_price: number
          total_purchase_cost: number
          total_selling_amount: number
          gross_profit: number
          business_date: string
          status: SaleStatus
          idempotency_key: string
          created_at: string
          voided_by: string | null
          voided_at: string | null
        }
        Insert: {
          id?: string
          sale_number?: string
          salesman_id: string
          salesman_name: string
          model_name: string
          quantity: number
          unit_purchase_price: number
          unit_selling_price: number
          business_date: string
          status?: SaleStatus
          idempotency_key: string
          created_at?: string
        }
        Update: {
          status?: SaleStatus
          voided_by?: string | null
          voided_at?: string | null
        }
      }
      expenses: {
        Row: {
          id: string
          expense_number: string
          recipient_name: string
          purpose: string
          amount: number
          expense_date: string
          business_date: string
          status: ExpenseStatus
          notes: string | null
          created_by: string
          created_at: string
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          expense_number?: string
          recipient_name: string
          purpose: string
          amount: number
          expense_date: string
          business_date: string
          status?: ExpenseStatus
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          recipient_name?: string
          purpose?: string
          amount?: number
          expense_date?: string
          notes?: string | null
          status?: ExpenseStatus
          updated_by?: string | null
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          action: string
          entity_type: string
          entity_id: string | null
          performed_by: string | null
          performed_by_name: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          action: string
          entity_type: string
          entity_id?: string | null
          performed_by?: string | null
          performed_by_name?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: never
      }
    }
    Functions: {
      get_business_date: {
        Args: { ts?: string }
        Returns: string
      }
      get_dashboard_summary: {
        Args: { p_business_date: string }
        Returns: {
          total_sales: number
          total_purchase_cost: number
          total_gross_profit: number
          total_expenses: number
          net_profit: number
          total_quantity: number
          total_transactions: number
          active_salespeople: number
        }[]
      }
      get_salesman_performance: {
        Args: { p_business_date: string }
        Returns: {
          salesman_id: string
          salesman_name: string
          employee_id: string
          transactions: number
          total_quantity: number
          total_sales: number
          total_purchase_cost: number
          gross_profit: number
          last_sale_at: string
        }[]
      }
      get_monthly_report: {
        Args: { p_year: number; p_month: number }
        Returns: {
          business_date: string
          total_sales: number
          total_purchase_cost: number
          gross_profit: number
          total_expenses: number
          net_profit: number
          total_quantity: number
          total_transactions: number
        }[]
      }
      get_date_range_report: {
        Args: { p_start_date: string; p_end_date: string }
        Returns: {
          total_sales: number
          total_purchase_cost: number
          gross_profit: number
          total_expenses: number
          net_profit: number
          total_quantity: number
          total_transactions: number
        }[]
      }
    }
  }
}
