import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Supabase environment variables are not set')
    }
    _supabase = createBrowserClient(url, key)
  }
  return _supabase
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          created_at: string
          student_name: string
          category: string
          difficulty: string
          status: 'active' | 'completed'
          user_id?: string
        }
        Insert: {
          id?: string
          created_at?: string
          student_name: string
          category: string
          difficulty: string
          status?: 'active' | 'completed'
          user_id?: string
        }
      }
      messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          created_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          session_id: string
          strengths: string
          improvements: string
          total_score: number
          empathy_score: number
          problem_solving_score: number
          communication_score: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          strengths: string
          improvements: string
          total_score: number
          empathy_score: number
          problem_solving_score: number
          communication_score: number
          created_at?: string
        }
      }
    }
  }
}
