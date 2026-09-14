import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { ArrowLeft, BookOpen, Loader2, ShieldCheck } from 'lucide-react'
import PasswordInput from '../../components/ui/PasswordInput'
import AlertMessage from '../../components/ui/AlertMessage'

export default function Login() {
  const navigate = useNavigate()
  const { setUser, setProfile } = useAuth()
  const [staffId, setStaffId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const normalizedStaffId = staffId.trim().toUpperCase()
    const { data: loginEmail, error: lookupError } = await supabase
      .rpc('get_login_email', { p_staff_id: normalizedStaffId })

    if (lookupError || !loginEmail) {
      setError('Invalid staff ID or password.')
      setLoading(false)
      return
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    const { data: profileResult, error: profileError } = await supabase
      .rpc('get_my_profile')
    const profile = Array.isArray(profileResult) ? profileResult[0] : profileResult

    if (profileError || !profile) {
      const detail = profileError?.message ? ` (${profileError.message})` : ''
      setError(`Could not load your staff profile${detail}`)
      setLoading(false)
      return
    }

    // Push into context so protected routes see it immediately
    setUser(data.user)
    setProfile(profile)

    navigate(profile.role === 'admin' ? '/admin' : '/teacher', { replace: true })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-600/25 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl animate-pulse [animation-delay:1.5s]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(148,163,184,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.12)_1px,transparent_1px)] [background-size:36px_36px]" />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/50 bg-white/95 p-6 shadow-2xl shadow-blue-950/30 backdrop-blur-xl sm:p-9">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
        <button
          type="button"
          onClick={() => navigate('/')}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-8"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" /> Back to home
        </button>
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-2xl bg-blue-500/30 blur-lg animate-pulse" />
            <div className="relative rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3.5 text-white shadow-lg shadow-blue-500/30">
            <BookOpen size={28} />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">e-Records</h1>
          <p className="mt-1 text-center text-sm text-slate-500">School File Storage & Inventory System</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <ShieldCheck size={13} /> Secure staff access
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Staff ID number</label>
            <input
              type="text"
              required
              value={staffId}
              onChange={e => setStaffId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              placeholder="Enter your staff ID"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
            <PasswordInput
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <AlertMessage>{error}</AlertMessage>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-7 text-center text-xs text-slate-400">
          For account issues, contact the school registrar.
        </p>
      </div>
    </div>
  )
}
