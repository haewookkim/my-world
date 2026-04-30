'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Problem } from '@/types/quiz'

interface ProblemCardProps {
  problem: Problem
  answer: string
  onAnswerChange: (value: string) => void
  disabled?: boolean
}

export function ProblemCard({ problem, answer, onAnswerChange, disabled }: ProblemCardProps) {
  const { subject, type, prompt, points, choices } = problem

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{subject}</span>
          <span className="text-muted-foreground font-normal text-sm">
            {points}점 · {type}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm">{prompt}</p>
        {type === '서술형' && (
          <Textarea
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={disabled}
            placeholder="답안을 입력하세요"
          />
        )}
        {type === '단답형' && (
          <Input
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={disabled}
            placeholder="답안을 입력하세요"
          />
        )}
        {type === '객관식' && choices && (
          <ToggleGroup
            type="single"
            value={answer}
            onValueChange={(v) => onAnswerChange(v)}
            aria-label="선택지"
            orientation="vertical"
            className="w-full"
          >
            {choices.map((choice) => (
              <ToggleGroupItem key={choice} value={choice} disabled={disabled} className="justify-start text-left whitespace-normal h-auto py-2">
                {choice}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </CardContent>
    </Card>
  )
}
