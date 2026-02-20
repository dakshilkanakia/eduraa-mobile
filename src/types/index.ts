/**
 * Eduraa Mobile — TypeScript Types
 * Ported from frontend/src/types/index.ts + backend schemas
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

export type Role =
  | 'developer'
  | 'school_super_admin'
  | 'branch_admin'
  | 'student'
  | 'b2c_student'
  | 'teacher'
  | 'principal'
  | 'admin'

export interface AccountMinimal {
  id: string
  display_name: string
  identifier: string
  role: Role
  class_teacher_opt_in?: boolean | null
  class_teacher_standard?: string | null
  class_teacher_division?: string | null
  standards_taught?: string[] | null
  divisions_taught?: string[] | null
  subjects_taught?: string[] | null
}

export interface AuthToken {
  access_token: string
  token_type: string
  user: AccountMinimal
}

export interface Account extends AccountMinimal {
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── B2C Student Profile ──────────────────────────────────────────────────────

export type EducationLevel =
  | 'school'
  | 'competitive_exams'
  | 'science_high_school'
  | 'commerce_high_school'
  | 'post_graduation'

export interface B2CProfileRead {
  id: string
  first_name: string
  last_name: string
  email: string
  education_level: EducationLevel
  school_name?: string
  school_board?: string
  school_standard?: string
  science_standard?: string
  science_exam?: string[]
  state_cet_states?: string[]
  subjects?: string[]
  commerce_track?: string
  post_grad_track?: string
  mba_exam?: string
  abroad_exam?: string
  board?: string
  standard?: string
  division?: string
  competitive_exam_selected: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface B2CRegisterRequest {
  first_name: string
  last_name: string
  email: string
  password: string
  education_level: EducationLevel
  school_name?: string
  board?: string
  standard?: string
  division?: string
  science_standard?: string
  science_exam?: string[]
  state_cet_states?: string[]
  subjects?: string[]
  commerce_track?: string
  post_grad_track?: string
  mba_exam?: string
  abroad_exam?: string
}

// ─── Papers ───────────────────────────────────────────────────────────────────

export type QuestionType =
  | 'mcq'
  | 'short_answer'
  | 'long_answer'
  | 'fill_blank'
  | 'match_columns'
  | 'true_false'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type PaperStatus = 'draft' | 'published' | 'archived'

export interface MCQOption {
  id: string
  text: string
}

export interface MatchColumnsOptions {
  left: string[]
  right: string[]
}

export interface RubricItem {
  criterion: string
  marks: number
}

export interface QuestionInPaper {
  id: string
  question_number: number
  section?: string
  question_text: string
  question_type: QuestionType
  difficulty: Difficulty
  marks: number
  options?: MCQOption[] | MatchColumnsOptions
  answer_key?: string | Record<string, string>
  marking_rubric?: RubricItem[]
  topic_id?: string
  topic_name?: string
  subject_name?: string
}

export interface Paper {
  id: string
  school_id: string
  created_by: string
  subject_id?: string
  title: string
  subtitle?: string
  semester?: string
  course?: string
  category?: string
  standard?: string
  division?: string
  total_marks: number
  duration_minutes?: number
  instructions?: string
  status: PaperStatus
  published_at?: string
  generation_config?: Record<string, unknown>
  created_at: string
  questions: QuestionInPaper[]
}

export interface PaperListItem {
  id: string
  title: string
  subject_id?: string
  subject_name?: string
  total_marks: number
  duration_minutes?: number
  status: PaperStatus
  created_at: string
  question_count?: number
}

export interface PaperGenerateRequest {
  subject_id: string
  chapter_ids: string[]
  difficulty: Difficulty
  title_line_1: string
  title_line_2?: string
  semester?: string
  course?: string
  category?: string
  standard?: string
  division?: string
  topic_ids?: string[]
  chapter_titles?: string[]
  note_ids?: string[]
  mcq_count: number
  short_answer_count: number
  long_answer_count: number
  fill_blank_count: number
  match_columns_count: number
  true_false_count: number
  marks_per_mcq?: number
  marks_per_short?: number
  marks_per_long?: number
  marks_per_fill_blank?: number
  marks_per_match_columns?: number
  marks_per_true_false?: number
  additional_instructions?: string
  timer_value?: number
  timer_unit?: string
}

// ─── Submission ───────────────────────────────────────────────────────────────

export interface AnswerEntry {
  question_id: string
  response: string
}

export interface PaperSubmissionCreate {
  answers: AnswerEntry[]
  exam_id?: string
  misconduct_report?: Record<string, unknown>
  mode?: string
  time_taken_seconds?: number
  settings?: Record<string, unknown>
}

export interface QuestionResult {
  question_id: string
  score?: number
  max_score?: number
  feedback?: string
  learning_support?: string
}

export interface PaperSubmissionRead {
  id: string
  paper_id: string
  student_id?: string
  b2c_student_id?: string
  exam_id?: string
  answers: AnswerEntry[]
  total_score?: number
  max_score?: number
  mode?: string
  time_taken_seconds?: number
  settings?: Record<string, unknown>
  feedback?: string
  results: QuestionResult[]
  results_visible_to_student: boolean
  misconduct_report?: Record<string, unknown>
  misconduct_score?: number
  created_at: string
}

// ─── Exams ────────────────────────────────────────────────────────────────────

export interface Exam {
  id: string
  name: string
  teacher_id: string
  subject_id?: string
  standard?: string
  division?: string
  semester?: string
  category?: string
  exam_date?: string
  duration_minutes?: number
  auto_grade_enabled: boolean
  results_published: boolean
  teacher_name?: string
  paper_ids?: string[]
  created_at: string
  updated_at: string
}

export interface StudentExamPaper {
  id: string
  title: string
  total_marks: number
  status: PaperStatus
  created_at: string
}

export interface StudentExamRead extends Exam {
  teacher_name: string
  subject_name?: string
  papers: StudentExamPaper[]
}

// ─── Checked Papers ───────────────────────────────────────────────────────────

export type CheckedPaperStatus =
  | 'uploaded'
  | 'processing'
  | 'completed'
  | 'needs_review'

export interface CheckedPaper {
  id: string
  student_id: string
  teacher_id: string
  exam_id: string
  subject_id?: string
  scanned_pdf_url: string
  annotated_pdf_url?: string
  ocr_text: string
  identifier_text: string
  status: CheckedPaperStatus
  grading_results?: Record<string, unknown>[]
  total_score?: number
  max_score?: number
  grading_feedback?: string
  needs_review: boolean
  grading_confidence?: number
  is_teacher_override: boolean
  teacher_reviewed_at?: string
  manual_review_requested: boolean
  created_at: string
}

// ─── Subjects & Chapters ──────────────────────────────────────────────────────

export interface Subject {
  id: string
  name: string
  code?: string
  school_id?: string
  created_at: string
}

export interface Chapter {
  id: string
  title: string
  subject_id: string
  document_id?: string
  order?: number
}

export interface Topic {
  id: string
  title: string
  chapter_id: string
  subject_id: string
}

export interface PaperOptions {
  subjects: Subject[]
  chapters: Record<string, Chapter[]>
  topics: Record<string, Topic[]>
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface StudentDashboardLab {
  total_papers: number
  total_submissions: number
  average_score: number
  recent_submissions: PaperSubmissionRead[]
  subject_performance: Record<string, number>
  improvement_areas?: string[]
  ai_coach_summary?: string
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

// ─── API Errors ───────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string | { msg: string; type: string }[]
  status_code?: number
}
