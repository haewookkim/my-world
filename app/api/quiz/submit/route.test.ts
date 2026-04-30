import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { QuizEntry } from '@/types/quiz'

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }))

vi.mock('@/lib/quiz-store', () => ({
  quizStore: { set: vi.fn(), get: mockGet, delete: vi.fn() },
}))

import { POST } from './route'

const makeEntry = (answers: string[]): QuizEntry => ({
  grade: '중2',
  difficulty: '중',
  problems: [
    { subject: '국어', type: '서술형', prompt: '국어 문제', points: 10 },
    { subject: '수학', type: '단답형', prompt: '수학 문제', points: 10 },
    { subject: '영어', type: '객관식', prompt: '영어 문제', points: 10, choices: ['A', 'B', 'C', 'D'] },
  ],
  answers,
  explanations: ['해설1', '해설2', '해설3'],
  createdAt: Date.now(),
})

const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost/api/quiz/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('POST /api/quiz/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockReturnValue(makeEntry(['정답', '42', 'C']))
  })

  it('정답 답안 → isCorrect:true, earnedPoints === points', async () => {
    const res = await POST(makeRequest({ quizId: 'q1', answers: ['정답', '42', 'C'] }))
    expect(res.status).toBe(200)
    const body = await res.json()
    for (const r of body.results) {
      expect(r.isCorrect).toBe(true)
      expect(r.earnedPoints).toBe(r.points)
    }
  })

  it('오답 답안 → isCorrect:false, earnedPoints === 0', async () => {
    const res = await POST(makeRequest({ quizId: 'q1', answers: ['틀린답', '99', 'D'] }))
    const body = await res.json()
    for (const r of body.results) {
      expect(r.isCorrect).toBe(false)
      expect(r.earnedPoints).toBe(0)
    }
  })

  it('빈 문자열 답안 → isCorrect:false, earnedPoints === 0', async () => {
    const res = await POST(makeRequest({ quizId: 'q1', answers: ['', '', ''] }))
    const body = await res.json()
    for (const r of body.results) {
      expect(r.isCorrect).toBe(false)
      expect(r.earnedPoints).toBe(0)
    }
  })

  it('totalEarned === 정답 과목 earnedPoints 합', async () => {
    const res = await POST(makeRequest({ quizId: 'q1', answers: ['정답', '99', 'C'] }))
    const { results, totalEarned } = await res.json()
    const expected = results.reduce((sum: number, r: { earnedPoints: number }) => sum + r.earnedPoints, 0)
    expect(totalEarned).toBe(expected)
    expect(totalEarned).toBe(20)
  })

  it('존재하지 않는 quizId → 404', async () => {
    mockGet.mockReturnValue(undefined)
    const res = await POST(makeRequest({ quizId: 'not-found', answers: [] }))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('응답에 correctAnswer·explanation 포함 (제출 후 최초 노출)', async () => {
    const res = await POST(makeRequest({ quizId: 'q1', answers: ['정답', '42', 'C'] }))
    const { results } = await res.json()
    for (const r of results) {
      expect(r.correctAnswer).toBeDefined()
      expect(r.explanation).toBeDefined()
    }
  })

  it('정규화 후 비교: 대소문자·공백 무시', async () => {
    mockGet.mockReturnValue(makeEntry(['정답 ', '42', 'c']))
    const res = await POST(makeRequest({ quizId: 'q1', answers: ['정답', '42', 'C'] }))
    const { results } = await res.json()
    for (const r of results) {
      expect(r.isCorrect).toBe(true)
    }
  })

  it('정규화 후 비교: 내부 공백 정규화', async () => {
    mockGet.mockReturnValue(makeEntry(['대한  민국', '42', 'C']))
    const res = await POST(makeRequest({ quizId: 'q1', answers: ['대한 민국', '42', 'C'] }))
    const { results } = await res.json()
    expect(results[0].isCorrect).toBe(true)
  })

  it('quizId가 문자열이 아닌 경우 → 400', async () => {
    const res = await POST(makeRequest({ quizId: 123, answers: [] }))
    expect(res.status).toBe(400)
  })

  it('answers가 배열이 아닌 경우 → 400', async () => {
    const res = await POST(makeRequest({ quizId: 'q1', answers: 'bad' }))
    expect(res.status).toBe(400)
  })
})
