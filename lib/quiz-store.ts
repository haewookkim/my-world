import type { QuizEntry } from '@/types/quiz'

const TTL_MS = 30 * 60 * 1000

const store = new Map<string, QuizEntry>()

export const quizStore = {
  set(id: string, entry: QuizEntry): void {
    store.set(id, entry)
  },

  get(id: string): QuizEntry | undefined {
    const entry = store.get(id)
    if (!entry) return undefined
    if (Date.now() - entry.createdAt > TTL_MS) {
      store.delete(id)
      return undefined
    }
    return entry
  },

  delete(id: string): void {
    store.delete(id)
  },
}
