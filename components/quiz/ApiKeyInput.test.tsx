import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiKeyInput } from './ApiKeyInput'

describe('ApiKeyInput', () => {
  it('Input과 도움말 버튼이 렌더됨', () => {
    render(<ApiKeyInput value="" onChange={vi.fn()} />)
    expect(screen.getByLabelText('Gemini API 키')).toBeDefined()
    expect(screen.getByRole('button', { name: '도움말' })).toBeDefined()
  })

  it('Input 변경 시 onChange 호출', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ApiKeyInput value="" onChange={onChange} />)
    await user.type(screen.getByLabelText('Gemini API 키'), 'k')
    expect(onChange).toHaveBeenCalledWith('k')
  })

  it('도움말 클릭 시 발급 단계 다이얼로그가 열림', async () => {
    const user = userEvent.setup()
    render(<ApiKeyInput value="" onChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: '도움말' }))
    expect(screen.getByText(/aistudio\.google\.com/)).toBeDefined()
    expect(screen.getByText(/Get API Key/)).toBeDefined()
    expect(screen.getByText(/Create API Key/)).toBeDefined()
  })

  it('도움말 다이얼로그의 외부 링크는 새 탭으로 열림', async () => {
    const user = userEvent.setup()
    render(<ApiKeyInput value="" onChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: '도움말' }))
    const link = screen.getByRole('link', { name: /aistudio/i })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })
})
