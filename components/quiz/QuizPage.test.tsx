import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuizPage } from './QuizPage'

const mockProblems = [
  { subject: '국어', type: '서술형', prompt: '국어 문제', points: 10 },
  { subject: '수학', type: '단답형', prompt: '수학 문제', points: 10 },
  { subject: '영어', type: '객관식', prompt: '영어 문제', points: 10, choices: ['① A', '② B', '③ C'] },
]

const mockResults = [
  { subject: '국어', userAnswer: '정답', correctAnswer: '정답', isCorrect: true, explanation: '해설1', earnedPoints: 10, points: 10 },
  { subject: '수학', userAnswer: '42', correctAnswer: '42', isCorrect: true, explanation: '해설2', earnedPoints: 10, points: 10 },
  { subject: '영어', userAnswer: '① A', correctAnswer: '① A', isCorrect: true, explanation: '해설3', earnedPoints: 10, points: 10 },
]

const mockWrongResults = [
  { subject: '국어', userAnswer: '오답', correctAnswer: '정답', isCorrect: false, explanation: '해설1', earnedPoints: 0, points: 10 },
  { subject: '수학', userAnswer: '42', correctAnswer: '42', isCorrect: true, explanation: '해설2', earnedPoints: 10, points: 10 },
  { subject: '영어', userAnswer: '', correctAnswer: '① A', isCorrect: false, explanation: '해설3', earnedPoints: 0, points: 10 },
]

function makeJsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockFetch(generateData: unknown, submitData: unknown) {
  vi.spyOn(global, 'fetch').mockImplementation((url) => {
    if (String(url).includes('generate'))
      return Promise.resolve(makeJsonResponse(generateData))
    return Promise.resolve(makeJsonResponse(submitData))
  })
}

async function selectAndGenerate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('radio', { name: '중2' }))
  await user.click(screen.getByRole('radio', { name: '중' }))
  await user.click(screen.getByRole('button', { name: '출제' }))
  await waitFor(() => expect(screen.queryByText('국어 문제')).toBeTruthy())
}

describe('QuizPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockFetch(
      { quizId: 'q1', problems: mockProblems },
      { results: mockResults, totalEarned: 30, totalPoints: 30 },
    )
  })

  it('초기 화면에 GradeSelector 렌더됨', () => {
    render(<QuizPage />)
    expect(screen.getByRole('radio', { name: '중1' })).toBeDefined()
    expect(screen.getByRole('button', { name: '출제' })).toBeDefined()
  })

  it('출제 후 카드 3개 + 학년·난이도 배지 표시됨', async () => {
    const user = userEvent.setup()
    render(<QuizPage />)
    await selectAndGenerate(user)
    expect(screen.getByText('국어 문제')).toBeDefined()
    expect(screen.getByText('수학 문제')).toBeDefined()
    expect(screen.getByText('영어 문제')).toBeDefined()
    expect(screen.getByText('중2')).toBeDefined()
    expect(screen.getByText('중')).toBeDefined()
  })

  it('퀴즈 화면에 정답·해설 없음 (정답 보호)', async () => {
    const user = userEvent.setup()
    render(<QuizPage />)
    await selectAndGenerate(user)
    expect(screen.queryByText('정답')).toBeNull()
    expect(screen.queryByText('해설')).toBeNull()
  })

  it('제출 → 과목별 정오·해설·점수 + 총점 표시', async () => {
    const user = userEvent.setup()
    render(<QuizPage />)
    await selectAndGenerate(user)
    await user.click(screen.getByRole('button', { name: '제출' }))
    await waitFor(() => expect(screen.queryByText('30 / 30')).toBeTruthy())
    expect(screen.queryByText('오답')).toBeNull()
  })

  it('일부 오답 → 혼합 결과 + 부분 총점', async () => {
    mockFetch(
      { quizId: 'q1', problems: mockProblems },
      { results: mockWrongResults, totalEarned: 10, totalPoints: 30 },
    )
    const user = userEvent.setup()
    render(<QuizPage />)
    await selectAndGenerate(user)
    await user.click(screen.getByRole('button', { name: '제출' }))
    await waitFor(() => expect(screen.queryByText('10 / 30')).toBeTruthy())
    expect(screen.getByText('(미응답)')).toBeDefined()
  })

  it('빈 답안 포함 제출 버튼 활성 상태', async () => {
    const user = userEvent.setup()
    render(<QuizPage />)
    await selectAndGenerate(user)
    const submitBtn = screen.getByRole('button', { name: '제출' })
    expect((submitBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('새 문제로 다시 풀기 → 이전 결과 사라짐, 동일 학년·난이도로 재출제', async () => {
    const user = userEvent.setup()
    render(<QuizPage />)
    await selectAndGenerate(user)
    await user.click(screen.getByRole('button', { name: '제출' }))
    await waitFor(() => expect(screen.queryByText('30 / 30')).toBeTruthy())
    await user.click(screen.getByRole('button', { name: '새 문제로 다시 풀기' }))
    await waitFor(() => expect(screen.queryByText('국어 문제')).toBeTruthy())
    expect(screen.queryByText('30 / 30')).toBeNull()
  })

  it('처음으로 → 선택 화면 복귀, 학년·난이도 초기화', async () => {
    const user = userEvent.setup()
    render(<QuizPage />)
    await selectAndGenerate(user)
    await user.click(screen.getByRole('button', { name: '처음으로' }))
    expect(screen.getByRole('button', { name: '출제' })).toBeDefined()
    expect(screen.queryByText('국어 문제')).toBeNull()
  })

  // Task 8: 에러 처리 + 중복 호출 방지
  it('출제 API 실패 → 에러 메시지 + 다시 시도 버튼', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve(makeJsonResponse({ error: '문제 생성에 실패했습니다.' }, 500)),
    )
    const user = userEvent.setup()
    render(<QuizPage />)
    await user.click(screen.getByRole('radio', { name: '중2' }))
    await user.click(screen.getByRole('radio', { name: '중' }))
    await user.click(screen.getByRole('button', { name: '출제' }))
    await waitFor(() => expect(screen.queryByText('출제에 실패했습니다. 다시 시도해 주세요.')).toBeTruthy())
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeDefined()
  })

  it('에러 시 학년·난이도 선택값 유지됨', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve(makeJsonResponse({ error: '실패' }, 500)),
    )
    const user = userEvent.setup()
    render(<QuizPage />)
    await user.click(screen.getByRole('radio', { name: '중2' }))
    await user.click(screen.getByRole('radio', { name: '중' }))
    await user.click(screen.getByRole('button', { name: '출제' }))
    await waitFor(() => screen.getByRole('button', { name: '다시 시도' }))
    expect(screen.getByRole('radio', { name: '중2' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: '중' }).getAttribute('aria-checked')).toBe('true')
  })

  it('출제 진행 중 출제 버튼 비활성화', async () => {
    let resolve: (r: Response) => void
    vi.spyOn(global, 'fetch').mockReturnValue(
      new Promise<Response>((r) => { resolve = r }),
    )
    const user = userEvent.setup()
    render(<QuizPage />)
    await user.click(screen.getByRole('radio', { name: '중2' }))
    await user.click(screen.getByRole('radio', { name: '중' }))
    await user.click(screen.getByRole('button', { name: '출제' }))
    expect((screen.getByRole('button', { name: '출제' }) as HTMLButtonElement).disabled).toBe(true)
    resolve!(makeJsonResponse({ quizId: 'q1', problems: mockProblems }))
  })
})
