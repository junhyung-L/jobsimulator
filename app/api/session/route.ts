import { NextRequest, NextResponse } from 'next/server'

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_project_url_here'

export async function POST(req: NextRequest) {
  try {
    const { studentName, category, difficulty, userId } = await req.json()

    if (!studentName || !category || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (isDemoMode) {
      return NextResponse.json({
        session: { id: crypto.randomUUID(), student_name: studentName, category, difficulty, status: 'active', user_id: userId }
      })
    }

    const { supabase } = await import('@/lib/supabase')
    const { data, error } = await supabase
      .from('sessions')
      .insert({ 
        student_name: studentName, 
        category, 
        difficulty, 
        status: 'active',
        user_id: userId 
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ session: data })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
