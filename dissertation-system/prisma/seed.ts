import { PrismaClient, Role, MilestoneStatus, TopicStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const hash = (p: string) => bcrypt.hash(p, 10)

const DEFAULT_MILESTONES = [
  { name: 'Proposal Submission',   order: 1, description: 'Submit your project proposal for approval.' },
  { name: 'Literature Review',     order: 2, description: 'Submit your literature review chapter.' },
  { name: 'Methodology',           order: 3, description: 'Submit your research methodology chapter.' },
  { name: 'Data Collection',       order: 4, description: 'Submit evidence of data collection.' },
  { name: 'Analysis & Discussion', order: 5, description: 'Submit your analysis and discussion chapters.' },
  { name: 'Final Write-up',        order: 6, description: 'Submit the complete final write-up for review.' },
  { name: 'Defense Preparation',   order: 7, description: 'Confirm readiness for defense presentation.' },
]

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@njala.edu.sl' },
    update: {},
    create: { name: 'Dept. Admin', email: 'admin@njala.edu.sl', password: await hash('Admin@123'), role: Role.ADMIN, department: 'Computer Science' },
  })

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@njala.edu.sl' },
    update: {},
    create: { name: 'Dr. Jane Smith', email: 'supervisor@njala.edu.sl', password: await hash('Super@123'), role: Role.SUPERVISOR, department: 'Computer Science' },
  })

  const student = await prisma.user.upsert({
    where: { email: 'student@njala.edu.sl' },
    update: {},
    create: { name: 'Francis Kopoi', email: 'student@njala.edu.sl', password: await hash('Student@123'), role: Role.STUDENT, studentId: 'NJU/CS/2022/001', department: 'Computer Science' },
  })

  // Seed topic proposals
  const topic1 = await prisma.topic.create({
    data: {
      title: 'Design and Implementation of a Cross-Platform Project Record System',
      description: 'A web and mobile system to manage final year project milestones at Njala University.',
      rationale: 'Current process relies on paper and email which causes data fragmentation and delays.',
      status: TopicStatus.APPROVED,
      studentId: student.id,
      reviewedById: supervisor.id,
      reviewedAt: new Date(),
      reviewNote: 'Strong rationale and clear scope. Approved.',
    },
  })

  await prisma.topic.create({
    data: {
      title: 'AI-Powered Student Attendance Management System',
      description: 'Using facial recognition to automate attendance tracking in lecture halls.',
      rationale: 'Manual attendance is prone to errors and proxy attendance fraud.',
      status: TopicStatus.REJECTED,
      studentId: student.id,
      reviewedById: supervisor.id,
      reviewedAt: new Date(),
      reviewNote: 'Interesting but out of scope for the department\'s current infrastructure.',
    },
  })

  await prisma.topic.create({
    data: {
      title: 'Blockchain-Based Academic Certificate Verification',
      description: 'A decentralized system for issuing and verifying academic certificates.',
      rationale: 'Certificate forgery is a growing concern in West African institutions.',
      status: TopicStatus.PENDING,
      studentId: student.id,
    },
  })

  // Create project from approved topic
  const existing = await prisma.project.findUnique({ where: { studentId: student.id } })
  if (!existing) {
    await prisma.project.create({
      data: {
        title: topic1.title,
        abstract: 'A comprehensive system to streamline project management at Njala University.',
        department: 'Computer Science',
        academicYear: '2025/2026',
        studentId: student.id,
        supervisorId: supervisor.id,
        topicId: topic1.id,
        milestones: {
          create: DEFAULT_MILESTONES.map((m, i) => ({
            ...m,
            status: i === 0 ? MilestoneStatus.APPROVED : i === 1 ? MilestoneStatus.SUBMITTED : MilestoneStatus.PENDING,
            dueDate: new Date(Date.now() + (i + 1) * 14 * 24 * 60 * 60 * 1000),
          })),
        },
      },
    })
  }

  console.log('Seed complete.')
  console.log('Admin:      admin@njala.edu.sl / Admin@123')
  console.log('Supervisor: supervisor@njala.edu.sl / Super@123')
  console.log('Student:    student@njala.edu.sl / Student@123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
