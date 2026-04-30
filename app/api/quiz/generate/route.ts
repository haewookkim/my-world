import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { quizStore } from '@/lib/quiz-store'
import type { Grade, Difficulty, Problem, QuizEntry } from '@/types/quiz'

type LLMProblem = Problem & { answer: string; explanation: string }

const VALID_GRADES: Grade[] = ['중1', '중2', '중3', '고1', '고2', '고3']
const VALID_DIFFICULTIES: Difficulty[] = ['상', '중', '하']

const SYSTEM_PROMPT = `당신은 한국 교육과정 전문가입니다. 주어진 학년과 난이도에 맞는 문제를 출제합니다.
반드시 아래 JSON 배열 형식으로만 응답하세요. 다른 텍스트(코드블록 마크다운 등)는 절대 포함하지 마세요.
[
  {
    "subject": "국어 또는 수학 또는 영어",
    "type": "서술형 또는 단답형 또는 객관식",
    "prompt": "문제 내용 (한국어)",
    "points": 10,
    "choices": ["① ...", "② ...", "③ ...", "④ ..."],
    "answer": "정답",
    "explanation": "해설 (한국어)"
  }
]
세 과목(국어, 수학, 영어)을 각 1개씩 출제합니다. choices는 객관식 유형일 때만 포함합니다.`

function stripCodeFence(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { grade, difficulty, apiKey } = body as {
      grade?: Grade
      difficulty?: Difficulty
      apiKey?: string
    }

    if (!grade || !difficulty) {
      return NextResponse.json({ error: '학년과 난이도는 필수입니다.' }, { status: 400 })
    }

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'API 키가 필요합니다.' }, { status: 400 })
    }

    if (!VALID_GRADES.includes(grade) || !VALID_DIFFICULTIES.includes(difficulty)) {
      return NextResponse.json({ error: '유효하지 않은 학년 또는 난이도입니다.' }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { responseMimeType: 'application/json' },
    })

    const result = await model.generateContent(
      `학년: ${grade}, 난이도: ${difficulty}에 맞는 문제를 출제해주세요.`,
    )
    const text = result.response.text()

    const parsed = JSON.parse(stripCodeFence(text))
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('LLM response is not a non-empty array')
    }
    for (const p of parsed) {
      if (typeof p.answer !== 'string' || typeof p.explanation !== 'string') {
        throw new Error('LLM response missing answer or explanation field')
      }
    }
    const llmProblems: LLMProblem[] = parsed

    const problems: Problem[] = llmProblems.map(
      ({ answer: _a, explanation: _e, ...rest }) => rest,
    )
    const answers = llmProblems.map((p) => p.answer)
    const explanations = llmProblems.map((p) => p.explanation)

    const quizId = crypto.randomUUID()
    const entry: QuizEntry = {
      grade,
      difficulty,
      problems,
      answers,
      explanations,
      createdAt: Date.now(),
    }
    quizStore.set(quizId, entry)

    return NextResponse.json({ quizId, problems })
  } catch (err) {
    console.error('[quiz/generate] error:', err)
    return NextResponse.json({ error: '문제 생성에 실패했습니다.' }, { status: 500 })
  }
}
