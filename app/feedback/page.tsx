'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Trophy, 
  Target, 
  MessageSquare, 
  ArrowLeft, 
  LayoutDashboard,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Award
} from 'lucide-react'

interface FeedbackData {
  strengths: string
  improvements: string
  total_score: number
  empathy_score: number
  problem_solving_score: number
  communication_score: number
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

function ScoreRing({ score, label, color, icon: Icon }: { score: number; label: string; color: string; icon: any }) {
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const dash = (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" className="-rotate-90">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="8" />
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
          <span className="text-xl font-black text-[var(--foreground)] leading-none">{score}</span>
          <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase">pts</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-slate-100 rounded-full shadow-sm">
        <Icon className="w-3 h-3 text-slate-400" />
        <span className="text-[11px] font-black text-slate-600 tracking-tight">{label}</span>
      </div>
    </div>
  )
}

function getScoreGrade(score: number) {
  if (score >= 90) return { label: 'S', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200', desc: '완벽한 대응' }
  if (score >= 80) return { label: 'A', color: 'text-[var(--primary)]', bg: 'bg-blue-50 border-blue-200', desc: '우수한 대응' }
  if (score >= 70) return { label: 'B', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', desc: '준수한 대응' }
  if (score >= 60) return { label: 'C', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', desc: '아쉬운 대응' }
  return { label: 'D', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', desc: '추가 연습 필요' }
}

function FeedbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const category = searchParams.get('category') || ''
  const difficulty = searchParams.get('difficulty') || ''

  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      router.push('/')
      return
    }
    loadFeedback()
  }, [sessionId])

  async function loadFeedback() {
    try {
      const cached = sessionStorage.getItem(`feedback_${sessionId}`)
      if (cached) {
        setFeedback(JSON.parse(cached))
        setLoading(false)
        return
      }

      const isSupabaseEnabled = !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here'
      )
      if (isSupabaseEnabled) {
        const { data, error } = await supabase
          .from('feedback')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!error && data) {
          setFeedback(data)
          return
        }
      }

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const result = await res.json()
      if (result.feedback) {
        setFeedback(result.feedback)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-100 rounded-full animate-pulse" />
          <Loader2 className="w-20 h-20 text-[var(--primary)] animate-spin absolute inset-0" strokeWidth={3} />
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-[var(--foreground)] tracking-tight">AI 역량 분석 리포트 생성 중</p>
          <p className="text-slate-400 font-bold mt-1 uppercase text-xs tracking-[0.2em]">Deep Learning Intelligence Analyzing...</p>
        </div>
      </div>
    )
  }

  if (!feedback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border-2 border-rose-100">
            <AlertCircle className="w-8 h-8" />
          </div>
          <p className="text-lg font-bold text-[var(--foreground)]">리포트를 불러올 수 없습니다</p>
          <button onClick={() => router.push('/')} className="primary-button w-full py-3">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const grade = getScoreGrade(feedback.total_score)

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b-2 border-[var(--border)] bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-sm">
              <Zap className="text-white w-6 h-6 fill-current" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[var(--foreground)]">리포트</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-[var(--primary)] transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> 다시 연습
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-5 py-2 bg-[var(--foreground)] text-white font-bold rounded-xl text-sm transition-all hover:bg-slate-800 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" /> 마이 대시보드
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Session info info */}
        <div className="flex items-center gap-3 text-sm font-bold">
          <span className="px-3 py-1 bg-white border-2 border-[var(--border)] rounded-full text-[var(--primary)] uppercase tracking-tight">
            {categoryLabels[category] || category}
          </span>
          <div className="h-1 w-1 bg-slate-300 rounded-full" />
          <span className="px-3 py-1 bg-white border-2 border-[var(--border)] rounded-full text-slate-500">
            {difficultyLabels[difficulty] || difficulty}
          </span>
          <div className="h-1 w-1 bg-slate-300 rounded-full" />
          <span className="text-slate-400 font-medium">Session Complete</span>
        </div>

