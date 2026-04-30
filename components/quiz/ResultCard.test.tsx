import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultCard } from './ResultCard'
import type { SubmitResult } from '@/types/quiz'

const correctResult: SubmitResult = {
  subject: '국어',
  userAnswer: '정답입니다',
  correctAnswer: '정답입니다',
  isCorrect: true,
  explanation: '이 문제의 해설입니다.',
  earnedPoints: 10,
  points: 10,
}

const wrongResult: SubmitResult = {
  subject: '수학',
  userAnswer: '틀린 답',
  correctAnswer: '올바른 답',
  isCorrect: false,
  explanation: '수학 해설입니다.',
  earnedPoints: 0,
  points: 10,
}

const emptyResult: SubmitResult = {
  subject: '영어',
  userAnswer: '',
  correctAnswer: 'C',
  isCorrect: false,
  explanation: '영어 해설입니다.',
  earnedPoints: 0,
  points: 10,
}

describe('ResultCard', () => {
  it('isCorrect:true → "정답" 텍스트, 획득 배점 표시', () => {
    render(<ResultCard result={correctResult} />)
    expect(screen.getByText('정답')).toBeDefined()
    expect(screen.getByText('10/10')).toBeDefined()
  })

  it('isCorrect:false → "오답" 텍스트, earnedPoints:0, 시스템 정답 표시', () => {
    render(<ResultCard result={wrongResult} />)
    expect(screen.getByText('오답')).toBeDefined()
    expect(screen.getByText('0/10')).toBeDefined()
    expect(screen.getByText('올바른 답')).toBeDefined()
  })

  it('userAnswer === "" → "(미응답)" 표시', () => {
    render(<ResultCard result={emptyResult} />)
    expect(screen.getByText('(미응답)')).toBeDefined()
  })

  it('해설 텍스트가 항상 표시됨', () => {
    render(<ResultCard result={correctResult} />)
    expect(screen.getByText('이 문제의 해설입니다.')).toBeDefined()
  })

  it('subject·배점이 카드 헤더에 표시됨', () => {
    render(<ResultCard result={correctResult} />)
    expect(screen.getByText('국어')).toBeDefined()
    expect(screen.getByText(/10점/)).toBeDefined()
  })
})
