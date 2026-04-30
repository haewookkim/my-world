import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProblemCard } from './ProblemCard'
import type { Problem } from '@/types/quiz'

const baseProblem: Problem = {
  subject: '국어',
  type: '서술형',
  prompt: '다음 글을 읽고 주제를 서술하시오.',
  points: 10,
}

describe('ProblemCard', () => {
  it('subject·배점·유형이 헤더에 표시됨', () => {
    render(<ProblemCard problem={baseProblem} answer="" onAnswerChange={vi.fn()} />)
    expect(screen.getByText('국어')).toBeDefined()
    expect(screen.getByText(/10점/)).toBeDefined()
    expect(screen.getByText(/서술형/)).toBeDefined()
  })

  it('서술형 → Textarea 렌더됨', () => {
    render(<ProblemCard problem={baseProblem} answer="" onAnswerChange={vi.fn()} />)
    expect(screen.getByRole('textbox').tagName.toLowerCase()).toBe('textarea')
  })

  it('단답형 → Input 렌더됨', () => {
    const problem: Problem = { ...baseProblem, type: '단답형' }
    render(<ProblemCard problem={problem} answer="" onAnswerChange={vi.fn()} />)
    expect(screen.getByRole('textbox').tagName.toLowerCase()).toBe('input')
  })

  it('객관식 → choices 수만큼 선택지 버튼 렌더됨', () => {
    const problem: Problem = {
      ...baseProblem,
      type: '객관식',
      choices: ['① A', '② B', '③ C', '④ D'],
    }
    render(<ProblemCard problem={problem} answer="" onAnswerChange={vi.fn()} />)
    expect(screen.getAllByRole('radio')).toHaveLength(4)
  })

  it('카드에 "정답" · "해설" 텍스트 없음 (정답 보호)', () => {
    render(<ProblemCard problem={baseProblem} answer="" onAnswerChange={vi.fn()} />)
    expect(screen.queryByText('정답')).toBeNull()
    expect(screen.queryByText('해설')).toBeNull()
  })

  it('Textarea 입력 시 onAnswerChange 호출됨', async () => {
    const user = userEvent.setup()
    const onAnswerChange = vi.fn()
    render(<ProblemCard problem={baseProblem} answer="" onAnswerChange={onAnswerChange} />)
    await user.type(screen.getByRole('textbox'), '테스트 답변')
    expect(onAnswerChange).toHaveBeenCalled()
  })

  it('객관식 선택지 클릭 시 onAnswerChange 호출됨', async () => {
    const user = userEvent.setup()
    const onAnswerChange = vi.fn()
    const problem: Problem = {
      ...baseProblem,
      type: '객관식',
      choices: ['① A', '② B', '③ C', '④ D'],
    }
    render(<ProblemCard problem={problem} answer="" onAnswerChange={onAnswerChange} />)
    await user.click(screen.getByRole('radio', { name: '① A' }))
    expect(onAnswerChange).toHaveBeenCalledWith('① A')
  })

  it('disabled=true → textbox disabled 처리됨', () => {
    render(<ProblemCard problem={baseProblem} answer="" onAnswerChange={vi.fn()} disabled />)
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).disabled).toBe(true)
  })
})
