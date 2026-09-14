import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/api'
import { BookOpen, Users, FileText, ClipboardList, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const navItems = [
  { to: '/teacher',           label: 'Students',    icon: Users, end: true },
  { to: '/teacher/documents', label: 'Documents',   icon: FileText },
  { to: '/teacher/requests',  label: 'My Requests', icon: ClipboardList },
]

export default function TeacherLayout() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 bg-gray-900 text-white flex flex-col
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-700">
          <div className="bg-emerald-600 rounded-lg p-1.5">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">e-Records</p>
            <p className="text-xs text-gray-400">Teacher Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 truncate">{profile?.full_name}</p>
          <p className="text-xs text-emerald-400 capitalize mb-3">{profile?.role}</p>
          <button
            onClick={() => setConfirmLogout(true)}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center gap-3 lg:px-6 shadow-sm">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setOpen(o => !o)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <h2 className="text-sm font-semibold text-gray-700">Teacher Portal</h2>
        </header>

        <main className="page-enter flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      {confirmLogout && (
        <ConfirmDialog
          title="Sign out?"
          message="You will need to sign in again to access the teacher portal."
          confirmLabel="Sign out"
          onClose={() => setConfirmLogout(false)}
          onConfirm={signOut}
          danger
        />
      )}
    </div>
  )
}
