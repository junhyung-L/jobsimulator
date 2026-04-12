import { NextRequest, NextResponse } from 'next/server'
import { getOpeningMessage, Category, Difficulty, getSystemPrompt } from '@/lib/personas'

const isDemoMode = !process.env.OPENROUTER_API_KEY ||
  process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here'

const isSupabaseEnabled = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here'
)

const MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free'

const mockReplies: Record<string, string[]> = {
  customer: [
    '그래서 언제 해결이 되는 건가요? 기다린 지 벌써 3일이 넘었어요.',
    '다른 고객들한테도 이런 일이 있었나요? 좀 황당하네요.',
    '환불은 얼마나 걸려요? 빨리 처리가 됐으면 좋겠는데...',
    '그렇군요. 그럼 재발 방지는 어떻게 하실 건가요?',
    '알겠습니다. 이번 한 번만 믿어볼게요.',
  ],
  interview: [
    '구체적인 사례를 들어서 다시 설명해 주시겠어요?',
    '그 상황에서 다른 선택지는 없었나요?',
    '팀원과 의견 충돌이 있을 때 어떻게 해결하시나요?',
    '5년 후 본인의 모습을 어떻게 그리고 계세요?',
    '우리 회사를 선택한 이유가 뭔가요?',
  ],
  sales: [
    '가격이 좀 비싼 것 같은데, 할인은 안 되나요?',
    '경쟁사 제품이랑 비교해서 뭐가 더 좋은 건가요?',
    '도입하면 실제로 어느 정도 효과를 볼 수 있을까요?',
    '결정은 제가 혼자 못 하고 위에 보고를 해야 해요.',
    '한번 더 생각해볼게요. 자료 좀 보내주실 수 있나요?',
  ],
}

async function callLLM(systemPrompt: string, messages: { role: 'user' | 'assistant'; content: string }[]) {
  const OpenAI = (await import('openai')).default
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://jobsimulator.pages.dev',
      'X-Title': 'AI Roleplay Job Simulator',
    },
  })

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  })

  return response.choices[0].message.content || ''
}

// POST /api/chat
export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, category, difficulty, messages } = await req.json()

    if (!sessionId || !category || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let assistantMessage: string

    if (isDemoMode) {
      const replies = mockReplies[category] || mockReplies.customer
      const userTurnCount = (messages as { role: string }[]).filter(m => m.role === 'user').length
      assistantMessage = replies[userTurnCount % replies.length]
      await new Promise(r => setTimeout(r, 600))
    } else {
      const systemPrompt = getSystemPrompt(category as Category, difficulty as Difficulty)
      const chatMessages = (messages as { role: string; content: string }[]).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
      if (message) chatMessages.push({ role: 'user' as const, content: message })

      assistantMessage = await callLLM(systemPrompt, chatMessages)
    }

    if (isSupabaseEnabled) {
      const { supabase } = await import('@/lib/supabase')
      if (message) {
        await supabase.from('messages').insert({ session_id: sessionId, role: 'user', content: message })
      }
      await supabase.from('messages').insert({ session_id: sessionId, role: 'assistant', content: assistantMessage })
    }

    return NextResponse.json({ message: assistantMessage })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}

// GET /api/chat — 오프닝 메시지
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')

    if (!sessionId || !category || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const openingMessage = getOpeningMessage(category as Category, difficulty as Difficulty)

    if (isSupabaseEnabled) {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('messages').insert({ session_id: sessionId, role: 'assistant', content: openingMessage })
    }

    return NextResponse.json({ message: openingMessage })
  } catch (error) {
    console.error('Chat init error:', error)
    return NextResponse.json({ error: 'Failed to initialize session' }, { status: 500 })
  }
}