        {/* Hero Score Card */}
        <div className="bg-white border-2 border-[var(--border)] rounded-[2.5rem] p-10 md:p-14 shadow-[12px_12px_0px_0px_rgba(186,230,253,0.5)] flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-[var(--primary)] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
              Professional Competency Analysis
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-[var(--foreground)] leading-tight tracking-tight">
              귀하의 종합 <br className="hidden md:block" />
              역량 점수입니다
            </h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              AI 모델이 실시간 대화 흐름, 어휘 선택, 공감 지수 및 문제 해결력을 
              바탕으로 정밀 분석한 결과입니다.
            </p>
          </div>
          
          <div className="relative group">
            <div className={`w-48 h-48 md:w-56 md:h-56 rounded-[3rem] border-4 flex flex-col items-center justify-center transition-transform hover:scale-105 ${grade.bg}`}>
              <div className={`text-7xl md:text-8xl font-black ${grade.color} drop-shadow-sm`}>{grade.label}</div>
              <div className={`text-xl md:text-2xl font-black ${grade.color} mt-2`}>{feedback.total_score}점</div>
              <div className="text-[10px] font-black text-slate-400 mt-2 tracking-[0.3em] uppercase">{grade.desc}</div>
            </div>
            <div className="absolute -top-4 -right-4 bg-white border-4 border-[var(--border)] rounded-2xl p-3 shadow-lg">
              <Award className="w-8 h-8 text-amber-500 fill-amber-500" />
            </div>
          </div>
        </div>

        {/* Sub Scores Grid */}
        <div className="bg-white border-2 border-[var(--border)] rounded-[2.5rem] p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
          <ScoreRing score={feedback.empathy_score} label="COMMUNICATION" color="#0EA5E9" icon={MessageSquare} />
          <ScoreRing score={feedback.problem_solving_score} label="PROBLEM SOLVING" color="#8B5CF6" icon={Trophy} />
          <ScoreRing score={feedback.communication_score} label="ADAPTABILITY" color="#10B981" icon={TrendingUp} />
        </div>

        {/* Detailed Feedback Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Strengths */}
          <div className="bg-white border-2 border-[var(--border)] rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[var(--foreground)] tracking-tight">강점 분석</h3>
            </div>
            <div
              className="text-[15px] font-medium text-slate-600 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: String(Array.isArray(feedback.strengths) ? feedback.strengths.join('\n') : feedback.strengths)
                  .replace(/\n/g, '<br />')
                  .replace(/•\s/g, '<span class="text-emerald-500 font-bold mr-2">✓</span>')
                  .replace(/^\-\s/gm, '<span class="text-emerald-500 font-bold mr-2">✓</span>'),
              }}
            />
          </div>

          {/* Improvements */}
          <div className="bg-white border-2 border-[var(--border)] rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border-2 border-amber-100">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[var(--foreground)] tracking-tight">개선 제안</h3>
            </div>
            <div
              className="text-[15px] font-medium text-slate-600 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: String(Array.isArray(feedback.improvements) ? feedback.improvements.join('\n') : feedback.improvements)
                  .replace(/\n/g, '<br />')
                  .replace(/•\s/g, '<span class="text-amber-500 font-bold mr-2">!</span>')
                  .replace(/^\-\s/gm, '<span class="text-amber-500 font-bold mr-2">!</span>'),
              }}
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-[var(--primary)] rounded-[2.5rem] p-12 text-center text-white space-y-6 shadow-xl shadow-blue-100 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h3 className="text-3xl font-black tracking-tight">더 높은 경지에 도전하세요</h3>
            <p className="text-blue-100 font-bold text-lg max-w-lg mx-auto leading-relaxed">
              훈련 성과는 반복을 통해 완성됩니다. <br />
              동일한 시나리오의 다른 난이도에 도전해보시는건 어떨까요?
            </p>
            <div className="pt-4">
              <button
                onClick={() => router.push('/')}
                className="bg-white text-[var(--primary)] font-black px-10 py-4 rounded-2xl hover:bg-blue-50 transition-all text-lg shadow-lg"
              >
                새로운 롤플레이 시작
              </button>
            </div>
          </div>
          {/* Abstract pattern element */}
          <Zap className="absolute -bottom-10 -right-10 w-64 h-64 text-white/10 fill-current -rotate-12" />
        </div>
      </main>
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" /></div>}>
      <FeedbackContent />
    </Suspense>
  )
}
