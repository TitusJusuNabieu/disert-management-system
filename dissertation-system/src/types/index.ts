import { MilestoneStatus } from '@prisma/client'

export type { MilestoneStatus }

export interface SafeUser {
  id: string
  name: string
  email: string
  role: string
  studentId?: string | null
  department?: string | null
  createdAt: Date
}

export interface FeedbackItem {
  id: string
  content: string
  createdAt: Date
  author: { id: string; name: string; role: string }
}

export interface MilestoneWithFeedback {
  id: string
  name: string
  description: string | null
  dueDate: Date | null
  submittedAt: Date | null
  status: MilestoneStatus
  order: number
  feedback: FeedbackItem[]
}

export interface ProjectWithRelations {
  id: string
  title: string
  abstract: string | null
  department: string
  academicYear: string
  student: SafeUser
  supervisor: SafeUser | null
  milestones: MilestoneWithFeedback[]
}
