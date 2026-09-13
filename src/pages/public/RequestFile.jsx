import { useState } from 'react'
import { CheckCircle, Loader2, Copy, FilePlus2, ShieldCheck } from 'lucide-react'
import { useSubmitPublicRequest } from '../../hooks/useRequests'
import { useDocumentTypes } from '../../hooks/useDocuments'
import AlertMessage from '../../components/ui/AlertMessage'

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
    <div className="page-enter max-w-lg mx-auto px-4 py-16 text-center">
      <div className="interactive-card bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
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
    <div className="page-enter max-w-3xl mx-auto px-4 py-10 lg:py-14">
      <div className="mb-8 flex items-start gap-4">
        <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><FilePlus2 size={23} /></div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 mb-1">Secure intake</p>
          <h1 className="text-2xl font-bold text-slate-900">Request a Document</h1>
          <p className="text-sm text-slate-500 mt-1">Fill out the form below. You'll receive a reference code to track your request.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="interactive-card bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Requester info */}
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Your Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
              <input required value={form.requester_name} onChange={e => set('requester_name', e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                placeholder="Juan dela Cruz" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Relationship to Student *</label>
              <select required value={form.relationship} onChange={e => set('relationship', e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                <option value="">Select…</option>
                {['Parent', 'Guardian', 'Sibling', 'Grandparent', 'Self', 'Other'].map(r =>
                  <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact Number *</label>
              <input required value={form.contact} onChange={e => set('contact', e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                placeholder="09XXXXXXXXX" />
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Student info */}
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Student Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Student LRN *</label>
              <input required value={form.student_lrn} onChange={e => set('student_lrn', e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                placeholder="12-digit LRN" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Student Last Name *</label>
              <input required value={form.student_last_name} onChange={e => set('student_last_name', e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                placeholder="dela Cruz" />
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Document */}
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Document Requested</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Document Type *</label>
              <select required value={form.document_type_id} onChange={e => set('document_type_id', e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                <option value="">Select…</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Purpose *</label>
              <select required value={form.purpose} onChange={e => set('purpose', e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                <option value="">Select…</option>
                {['Transfer to another school', 'College application', 'Scholarship', 'Employment', 'Personal record', 'Other'].map(p =>
                  <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && <AlertMessage>{error}</AlertMessage>}

        <button type="submit" disabled={submit.isPending}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5">
          {submit.isPending && <Loader2 size={16} className="animate-spin" />}
          Submit Request
        </button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400"><ShieldCheck size={14} className="text-emerald-500" /> Your request is handled securely.</p>
      </form>
    </div>
  )
}
