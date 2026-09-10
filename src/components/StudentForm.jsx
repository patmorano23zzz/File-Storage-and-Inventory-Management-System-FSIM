import { useState } from 'react'
import { Loader2 } from 'lucide-react'

const GRADE_LEVELS = ['Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']
const STATUSES = ['enrolled', 'transferred', 'graduated', 'dropped']

const empty = {
  lrn: '', last_name: '', first_name: '', middle_name: '',
  birth_date: '', sex: '', grade_level: '', section: '',
  guardian_name: '', status: 'enrolled',
}

export default function StudentForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({ ...empty, ...initial })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const field = (label, key, type = 'text', required = false) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && ' *'}</label>
      <input
        type={type}
        required={required}
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('LRN', 'lrn', 'text', true)}
        {field('Birth Date', 'birth_date', 'date')}
        {field('Last Name', 'last_name', 'text', true)}
        {field('First Name', 'first_name', 'text', true)}
        {field('Middle Name', 'middle_name')}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Sex</label>
          <select value={form.sex} onChange={e => set('sex', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">—</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Grade Level *</label>
          <select required value={form.grade_level} onChange={e => set('grade_level', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select…</option>
            {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        {field('Section', 'section')}
        {field('Guardian Name', 'guardian_name')}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
          {loading && <Loader2 size={14} className="animate-spin" />}
          Save
        </button>
      </div>
    </form>
  )
}
