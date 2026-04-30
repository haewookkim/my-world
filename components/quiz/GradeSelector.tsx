'use client'

import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup } from '@/components/ui/field'
import type { Grade, Difficulty } from '@/types/quiz'

const GRADES: Grade[] = ['중1', '중2', '중3', '고1', '고2', '고3']
const DIFFICULTIES: Difficulty[] = ['상', '중', '하']

interface GradeSelectorProps {
  onSubmit: (grade: Grade, difficulty: Difficulty) => void
  loading?: boolean
  initialGrade?: Grade | ''
  initialDifficulty?: Difficulty | ''
}

export function GradeSelector({
  onSubmit,
  loading,
  initialGrade = '',
  initialDifficulty = '',
}: GradeSelectorProps) {
  const [grade, setGrade] = useState<Grade | ''>(initialGrade)
  const [difficulty, setDifficulty] = useState<Difficulty | ''>(initialDifficulty)

  return (
    <FieldGroup>
      <Field>
        <ToggleGroup
          type="single"
          value={grade}
          onValueChange={(v) => setGrade(v as Grade)}
          aria-label="학년"
          spacing={2}
        >
          {GRADES.map((g) => (
            <ToggleGroupItem key={g} value={g} disabled={loading}>
              {g}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
      <Field>
        <ToggleGroup
          type="single"
          value={difficulty}
          onValueChange={(v) => setDifficulty(v as Difficulty)}
          aria-label="난이도"
          spacing={2}
        >
          {DIFFICULTIES.map((d) => (
            <ToggleGroupItem key={d} value={d} disabled={loading}>
              {d}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
      <Button
        onClick={() => {
          if (grade && difficulty) onSubmit(grade, difficulty)
        }}
        disabled={!grade || !difficulty || loading}
      >
        출제
      </Button>
    </FieldGroup>
  )
}
