'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Target, 
  Briefcase, 
  TrendingUp, 
  User, 
  ArrowRight, 
  Check,
  Zap
} from 'lucide-react'
import AuthButton from '@/components/AuthButton'

type Category = 'customer' | 'interview' | 'sales'
type Difficulty = 'beginner' | 'intermediate' | 'advanced'

const categories = [
  {
    id: 'customer' as Category,
    label: '고객응대',
    icon: Target,
    description: '불만 고객 응대, 문제 해결, CS 커뮤니케이션',
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  {
    id: 'interview' as Category,
    label: '면접',
    icon: Briefcase,
    description: '신입/경력 면접, 압박 질문, 역량 어필 연습',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50'
  },
  {
    id: 'sales' as Category,
    label: '세일즈',
    icon: TrendingUp,
    description: 'B2C/B2B 영업, 가격 협상, 클로징 기술',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
]

const difficulties = [
  {
    id: 'beginner' as Difficulty,
    label: '초급',
    description: '기본 대화 흐름 익히기',
    activeClass: 'bg-emerald-600 border-emerald-600 text-white',
    inactiveClass: 'bg-white border-slate-200 hover:border-emerald-200'
  },
  {
    id: 'intermediate' as Difficulty,
    label: '중급',
    description: '돌발 상황 대응 연습',
    activeClass: 'bg-amber-500 border-amber-500 text-white',
    inactiveClass: 'bg-white border-slate-200 hover:border-amber-200'
  },
  {
    id: 'advanced' as Difficulty,
    label: '고급',
    description: '고강도 압박 시뮬레이션',
    activeClass: 'bg-rose-600 border-rose-600 text-white',
    inactiveClass: 'bg-white border-slate-200 hover:border-rose-200'
  },
]

export default function HomePage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null)
  const [studentName, setStudentName] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null)
      if (session?.user?.user_metadata?.full_name) {
        setStudentName(session.user.user_metadata.full_name)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null)
      if (session?.user?.user_metadata?.full_name) {
        setStudentName(session.user.user_metadata.full_name)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const canStart = selectedCategory && selectedDifficulty && studentName.trim()

  async function handleStart() {
    if (!canStart) return
    setLoading(true)

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: studentName.trim(),
          category: selectedCategory,
          difficulty: selectedDifficulty,
          userId: currentUser?.id
        }),
      })

      const data = await res.json()
      if (data.session) {
        router.push(
          `/roleplay?sessionId=${data.session.id}&category=${selectedCategory}&difficulty=${selectedDifficulty}`
        )
      } else {
        const localId = crypto.randomUUID()
        router.push(
          `/roleplay?sessionId=${localId}&category=${selectedCategory}&difficulty=${selectedDifficulty}`
        )
      }
    } catch (err) {
      console.error(err)
      const localId = crypto.randomUUID()
      router.push(
        `/roleplay?sessionId=${localId}&category=${selectedCategory}&difficulty=${selectedDifficulty}`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b-2 border-[var(--border)] bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm overflow-hidden border-2 border-[var(--border)]">
              <img src="/logo.png" alt="Job Sim AI Logo" className="w-full h-full object-contain scale-[1.35]" />
            </div>
            <span className="font-bold text-xl tracking-tight text-[var(--foreground)]">Job Sim AI</span>
          </div>
          <div className="flex items-center gap-6">
            {currentUser && (
              <>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-sm font-semibold text-[var(--primary)] hover:text-[var(--secondary)] transition-colors flex items-center gap-1"
                >
                  마이 대시보드 <ArrowRight className="w-4 h-4" />
                </button>
                <div className="w-[2px] h-6 bg-slate-100 hidden md:block"></div>
              </>
            )}
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 bg-white border-2 border-[var(--border)] rounded-full px-5 py-2 text-sm text-[var(--primary)] font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse"></span>
            AI 기반 실전 직무 시뮬레이터
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-[var(--foreground)] leading-[1.1] tracking-tight">
            실전처럼 연습하고<br />
            <span className="text-[var(--primary)]">AI 피드백</span>으로 성장하세요
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
            고객응대부터 면접, 세일즈까지 — AI가 실제 상황처럼 대화하고<br className="hidden md:block" />
            세션 종료 후 맞춤형 역량 분석 리포트를 제공합니다.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-12">
          {/* Form Card */}
          <div className="bg-white border-2 border-[var(--border)] rounded-[2rem] p-8 md:p-12 space-y-10 shadow-[8px_8px_0px_0px_rgba(186,230,253,0.5)]">
            
            {/* Step 1: Name */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">1</div>
                <label className="text-lg font-bold text-[var(--foreground)]">사용자 프로필</label>
              </div>
              
              {currentUser ? (
                <div className="flex items-center gap-4 p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl">
                  <div className="w-14 h-14 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xl font-black shadow-sm overflow-hidden">
                    {currentUser.user_metadata?.avatar_url ? (
                      <img src={currentUser.user_metadata.avatar_url} alt="avatar" />
                    ) : (
                      currentUser.email?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">로그인됨</div>
                    <div className="text-xl font-black text-[var(--foreground)] tracking-tight">
                      {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="성함을 입력해주세요"
                      className="w-full border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-lg focus:outline-none focus:border-[var(--primary)] transition-all bg-slate-50 font-medium"
                    />
                  </div>
                  <div className="mt-3 py-2 px-4 bg-amber-50 rounded-xl border border-amber-100 text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    로그인하면 연습 기록이 대시보드에 안전하게 저장됩니다
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Category */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">2</div>
                <label className="text-lg font-bold text-[var(--foreground)]">직무 카테고리</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const Icon = cat.icon
                  const isSelected = selectedCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-6 rounded-2xl border-2 text-left transition-all group relative ${
                        isSelected
                          ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                          : 'border-slate-100 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                        isSelected ? 'bg-white/20' : cat.bg
                      }`}>
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : cat.color}`} />
                      </div>
                      <div className="font-bold text-lg mb-1">{cat.label}</div>
                      <div className={`text-xs leading-snug font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        {cat.description}
                      </div>
                      {isSelected && (
                        <div className="absolute top-4 right-4 bg-white rounded-full p-1">
                          <Check className="w-3 h-3 text-[var(--primary)] stroke-[3]" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 3: Difficulty */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">3</div>
                <label className="text-lg font-bold text-[var(--foreground)]">시뮬레이션 난이도</label>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {difficulties.map((diff) => {
                  const isSelected = selectedDifficulty === diff.id
                  return (
                    <button
                      key={diff.id}
                      onClick={() => setSelectedDifficulty(diff.id)}
                      className={`p-5 rounded-2xl border-2 text-center transition-all ${
                        isSelected ? diff.activeClass : diff.inactiveClass
                      }`}
                    >
                      <div className="font-bold text-lg">{diff.label}</div>
                      <div className={`text-[10px] mt-1 font-bold uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {diff.description}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStart}
              disabled={!canStart || loading}
              className={`w-full py-5 rounded-2xl font-bold text-xl transition-all flex items-center justify-center gap-2 ${
                canStart && !loading
                  ? 'bg-[var(--primary)] hover:bg-[var(--secondary)] text-white shadow-lg shadow-blue-200'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  엔진 준비 중...
                </span>
              ) : (
                <>AI 롤플레이 시작하기 <ArrowRight className="w-6 h-6" /></>
              )}
            </button>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: '시나리오 선택', desc: '직무와 난이도를\n선택하세요' },
              { step: '02', title: 'AI 롤플레이', desc: 'AI가 실제 상황의\n상대방이 됩니다' },
              { step: '03', title: '역량 리포트', desc: '상세 피드백과 점수를\n확인하세요' },
            ].map((item) => (
              <div key={item.step} className="bg-white border-2 border-[var(--border)] rounded-2xl p-6 text-center">
                <div className="text-lg font-black text-[var(--primary)] mb-2 opacity-20">STEP {item.step}</div>
                <div className="font-bold text-[var(--foreground)] mb-2">{item.title}</div>
                <div className="text-sm text-slate-500 font-medium leading-tight whitespace-pre-line">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
