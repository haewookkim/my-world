'use client'

import { useState } from 'react'
import { GradeSelector } from './GradeSelector'
import { ProblemCard } from './ProblemCard'
import { ResultCard } from './ResultCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Grade, Difficulty, Problem, SubmitResult } from '@/types/quiz'

type Phase = 'select' | 'quiz' | 'result' | 'error'

export function QuizPage() {
  const [phase, setPhase] = useState<Phase>('select')
  const [grade, setGrade] = useState<Grade | ''>('')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('')
  const [quizId, setQuizId] = useState('')
  const [problems, setProblems] = useState<Problem[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [results, setResults] = useState<SubmitResult[]>([])
  const [totalEarned, setTotalEarned] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [loading, setLoading] = useState(false)

  async function generateQuiz(g: Grade | '', d: Difficulty | '') {
    if (!g || !d) return
    setLoading(true)
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: g, difficulty: d }),
      })
      if (!res.ok) throw new Error('generate failed')
      const data = await res.json()
      setQuizId(data.quizId)
      setProblems(data.problems)
      setAnswers(Array(data.problems.length).fill(''))
      setPhase('quiz')
    } catch {
      setPhase('error')
    } finally {
      setLoading(false)
    }
  }

  async function submitAnswers() {
    setLoading(true)
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, answers }),
      })
      if (!res.ok) throw new Error('submit failed')
      const data = await res.json()
      setResults(data.results)
      setTotalEarned(data.totalEarned)
      setTotalPoints(data.totalPoints)
      setPhase('result')
    } catch {
      setPhase('error')
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(g: Grade, d: Difficulty) {
    setGrade(g)
    setDifficulty(d)
    generateQuiz(g, d)
  }

  function handleRetry() {
    generateQuiz(grade, difficulty)
  }

  function handleReset() {
    setGrade('')
    setDifficulty('')
    setQuizId('')
    setProblems([])
    setAnswers([])
    setResults([])
    setPhase('select')
  }

  function handleNewQuiz() {
    setAnswers([])
    setResults([])
    generateQuiz(grade, difficulty)
  }

  if (phase === 'select' || phase === 'error') {
    return (
      <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
        <h1 className="text-2xl font-bold">학년·난이도별 문제 출제</h1>
        <GradeSelector
          onSubmit={handleSelect}
          loading={loading}
          initialGrade={grade}
          initialDifficulty={difficulty}
        />
        {phase === 'error' && (
          <div className="flex flex-col gap-3">
            <p className="text-destructive">출제에 실패했습니다. 다시 시도해 주세요.</p>
            <Button onClick={handleRetry} disabled={loading}>
              다시 시도
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (phase === 'quiz') {
    return (
      <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">문제 풀기</h1>
          <div className="flex gap-2">
            <Badge>{grade}</Badge>
            <Badge variant="secondary">{difficulty}</Badge>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {problems.map((problem, i) => (
            <ProblemCard
              key={i}
              problem={problem}
              answer={answers[i] ?? ''}
              onAnswerChange={(v) => {
                const next = [...answers]
                next[i] = v
                setAnswers(next)
              }}
              disabled={loading}
            />
          ))}
        </div>
        <div className="flex gap-3">
          <Button onClick={submitAnswers} disabled={loading}>
            제출
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            처음으로
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">결과</h1>
        <span className="text-lg font-semibold">{totalEarned} / {totalPoints}</span>
      </div>
      <div className="flex flex-col gap-4">
        {results.map((result, i) => (
          <ResultCard key={i} result={result} />
        ))}
      </div>
      <div className="flex gap-3">
        <Button onClick={handleNewQuiz} disabled={loading}>
          새 문제로 다시 풀기
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={loading}>
          처음으로
        </Button>
      </div>
    </div>
  )
}
