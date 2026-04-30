export type Grade = '중1' | '중2' | '중3' | '고1' | '고2' | '고3'
export type Difficulty = '상' | '중' | '하'
export type Subject = '국어' | '수학' | '영어'
export type ProblemType = '서술형' | '단답형' | '객관식'

export interface Problem {
  subject: Subject
  type: ProblemType
  prompt: string
  points: number
  choices?: string[]
}

export interface QuizEntry {
  grade: Grade
  difficulty: Difficulty
  problems: Problem[]
  answers: string[]
  explanations: string[]
  createdAt: number
}

export interface SubmitResult {
  subject: Subject
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation: string
  earnedPoints: number
  points: number
}
