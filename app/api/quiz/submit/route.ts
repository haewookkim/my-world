import { NextRequest, NextResponse } from 'next/server'
import { quizStore } from '@/lib/quiz-store'
import type { SubmitResult } from '@/types/quiz'

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

export async function POST(req: NextRequest) {
  try {
    const { quizId, answers } = await req.json()

    const entry = quizStore.get(quizId)
    if (!entry) {
      return NextResponse.json({ error: '퀴즈를 찾을 수 없습니다.' }, { status: 404 })
    }

    const results: SubmitResult[] = entry.problems.map((problem, i) => {
      const userAnswer = answers[i] ?? ''
      const correctAnswer = entry.answers[i]
      const isCorrect = normalize(userAnswer) === normalize(correctAnswer)
      return {
        subject: problem.subject,
        userAnswer,
        correctAnswer,
        isCorrect,
        explanation: entry.explanations[i],
        earnedPoints: isCorrect ? problem.points : 0,
        points: problem.points,
      }
    })

    const totalEarned = results.reduce((sum, r) => sum + r.earnedPoints, 0)
    const totalPoints = results.reduce((sum, r) => sum + r.points, 0)

    return NextResponse.json({ results, totalEarned, totalPoints })
  } catch {
    return NextResponse.json({ error: '채점에 실패했습니다.' }, { status: 500 })
  }
}
