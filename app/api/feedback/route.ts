import { NextRequest, NextResponse } from 'next/server'
import { categoryLabels, difficultyLabels, Category, Difficulty } from '@/lib/personas'

const isDemoMode = !process.env.OPENROUTER_API_KEY ||
  process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here'

const isSupabaseEnabled = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here'
)

const mockFeedback = {
  strengths: '• 고객의 감정에 공감하며 경청하는 자세를 보여주었습니다.\n• 문제 해결 의지를 명확하게 표현했습니다.\n• 상대방의 말을 끊지 않고 끝까지 들었습니다.',
  improvements: '• 구체적인 해결 일정을 먼저 제시했다면 더 효과적이었을 것입니다.\n• 사과 표현이 다소 형식적으로 느껴질 수 있습니다. 더 진심 어린 표현을 연습해 보세요.\n• 대안을 제시할 때 선택지를 2가지 이상 제공하면 고객 만족도가 높아집니다.',
  total_score: 72,
  empathy_score: 78,
  problem_solving_score: 65,
  communication_score: 74,
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, category, difficulty, messages: clientMessages } = await req.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
    }

    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 1200))
      return NextResponse.json({ feedback: mockFeedback, sessionId })
    }

    // Supabase에서 대화 기록 가져오기 (또는 클라이언트에서 전달받은 messages 사용)
    let conversationText = ''
    let categoryLabel = categoryLabels[(category || 'customer') as Category]
    let difficultyLabel = difficultyLabels[(difficulty || 'beginner') as Difficulty]

    if (isSupabaseEnabled) {
      const { supabase } = await import('@/lib/supabase')
      const [{ data: session }, { data: dbMessages }] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', sessionId).single(),
        supabase.from('messages').select('*').eq('session_id', sessionId).order('created_at'),
      ])

      if (!session || !dbMessages) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      categoryLabel = categoryLabels[session.category as Category]
      difficultyLabel = difficultyLabels[session.difficulty as Difficulty]
      conversationText = dbMessages
        .map(m => `[${m.role === 'assistant' ? 'AI 고객' : '수강생'}]: ${m.content}`)
        .join('\n\n')
    } else if (clientMessages) {
      // Supabase 없을 때 클라이언트가 보낸 messages 배열 사용
      conversationText = (clientMessages as { role: string; content: string }[])
        .map(m => `[${m.role === 'assistant' ? 'AI 고객' : '수강생'}]: ${m.content}`)
        .join('\n\n')
    }

    const feedbackPrompt = `당신은 직무 교육 전문 코치입니다. 다음은 "${categoryLabel} - ${difficultyLabel}" 롤플레이 대화 기록입니다.

대화 기록:
${conversationText}

위 대화를 분석하여 다음 JSON 형식으로 피드백을 제공해주세요. JSON 외 다른 텍스트는 포함하지 마세요:

{
  "strengths": "잘한 점을 구체적으로 2-3가지 서술 (마크다운 불릿 포인트 형식으로)",
  "improvements": "개선이 필요한 점을 구체적으로 2-3가지 서술 (마크다운 불릿 포인트 형식으로)",
  "total_score": 100점 만점 종합 점수 (숫자),
  "empathy_score": 공감 및 감정 이해 점수 (0-100 숫자),
  "problem_solving_score": 문제 해결 능력 점수 (0-100 숫자),
  "communication_score": 커뮤니케이션 명확성 점수 (0-100 숫자)
}`

    const OpenAI = (await import('openai')).default
    const client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY!,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://jobsimulator.pages.dev',
        'X-Title': 'AI Roleplay Job Simulator',
      },
    })
    const MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free'
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: feedbackPrompt }],
    })

    const rawText = response.choices[0].message.content || '{}'
    // JSON 블록이 ```json ... ``` 으로 감싸진 경우 추출
    const codeBlock = rawText.match(/```json\s*([\s\S]*?)```/)
    const jsonStr = codeBlock ? codeBlock[1] : (rawText.match(/\{[\s\S]*\}/) || [rawText])[0]
    const feedbackData = JSON.parse(jsonStr)

    if (isSupabaseEnabled) {
      const { supabase } = await import('@/lib/supabase')
      await Promise.all([
        supabase.from('feedback').insert({
          session_id: sessionId,
          ...feedbackData,
        }),
        supabase.from('sessions').update({ status: 'completed' }).eq('id', sessionId),
      ])
    }

    return NextResponse.json({ feedback: feedbackData, sessionId })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 })
  }
}
