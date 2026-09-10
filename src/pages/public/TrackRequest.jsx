import { useState } from 'react'
import { Search, Loader2, Clock, CheckCircle, XCircle, PackageCheck, Ban } from 'lucide-react'
import { trackRequest } from '../../hooks/useRequests'

const statusConfig = {
  pending:   { icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'Pending Review' },
  approved:  { icon: CheckCircle,  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',     label: 'Approved — Ready for Pickup' },
  denied:    { icon: XCircle,      color: 'text-red-600',    bg: 'bg-red-50 border-red-200',       label: 'Denied' },
  released:  { icon: PackageCheck, color: 'text-green-600',  bg: 'bg-green-50 border-green-200',   label: 'Released' },
  cancelled: { icon: Ban,          color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200',     label: 'Cancelled' },
}

export default function TrackRequest() {
  const [code, setCode] = useState('')
  const [lastName, setLastName] = useState('')
  const [result, setResult] = useState(undefined) // undefined=idle, null=not found
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await trackRequest(code, lastName)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const cfg = result ? statusConfig[result.status] : null

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Track Your Request</h1>
        <p className="text-sm text-gray-500 mt-1">Enter your reference code and the student's last name to check the status.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Reference Code *</label>
          <input required value={code} onChange={e => setCode(e.target.value.toUpperCase())}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. AB12CD34EF" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Student's Last Name *</label>
          <input required value={lastName} onChange={e => setLastName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="dela Cruz" />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Check Status
        </button>
      </form>

      {/* Result */}
      {result === null && (
        <div className="text-center text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-6">
          No request found. Please check your reference code and last name.
        </div>
      )}

      {result && cfg && (
        <div className={`rounded-2xl border p-6 ${cfg.bg}`}>
          <div className={`flex items-center gap-2 font-semibold mb-4 ${cfg.color}`}>
            <cfg.icon size={20} />
            {cfg.label}
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Reference Code" value={<span className="font-mono font-bold">{result.reference_code}</span>} />
            <Row label="Document" value={result.document_type} />
            <Row label="Requested by" value={result.requester_name} />
            <Row label="Submitted" value={new Date(result.created_at).toLocaleDateString('en-PH', { dateStyle: 'long' })} />
            {result.decided_at && (
              <Row label="Processed" value={new Date(result.decided_at).toLocaleDateString('en-PH', { dateStyle: 'long' })} />
            )}
            {result.release_note && <Row label="Note" value={result.release_note} />}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{value ?? '—'}</span>
    </div>
  )
}
