'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  ChevronLeft, 
  LogOut, 
  MessageSquare, 
  Send, 
  Zap, 
  User,
  Loader2
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const categoryLabels: Record<string, string> = {
  customer: '고객응대',
  interview: '면접',
  sales: '세일즈',
}

const difficultyLabels: Record<string, string> = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
}

const difficultyClasses: Record<string, string> = {
  beginner: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  intermediate: 'bg-amber-50 text-amber-700 border-amber-100',
  advanced: 'bg-rose-50 text-rose-700 border-rose-100',
}

function RoleplayContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const category = searchParams.get('category') || ''
  const difficulty = searchParams.get('difficulty') || ''

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [ending, setEnding] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!sessionId) {
      router.push('/')
      return
    }
    initSession()
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function initSession() {
    try {
      const res = await fetch(
        `/api/chat?sessionId=${sessionId}&category=${category}&difficulty=${difficulty}`
      )
      const data = await res.json()
      if (data.message) {
        setMessages([{ role: 'assistant', content: data.message }])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setInitializing(false)
    }
  }

  async function handleSend() {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
          category,
          difficulty,
          messages: messages,
        }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  async function handleEndSession() {
    if (messages.length < 2) {
      alert('대화가 너무 짧습니다. 최소 한 번 이상 대화해주세요.')
      return
    }
    setEnding(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, category, difficulty, messages }),
      })
      const data = await res.json()
      if (data.feedback) {
        sessionStorage.setItem(`feedback_${sessionId}`, JSON.stringify(data.feedback))
        router.push(
          `/feedback?sessionId=${sessionId}&category=${category}&difficulty=${difficulty}`
        )
      }
    } catch (err) {
      console.error(err)
      alert('피드백 생성에 실패했습니다.')
    } finally {
      setEnding(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-[var(--border)] bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-[var(--primary)] transition-all"
              title="홈으로"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="h-6 w-0.5 bg-slate-200" />
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg text-[var(--foreground)]">
                {categoryLabels[category] || category}
              </span>
              <span
                className={`text-[10px] px-2.5 py-1 rounded-full font-black tracking-wider uppercase border-2 ${
                  difficultyClasses[difficulty] || 'bg-slate-50 text-slate-600 border-slate-100'
                }`}
              >
                {difficultyLabels[difficulty] || difficulty}
              </span>
            </div>
          </div>
          <button
            onClick={handleEndSession}
            disabled={ending || initializing}
            className="px-5 py-2.5 bg-[var(--foreground)] hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {ending ? (
              <>분석 중 <Loader2 className="w-4 h-4 animate-spin" /></>
            ) : (
              <>세션 종료 <LogOut className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 space-y-8 overflow-y-auto">
        {initializing ? (
          <div className="flex flex-col items-center justify-center pt-32 space-y-4 text-center">
            <div className="w-16 h-16 rounded-[2rem] bg-[var(--background)] flex items-center justify-center border-2 border-[var(--border)] animate-bounce">
              <Zap className="text-[var(--primary)] w-8 h-8 fill-current" />
            </div>
            <div>
              <p className="font-bold text-xl text-[var(--foreground)] tracking-tight">AI 롤플레이 시나리오 구성 중</p>
              <p className="text-slate-400 font-medium">잠시만 기다려주세요...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Intro banner */}
            <div className="bg-white border-2 border-[var(--border)] rounded-2xl p-5 flex items-start gap-4 shadow-[4px_4px_0px_0px_rgba(186,230,253,0.3)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--background)] flex items-center justify-center flex-shrink-0">
                <MessageSquare className="text-[var(--primary)] w-5 h-5" />
              </div>
              <p className="text-[var(--foreground)] font-medium leading-relaxed">
                <strong>시뮬레이션이 시작되었습니다!</strong> AI가 실제 상황의 상대방 역할을 합니다.
                충분히 대화한 후, 우측 상단의 <strong>세션 종료</strong> 버튼을 눌러 피드백 리포트를 확인하세요.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                      msg.role === 'assistant'
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-white text-[var(--foreground)] border-slate-200'
                    }`}
                  >
                    {msg.role === 'assistant' ? <Zap className="w-6 h-6 fill-current" /> : <User className="w-6 h-6" />}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[80%] md:max-w-[70%] rounded-3xl px-6 py-4 text-[15px] font-medium leading-relaxed shadow-sm ${
                      msg.role === 'assistant'
                        ? 'bg-white border-2 border-slate-100 text-[var(--foreground)] rounded-tl-lg'
                        : 'bg-[var(--primary)] text-white rounded-tr-lg'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] flex-shrink-0 flex items-center justify-center border-2 border-[var(--primary)]">
                    <Zap className="text-white w-6 h-6 fill-current animate-pulse" />
                  </div>
                  <div className="bg-white border-2 border-slate-100 rounded-3xl rounded-tl-lg px-6 py-4 flex items-center">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} className="h-4" />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t-2 border-[var(--border)] bg-white/80 backdrop-blur-md pb-safe">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex gap-4 items-end bg-slate-50 border-2 border-slate-200 rounded-[2rem] p-3 focus-within:border-[var(--primary)] focus-within:bg-white transition-all shadow-sm">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              rows={1}
              className="flex-1 bg-transparent px-4 py-3 text-[15px] font-medium text-[var(--foreground)] placeholder-slate-400 focus:outline-none resize-none"
              style={{ minHeight: '48px', maxHeight: '160px' }}
              disabled={loading || initializing}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || initializing}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 ${
                input.trim() && !loading && !initializing
                ? 'bg-[var(--primary)] text-white shadow-lg shadow-blue-200'
                : 'bg-slate-200 text-slate-400'
              }`}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              AI Vibe Real-time Engine
            </span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {messages.filter((m) => m.role === 'user').length} Messages
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RoleplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex flex-col items-center justify-center bg-white"><Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" /></div>}>
      <RoleplayContent />
    </Suspense>
  )
}
