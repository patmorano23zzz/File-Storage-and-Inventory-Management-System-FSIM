import { useState } from 'react'
import { CheckCircle, Loader2, Copy } from 'lucide-react'
import { useSubmitPublicRequest } from '../../hooks/useRequests'
import { useDocumentTypes } from '../../hooks/useDocuments'

export default function RequestFile() {
  const { data: types = [] } = useDocumentTypes()
  const submit = useSubmitPublicRequest()

  const [form, setForm] = useState({
    requester_name: '', relationship: '', contact: '',
    student_lrn: '', student_last_name: '', document_type_id: '', purpose: '',
  })
  const [refCode, setRefCode] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const result = await submit.mutateAsync(form)
      setRefCode(result.reference_code)
    } catch (err) {
      setError(err.message)
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(refCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (refCode) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
        <p className="text-sm text-gray-500 mb-6">
          Your request has been received. Please save your reference code — you'll need it to track your request.
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-4">
          <p className="text-xs text-gray-400 mb-1">Reference Code</p>
          <p className="text-3xl font-mono font-bold text-blue-600 tracking-widest">{refCode}</p>
        </div>
        <button onClick={copyCode}
          className="flex items-center gap-2 mx-auto text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <Copy size={14} /> {copied ? 'Copied!' : 'Copy code'}
        </button>
        <p className="text-xs text-gray-400 mt-6">
          Present a valid ID upon document release. Processing time is 3–5 working days.
        </p>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Request a Document</h1>
        <p className="text-sm text-gray-500 mt-1">Fill out the form below. You'll receive a reference code to track your request.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        {/* Requester info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
              <input required value={form.requester_name} onChange={e => set('requester_name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Juan dela Cruz" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Relationship to Student *</label>
              <select required value={form.relationship} onChange={e => set('relationship', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select…</option>
                {['Parent', 'Guardian', 'Sibling', 'Grandparent', 'Self', 'Other'].map(r =>
                  <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact Number *</label>
              <input required value={form.contact} onChange={e => set('contact', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="09XXXXXXXXX" />
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Student info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Student Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Student LRN *</label>
              <input required value={form.student_lrn} onChange={e => set('student_lrn', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12-digit LRN" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Student Last Name *</label>
              <input required value={form.student_last_name} onChange={e => set('student_last_name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="dela Cruz" />
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Document */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Document Requested</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Document Type *</label>
              <select required value={form.document_type_id} onChange={e => set('document_type_id', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select…</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Purpose *</label>
              <select required value={form.purpose} onChange={e => set('purpose', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select…</option>
                {['Transfer to another school', 'College application', 'Scholarship', 'Employment', 'Personal record', 'Other'].map(p =>
                  <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <button type="submit" disabled={submit.isPending}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors">
          {submit.isPending && <Loader2 size={16} className="animate-spin" />}
          Submit Request
        </button>
      </form>
    </div>
  )
}
