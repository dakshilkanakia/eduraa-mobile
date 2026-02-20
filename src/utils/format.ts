/**
 * Eduraa Mobile — Formatting Utilities
 */

/** Format seconds to MM:SS */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/** Format a score as percentage */
export function scorePercent(score: number, max: number): number {
  if (!max) return 0
  return Math.round((score / max) * 100)
}

/** Get a grade label from percent */
export function gradeLabel(percent: number): string {
  if (percent >= 90) return 'A+'
  if (percent >= 80) return 'A'
  if (percent >= 70) return 'B'
  if (percent >= 60) return 'C'
  if (percent >= 50) return 'D'
  return 'F'
}

/** Format ISO date string to readable form */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/** Format question type to display label */
export function questionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    mcq: 'MCQ',
    short_answer: 'Short Answer',
    long_answer: 'Long Answer',
    fill_blank: 'Fill in the Blank',
    match_columns: 'Match Columns',
    true_false: 'True / False',
  }
  return map[type] || type
}
