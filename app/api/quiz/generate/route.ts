import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { quizStore } from '@/lib/quiz-store'
import type { Grade, Difficulty, Problem, QuizEntry } from '@/types/quiz'

const client = new Anthropic()

type LLMProblem = Problem & { answer: string; explanation: string }

const SYSTEM_PROMPT = `당신은 한국 교육과정 전문가입니다. 주어진 학년과 난이도에 맞는 문제를 출제합니다.
반드시 아래 JSON 배열 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { grade, difficulty } = body as { grade?: Grade; difficulty?: Difficulty }

    if (!grade || !difficulty) {
      return NextResponse.json({ error: '학년과 난이도는 필수입니다.' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [
        {
          role: 'user',
          content: `학년: ${grade}, 난이도: ${difficulty}에 맞는 문제를 출제해주세요.`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected LLM response type')
    }

    const llmProblems: LLMProblem[] = JSON.parse(content.text)

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
  } catch {
    return NextResponse.json({ error: '문제 생성에 실패했습니다.' }, { status: 500 })
  }
}
