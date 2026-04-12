'use client'

import { useState, useEffect } from 'react'
import { User, LogOut, Loader2 } from 'lucide-react'
import { signInWithGoogle, signOut, getUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export default function AuthButton() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    getUser().then(user => {
      setUser(user)
      setLoading(false)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async () => {
    try {
      setLoading(true)
      await signInWithGoogle()
    } catch (error) {
      console.error('Login error:', error)
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setLoading(true)
      await signOut()
      window.location.reload()
    } catch (error) {
      console.error('Logout error:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 font-bold">
        <Loader2 className="w-4 h-4 animate-spin" /> 확인 중...
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center text-[10px] text-white font-black overflow-hidden">
            {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="avatar" />
            ) : (
                user.email?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col items-start leading-none gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase">로그인됨</span>
            <span className="text-xs font-bold text-[var(--foreground)] truncate max-w-[100px]">
              {user.user_metadata?.full_name || user.email?.split('@')[0]}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
          title="로그아웃"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[var(--border)] rounded-2xl text-sm font-black text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-blue-50 transition-all shadow-sm active:scale-95"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      Google로 시작하기
    </button>
  )
}
