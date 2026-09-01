import { lessons } from '../content/lessons'

export type NoteCategory = 'Strength' | 'Needs practice' | 'Question' | 'Celebration' | 'Follow-up'

export interface LearningNote {
  id: string
  category: NoteCategory
  subject: string
  note: string
  createdAt: number
  followUpDate: string
  completed: boolean
}

const KEY = 'kvs_learning_notes'
const MAX_NOTES = 100

function available() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function sanitise(value: unknown): LearningNote[] {
  const subjects = new Set(lessons.map((lesson) => lesson.subject))
  const categories: NoteCategory[] = ['Strength', 'Needs practice', 'Question', 'Celebration', 'Follow-up']
  if (!Array.isArray(value)) return []
  return value
    .filter(isRecord)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id.slice(0, 100) : '',
      category: categories.includes(item.category as NoteCategory) ? item.category as NoteCategory : 'Follow-up',
      subject: typeof item.subject === 'string' && (item.subject === 'General' || subjects.has(item.subject)) ? item.subject : 'General',
      note: typeof item.note === 'string' ? item.note.trim().slice(0, 800) : '',
      createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
      followUpDate: typeof item.followUpDate === 'string' ? item.followUpDate.slice(0, 20) : '',
      completed: item.completed === true,
    }))
    .filter((item) => item.id && item.note)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_NOTES)
}

function read() {
  if (!available()) return []
  try {
    return sanitise(JSON.parse(window.localStorage.getItem(KEY) ?? '[]'))
  } catch {
    return []
  }
}

function write(notes: LearningNote[]) {
  if (!available()) return false
  try {
    window.localStorage.setItem(KEY, JSON.stringify(notes.slice(0, MAX_NOTES)))
    return true
  } catch {
    return false
  }
}

export function getLearningNotes() {
  return read()
}

export function addLearningNote(input: Omit<LearningNote, 'id' | 'createdAt' | 'completed'>) {
  const note: LearningNote = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    completed: false,
    note: input.note.trim().slice(0, 800),
  }
  if (!note.note) return false
  return write([note, ...read()])
}

export function setLearningNoteCompleted(id: string, completed: boolean) {
  return write(read().map((note) => note.id === id ? { ...note, completed } : note))
}

export function deleteLearningNote(id: string) {
  return write(read().filter((note) => note.id !== id))
}

export function clearLearningNotes() {
  if (!available()) return false
  window.localStorage.removeItem(KEY)
  return true
}

export function getLearningNotesStorageKey() {
  return KEY
}
