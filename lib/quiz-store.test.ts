import { describe, it, expect, afterEach } from 'vitest'
import { quizStore } from './quiz-store'
import type { QuizEntry } from '@/types/quiz'

const makeEntry = (createdAt = Date.now()): QuizEntry => ({
  grade: '중2',
  difficulty: '중',
  problems: [],
  answers: [],
  explanations: [],
  createdAt,
})

describe('quizStore', () => {
  afterEach(() => {
    quizStore.delete('t1')
    quizStore.delete('t2')
    quizStore.delete('t3')
  })

  it('set 후 get이 동일 entry 반환', () => {
    const entry = makeEntry()
    quizStore.set('t1', entry)
    expect(quizStore.get('t1')).toBe(entry)
  })

  it('delete 후 get이 undefined 반환', () => {
    quizStore.set('t2', makeEntry())
    quizStore.delete('t2')
    expect(quizStore.get('t2')).toBeUndefined()
  })

  it('30분 초과된 entry는 undefined 반환 (TTL 만료)', () => {
    const thirtyOneMinutesAgo = Date.now() - 31 * 60 * 1000
    quizStore.set('t3', makeEntry(thirtyOneMinutesAgo))
    expect(quizStore.get('t3')).toBeUndefined()
  })
})
