import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SubmitResult } from '@/types/quiz'

interface ResultCardProps {
  result: SubmitResult
}

export function ResultCard({ result }: ResultCardProps) {
  const { subject, userAnswer, correctAnswer, isCorrect, explanation, earnedPoints, points } = result

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <span>{subject}</span>
            <span className="text-muted-foreground font-normal text-sm">{points}점</span>
          </span>
          <span className="flex items-center gap-2">
            <Badge variant={isCorrect ? 'default' : 'destructive'}>
              {isCorrect ? '정답' : '오답'}
            </Badge>
            <span className="text-sm font-semibold">
              {earnedPoints}/{points}
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">내 답안: </span>
          <span>{userAnswer === '' ? '(미응답)' : userAnswer}</span>
        </div>
        {!isCorrect && (
          <div>
            <span className="text-muted-foreground">정답: </span>
            <span className="font-medium">{correctAnswer}</span>
          </div>
        )}
        <div className="border-t pt-2">
          <p className="text-muted-foreground text-xs mb-1">해설</p>
          <p>{explanation}</p>
        </div>
      </CardContent>
    </Card>
  )
}
