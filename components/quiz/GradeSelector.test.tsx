import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GradeSelector } from './GradeSelector'

describe('GradeSelector', () => {
  it('학년 버튼 6개 렌더됨', () => {
    render(<GradeSelector onSubmit={vi.fn()} />)
    const grades = ['중1', '중2', '중3', '고1', '고2', '고3']
    for (const g of grades) {
      expect(screen.getByRole('radio', { name: g })).toBeDefined()
    }
  })

  it('난이도 버튼 3개 렌더됨', () => {
    render(<GradeSelector onSubmit={vi.fn()} />)
    for (const d of ['상', '중', '하']) {
      expect(screen.getByRole('radio', { name: d })).toBeDefined()
    }
  })

  it('학년 클릭 → 해당 값 선택, 이전 선택 해제', async () => {
    const user = userEvent.setup()
    render(<GradeSelector onSubmit={vi.fn()} />)
    await user.click(screen.getByRole('radio', { name: '중1' }))
    expect(screen.getByRole('radio', { name: '중1' }).getAttribute('aria-checked')).toBe('true')
    await user.click(screen.getByRole('radio', { name: '중2' }))
    expect(screen.getByRole('radio', { name: '중2' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: '중1' }).getAttribute('aria-checked')).toBe('false')
  })

  it('난이도 클릭 → 해당 값 선택, 이전 선택 해제', async () => {
    const user = userEvent.setup()
    render(<GradeSelector onSubmit={vi.fn()} />)
    await user.click(screen.getByRole('radio', { name: '상' }))
    expect(screen.getByRole('radio', { name: '상' }).getAttribute('aria-checked')).toBe('true')
    await user.click(screen.getByRole('radio', { name: '중' }))
    expect(screen.getByRole('radio', { name: '중' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: '상' }).getAttribute('aria-checked')).toBe('false')
  })

  it('출제 버튼 클릭 → onSubmit(grade, difficulty) 호출', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<GradeSelector onSubmit={onSubmit} />)
    await user.click(screen.getByRole('radio', { name: '중2' }))
    await user.click(screen.getByRole('radio', { name: '중' }))
    await user.click(screen.getByRole('button', { name: '출제' }))
    expect(onSubmit).toHaveBeenCalledWith('중2', '중')
  })
})
