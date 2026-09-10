import { useState } from 'react'
import { Plus, Loader2, UserCheck, UserX } from 'lucide-react'
import { useTeachers, useToggleTeacherActive } from '../../hooks/useTeachers'
import { PageHeader, Badge } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

function CreateTeacherForm({ onClose }) {
  const toast = useToast()
  const qc = useQueryClient()
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Create via Supabase Auth Admin API
      const { error } = await supabase.functions.invoke('create-teacher', {
        body: form,
      })
      if (error) throw error
      toast(`Teacher account created for ${form.full_name}.`, 'success')
      qc.invalidateQueries({ queryKey: ['teachers'] })
      onClose()
    } catch (err) {
      // Fallback: direct signUp (works if email confirmations are off)
      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.full_name, role: 'teacher' } },
        })
        if (signUpError) throw signUpError
        if (data.user) {
          toast(`Teacher account created for ${form.full_name}.`, 'success')
          qc.invalidateQueries({ queryKey: ['teachers'] })
          onClose()
        }
      } catch (fallbackErr) {
        setError(fallbackErr.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
        <input required value={form.full_name} onChange={e => set('full_name', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Maria Santos" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
        <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="teacher@school.edu.ph" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Temporary Password *</label>
        <input required type="password" minLength={8} value={form.password} onChange={e => set('password', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Min. 8 characters" />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      <p className="text-xs text-gray-400">The teacher will use these credentials to log in. Ask them to change their password after first login.</p>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
          {loading && <Loader2 size={14} className="animate-spin" />}
          Create Account
        </button>
      </div>
    </form>
  )
}

export default function AdminTeachers() {
  const { data: teachers = [], isLoading } = useTeachers()
  const toggle = useToggleTeacherActive()
  const toast = useToast()
  const [modal, setModal] = useState(false)

  async function handleToggle(teacher) {
    try {
      await toggle.mutateAsync({ id: teacher.id, is_active: !teacher.is_active })
      toast(`${teacher.full_name} ${!teacher.is_active ? 'activated' : 'deactivated'}.`, 'success')
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Teachers"
        subtitle="Manage teacher portal accounts"
        action={
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} /> Add Teacher
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : teachers.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No teacher accounts yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teachers.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.full_name}</td>
                  <td className="px-4 py-3">
                    <Badge label={t.is_active ? 'enrolled' : 'dropped'} />
                    <span className="ml-2 text-xs text-gray-400">{t.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(t.created_at).toLocaleDateString('en-PH')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(t)}
                      disabled={toggle.isPending}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50
                        ${t.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                    >
                      {t.is_active
                        ? <><UserX size={14} /> Deactivate</>
                        : <><UserCheck size={14} /> Activate</>
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title="Add Teacher Account" onClose={() => setModal(false)} size="sm">
          <CreateTeacherForm onClose={() => setModal(false)} />
        </Modal>
      )}
    </div>
  )
}
