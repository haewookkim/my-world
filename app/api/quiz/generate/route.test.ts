import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: mockCreate }
  },
}))

vi.mock('@/lib/quiz-store', () => ({
  quizStore: { set: vi.fn(), get: vi.fn(), delete: vi.fn() },
}))

import { POST } from './route'

const makeLLMProblems = () => [
  { subject: '국어', type: '서술형', prompt: '국어 문제', points: 10, answer: '정답1', explanation: '해설1' },
  { subject: '수학', type: '단답형', prompt: '수학 문제', points: 10, answer: '42', explanation: '해설2' },
  {
    subject: '영어', type: '객관식', prompt: '영어 문제', points: 10,
    choices: ['① A', '② B', '③ C', '④ D'], answer: '③ C', explanation: '해설3',
  },
]

const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost/api/quiz/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('POST /api/quiz/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(makeLLMProblems()) }],
    })
  })

  it('grade 누락 시 400 반환', async () => {
    const res = await POST(makeRequest({ difficulty: '중' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('difficulty 누락 시 400 반환', async () => {
    const res = await POST(makeRequest({ grade: '중2' }))
    expect(res.status).toBe(400)
  })

  it('유효한 요청 시 200, quizId + problems 반환', async () => {
    const res = await POST(makeRequest({ grade: '중2', difficulty: '중' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body.quizId).toBe('string')
    expect(body.problems).toHaveLength(3)
  })

  it('응답 body에 answer·explanation 필드 없음 (정답 보호)', async () => {
    const res = await POST(makeRequest({ grade: '중2', difficulty: '중' }))
    const { problems } = await res.json()
    for (const p of problems) {
      expect(p).not.toHaveProperty('answer')
      expect(p).not.toHaveProperty('explanation')
    }
  })

  it('각 problem의 subject가 국어·수학·영어', async () => {
    const res = await POST(makeRequest({ grade: '중2', difficulty: '중' }))
    const { problems } = await res.json()
    const subjects = problems.map((p: { subject: string }) => p.subject)
    expect(subjects).toContain('국어')
    expect(subjects).toContain('수학')
    expect(subjects).toContain('영어')
  })

  it('객관식 problem에 choices 배열 포함', async () => {
    const res = await POST(makeRequest({ grade: '중2', difficulty: '중' }))
    const { problems } = await res.json()
    const mcq = problems.find((p: { type: string }) => p.type === '객관식')
    expect(mcq?.choices).toBeDefined()
    expect(Array.isArray(mcq.choices)).toBe(true)
  })

  it('Anthropic API 에러 시 500 반환', async () => {
    mockCreate.mockRejectedValue(new Error('API error'))
    const res = await POST(makeRequest({ grade: '중2', difficulty: '중' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })
})
