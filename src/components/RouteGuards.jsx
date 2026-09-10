import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function NoProfile() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <p className="text-gray-700 font-medium mb-2">Account setup incomplete</p>
        <p className="text-sm text-gray-500 mb-4">
          Your account has no profile record. Contact the school registrar.
        </p>
        <button
          onClick={() => supabase.auth.signOut().then(() => window.location.replace('/login'))}
          className="text-sm text-blue-600 hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

export function RequireAuth({ role }) {
  const { ready, user, profile } = useAuth()
  if (!ready) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <NoProfile />
  if (role && profile.role !== role) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/teacher'} replace />
  }
  return <Outlet />
}

// No longer used as a wrapper — kept for safety but login route is unwrapped
export function RequireGuest() {
  return <Outlet />
}
