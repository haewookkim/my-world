'use client'

import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import type { Grade, Difficulty } from '@/types/quiz'

const GRADES: Grade[] = ['중1', '중2', '중3', '고1', '고2', '고3']

const DIFFICULTY_OPTIONS: { value: Difficulty; emoji: string; className: string }[] = [
  {
    value: '하',
    emoji: '🟢',
    className:
      'data-[state=on]:bg-emerald-500 data-[state=on]:text-white data-[state=on]:border-emerald-500',
  },
  {
    value: '중',
    emoji: '🟡',
    className:
      'data-[state=on]:bg-amber-500 data-[state=on]:text-white data-[state=on]:border-amber-500',
  },
  {
    value: '상',
    emoji: '🔴',
    className:
      'data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground data-[state=on]:border-destructive',
  },
]

interface GradeSelectorProps {
  onSubmit: (grade: Grade, difficulty: Difficulty) => void
  loading?: boolean
  submitDisabled?: boolean
  initialGrade?: Grade | ''
  initialDifficulty?: Difficulty | ''
}

export function GradeSelector({
  onSubmit,
  loading,
  submitDisabled,
  initialGrade = '',
  initialDifficulty = '',
}: GradeSelectorProps) {
  const [grade, setGrade] = useState<Grade | ''>(initialGrade)
  const [difficulty, setDifficulty] = useState<Difficulty | ''>(initialDifficulty)

  return (
    <Card>
      <CardContent className="pt-5 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium">
            <span>📚</span>
            <span>학년</span>
          </div>
          <ToggleGroup
            type="single"
            value={grade}
            onValueChange={(v) => setGrade(v as Grade)}
            aria-label="학년"
            spacing={2}
            variant="outline"
          >
            {GRADES.map((g) => (
              <ToggleGroupItem
                key={g}
                value={g}
                disabled={loading}
                className="data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground data-[state=on]:border-destructive"
              >
                {g}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-4">
          <div className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium">
            <span>⚡</span>
            <span>난이도</span>
          </div>
          <ToggleGroup
            type="single"
            value={difficulty}
            onValueChange={(v) => setDifficulty(v as Difficulty)}
            aria-label="난이도"
            spacing={2}
            variant="outline"
          >
            {DIFFICULTY_OPTIONS.map(({ value, emoji, className }) => (
              <ToggleGroupItem
                key={value}
                value={value}
                disabled={loading}
                className={className}
                aria-label={value}
              >
                {emoji} {value}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={() => {
            if (grade && difficulty) onSubmit(grade, difficulty)
          }}
          disabled={!grade || !difficulty || loading || submitDisabled}
        >
          출제
        </Button>
      </CardFooter>
    </Card>
  )
}
