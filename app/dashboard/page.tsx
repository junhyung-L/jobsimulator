'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  BarChart3, 
  Clock, 
  Target, 
  ChevronRight, 
  ChevronDown,
  Search, 
  Filter, 
  ArrowLeft,
  Zap,
  RefreshCw,
  User,
  Calendar,
  MessageSquare,
  Trophy,
  Loader2,
  CheckCircle2,
  TrendingUp
} from 'lucide-react'

interface SessionWithFeedback {
  id: string
  created_at: string
  student_name: string
  category: string
  difficulty: string
  status: string
  feedback: {
    total_score: number
    empathy_score: number
    problem_solving_score: number
    communication_score: number
  } | null
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

function ScoreBar({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-bold text-[var(--foreground)]">{score}pt</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionWithFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setRefreshing(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/')
        return
      }

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (sessionsError) throw sessionsError

      const sessionsWithFeedback: SessionWithFeedback[] = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const { data: feedbackData } = await supabase
            .from('feedback')
            .select('total_score, empathy_score, problem_solving_score, communication_score')
            .eq('session_id', session.id)
            .single()

          return { ...session, feedback: feedbackData || null }
        })
      )

      setSessions(sessionsWithFeedback)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const completedSessions = sessions.filter((s) => s.feedback)
  const filteredSessions = selectedCategory === 'all'
    ? sessions
    : sessions.filter((s) => s.category === selectedCategory)

  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.feedback?.total_score || 0), 0) / completedSessions.length)
    : 0

  const avgEmpathy = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.feedback?.empathy_score || 0), 0) / completedSessions.length)
    : 0

  const avgProblemSolving = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.feedback?.problem_solving_score || 0), 0) / completedSessions.length)
    : 0

  const avgCommunication = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.feedback?.communication_score || 0), 0) / completedSessions.length)
    : 0

  const weakestCategory = ['empathy_score', 'problem_solving_score', 'communication_score']
    .map((key) => {
      const avg = completedSessions.length > 0
        ? Math.round(completedSessions.reduce((sum, s) => sum + ((s.feedback as Record<string, number>)?.[key] || 0), 0) / completedSessions.length)
        : 0
      return { key, avg }
    })
    .sort((a, b) => a.avg - b.avg)[0]

  const weakestLabels: Record<string, string> = {
    empathy_score: '공감 능력',
    problem_solving_score: '문제 해결',
    communication_score: '커뮤니케이션',
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b-2 border-[var(--border)] bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-[var(--primary)] transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="h-6 w-0.5 bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain scale-125" />
              </div>
              <span className="font-bold text-lg tracking-tight text-[var(--foreground)]">마이 대시보드</span>
            </div>
          </div>
          <button
            onClick={loadDashboard}
            disabled={refreshing}
            className="p-2.5 bg-white border-2 border-[var(--border)] rounded-xl text-slate-500 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all shadow-sm flex items-center gap-2 font-bold text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">데이터 갱신</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
            <p className="font-bold text-slate-400 uppercase text-xs tracking-widest">분석 데이터 로딩 중</p>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: '전체 세션', value: sessions.length, unit: '개', icon: Calendar, bg: 'bg-white', text: 'text-[var(--foreground)]' },
                { label: '완료 역량', value: completedSessions.length, unit: '건', icon: CheckCircle2, bg: 'bg-blue-50', text: 'text-[var(--primary)]' },
                { label: '평균 점수', value: avgScore, unit: '점', icon: Trophy, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                {
                  label: '집중 강화',
                  value: completedSessions.length > 0 ? weakestLabels[weakestCategory?.key || ''] : '-',
                  unit: '',
                  icon: Target,
                  bg: 'bg-rose-50',
                  text: 'text-rose-600',
                },
              ].map((stat, i) => (
                <div key={i} className={`border-2 border-[var(--border)] rounded-3xl p-6 shadow-sm ${stat.bg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</span>
                    <stat.icon className={`w-5 h-5 ${stat.text} opacity-20`} />
                  </div>
                  <div className={`text-3xl font-black ${stat.text} tracking-tight`}>
                    {stat.value}<span className="text-sm ml-1 font-bold opacity-60">{stat.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Average scores chart area */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border-2 border-[var(--border)] rounded-3xl p-8 space-y-8 shadow-[8px_8px_0px_0px_rgba(241,245,249,1)]">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
                    <h3 className="font-black text-lg text-[var(--foreground)] uppercase tracking-tight">전체 역량 지표</h3>
                  </div>
                  {completedSessions.length > 0 ? (
                    <div className="space-y-6">
                      <ScoreBar score={avgEmpathy} label="COMMUNICATION" color="#0EA5E9" />
                      <ScoreBar score={avgProblemSolving} label="PROBLEM SOLVING" color="#8B5CF6" />
                      <ScoreBar score={avgCommunication} label="ADAPTABILITY" color="#10B981" />
                    </div>
                  ) : (
                    <div className="py-10 text-center space-y-2">
                        <p className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">No Competency Data</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sessions list */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-slate-400" />
                        <h3 className="font-black text-lg text-[var(--foreground)] uppercase tracking-tight">최근 훈련 세션 리스트</h3>
                    </div>
                    {/* Filter */}
                    <div className="flex flex-wrap items-center gap-2">
                        {['all', 'customer', 'interview', 'sales'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight border-2 transition-all ${
                                    selectedCategory === cat
                                    ? 'bg-[var(--foreground)] text-white border-[var(--foreground)] shadow-lg'
                                    : 'bg-white border-[var(--border)] text-slate-400 hover:border-slate-300'
                                }`}
                            >
                                {cat === 'all' ? '전체' : categoryLabels[cat]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                  {filteredSessions.length === 0 ? (
                    <div className="bg-white rounded-3xl border-2 border-[var(--border)] p-20 text-center space-y-4 border-dashed">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-200">
                          <MessageSquare className="w-8 h-8" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">아직 진행된 훈련 세션이 없습니다</p>
                    </div>
                  ) : (
                    filteredSessions.map((session) => (
                      <div 
                        key={session.id} 
                        className={`bg-white border-2 rounded-[2rem] transition-all overflow-hidden shadow-sm group ${
                            expandedSession === session.id ? 'border-[var(--primary)] ring-4 ring-blue-50' : 'border-[var(--border)] hover:border-slate-300'
                        }`}
                      >
                        <div
                          className="p-6 md:p-8 flex items-center justify-between cursor-pointer"
                          onClick={() =>
                            setExpandedSession(expandedSession === session.id ? null : session.id)
                          }
                        >
                          <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-colors ${
                                session.feedback ? 'bg-blue-50 border-blue-100 text-[var(--primary)]' : 'bg-slate-50 border-slate-100 text-slate-300'
                            }`}>
                                <User className="w-6 h-6" />
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="font-black text-xl text-[var(--foreground)] tracking-tight">{session.student_name}</span>
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-black tracking-wider uppercase border-2 ${
                                    difficultyClasses[session.difficulty] || 'bg-slate-50 text-slate-600 border-slate-100'
                                }`}>
                                  {difficultyLabels[session.difficulty] || session.difficulty}
                                </span>
                                <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 border-2 border-slate-200 text-slate-500 font-black uppercase tracking-wider">
                                  {categoryLabels[session.category] || session.category}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                <Calendar className="w-3 h-3" />
                                {new Date(session.created_at).toLocaleString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
    
                          <div className="flex items-center gap-8">
                            {session.feedback ? (
                              <div className="text-right hidden md:block">
                                <div className={`text-2xl font-black ${
                                  session.feedback.total_score >= 80 ? 'text-[var(--primary)]' :
                                  session.feedback.total_score >= 60 ? 'text-amber-500' : 'text-rose-500'
                                }`}>
                                  {session.feedback.total_score}<span className="text-xs ml-0.5 opacity-60">PT</span>
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Composite Score</div>
                              </div>
                            ) : (
                              <span className="text-[10px] font-black text-slate-300 bg-slate-50 border-2 border-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
                                {session.status === 'active' ? 'In Progress' : 'Incomplete'}
                              </span>
                            )}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${
                                expandedSession === session.id ? 'bg-[var(--primary)] border-[var(--primary)] text-white' : 'bg-white border-[var(--border)] text-slate-300 group-hover:border-slate-300'
                            }`}>
                              {expandedSession === session.id ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                            </div>
                          </div>
                        </div>
    
                        {expandedSession === session.id && (
                          <div className="border-t-2 border-slate-100 px-8 py-8 bg-slate-50/50 space-y-8 animate-in slide-in-from-top duration-300">
                            {session.feedback ? (
                              <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <ScoreBar score={session.feedback.empathy_score} label="COMMUNICATION" color="#0EA5E9" />
                                    <ScoreBar score={session.feedback.problem_solving_score} label="PROBLEM SOLVING" color="#8B5CF6" />
                                    <ScoreBar score={session.feedback.communication_score} label="ADAPTABILITY" color="#10B981" />
                                </div>
                                <div className="pt-2 flex justify-end">
                                  <button
                                    onClick={() =>
                                      router.push(
                                        `/feedback?sessionId=${session.id}&category=${session.category}&difficulty=${session.difficulty}`
                                      )
                                    }
                                    className="px-6 py-3 bg-[var(--foreground)] text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                                  >
                                    View Detailed Analytics <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </>
                            ) : (
                                <div className="py-4 text-center">
                                    <p className="text-slate-400 font-bold text-sm">상세 피드백 데이터가 생성되지 않은 세션입니다.</p>
                                </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
