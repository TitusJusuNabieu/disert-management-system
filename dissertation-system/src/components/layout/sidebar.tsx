'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, BookOpen, MessageSquare, Users, BarChart3,
  GraduationCap, LogOut, ChevronRight, UserCircle, FileText,
  Lightbulb, Menu, X,
} from 'lucide-react'
import { siteConfig } from '@/lib/config'

type Role = 'STUDENT' | 'SUPERVISOR' | 'ADMIN'

const navItems: Record<Role, { href: string; label: string; icon: React.ElementType }[]> = {
  STUDENT: [
    { href: '/student',            label: 'Dashboard',     icon: LayoutDashboard },
    { href: '/student/topics',     label: 'Project Topics', icon: Lightbulb },
    { href: '/student/milestones', label: 'Milestones',    icon: BookOpen },
    { href: '/student/feedback',   label: 'Feedback',      icon: MessageSquare },
  ],
  SUPERVISOR: [
    { href: '/supervisor',          label: 'Dashboard',    icon: LayoutDashboard },
    { href: '/supervisor/topics',   label: 'Topic Reviews', icon: Lightbulb },
    { href: '/supervisor/students', label: 'My Students',  icon: GraduationCap },
    { href: '/supervisor/feedback', label: 'Feedback',     icon: MessageSquare },
  ],
  ADMIN: [
    { href: '/admin',              label: 'Dashboard',     icon: LayoutDashboard },
    { href: '/admin/users',        label: 'Users',         icon: Users },
    { href: '/admin/topics',       label: 'Topic Reviews', icon: Lightbulb },
    { href: '/admin/dissertations', label: 'Projects',     icon: FileText },
    { href: '/admin/reports',      label: 'Reports',       icon: BarChart3 },
  ],
}

interface SidebarProps {
  role: string
  userName: string
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close drawer on navigation
  useEffect(() => { setOpen(false) }, [pathname])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const items = navItems[role as Role] ?? []
  const roleLabel = role === 'STUDENT' ? 'Student' : role === 'SUPERVISOR' ? 'Supervisor' : 'Administrator'
  const roleColor = role === 'STUDENT' ? 'bg-blue-600' : role === 'SUPERVISOR' ? 'bg-purple-600' : 'bg-emerald-600'

  // Roots that should only match exactly (not as prefix)
  const exactRoots = ['/student', '/supervisor', '/admin']

  function isActive(href: string) {
    if (exactRoots.includes(href)) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-200 p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">{siteConfig.appName}</p>
          <p className="truncate text-xs text-gray-500">{siteConfig.institution}</p>
        </div>
        {/* Mobile close button */}
        <button
          onClick={() => setOpen(false)}
          className="ml-auto shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* User info */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white', roleColor)}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-3 w-3 shrink-0" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom links */}
      <div className="border-t border-gray-200 p-3 space-y-0.5">
        <Link
          href="/profile"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            pathname === '/profile'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <UserCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">My Profile</span>
          {pathname === '/profile' && <ChevronRight className="h-3 w-3 shrink-0" />}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900">{siteConfig.appName}</span>
        </div>

        <Link href="/profile" className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white', roleColor)}>
          {userName.charAt(0).toUpperCase()}
        </Link>
      </header>

      {/* ── Backdrop (mobile only) ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ── */}
      {/* Desktop: static in flex flow. Mobile: absolute drawer sliding in from left. */}
      <aside
        className={cn(
          // Base
          'flex h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white',
          // Mobile: fixed drawer
          'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:transition-none',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {navContent}
      </aside>
    </>
  )
}
