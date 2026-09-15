import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useRequests } from '../../hooks/useRequests'
import { PageHeader, Badge } from '../../components/ui/index'
import RequestDecideModal from '../../components/RequestDecideModal'
import SortControl, { sortRecords } from '../../components/SortControl'

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'released', label: 'Released' },
  { key: 'denied', label: 'Denied' },
  { key: '', label: 'All' },
]

const nextActions = {
  pending:  ['approved', 'denied'],
  approved: ['released', 'denied'],
  released: [],
  denied:   [],
  cancelled:[],
}

const actionLabel = { approved: 'Approve', denied: 'Deny', released: 'Release' }
const actionColor = {
  approved: 'text-blue-600 hover:text-blue-800',
  denied:   'text-red-600 hover:text-red-800',
  released: 'text-green-600 hover:text-green-800',
}

export default function AdminRequests() {
  const [tab, setTab] = useState('pending')
  const [decide, setDecide] = useState(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('created_at:desc')

  const { data: allRequests = [], isLoading } = useRequests(tab ? { status: tab } : {})

  const requests = search.trim()
    ? allRequests.filter(r =>
        r.reference_code.includes(search.toUpperCase()) ||
        r.requester_name.toLowerCase().includes(search.toLowerCase()) ||
        r.student_last_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.students?.last_name?.toLowerCase().includes(search.toLowerCase())
      )
    : allRequests
  const sortedRequests = useMemo(() => sortRecords(requests, ...sort.split(':')), [requests, sort])

  return (
    <div>
      <PageHeader title="Requests Queue" subtitle="Realtime — updates automatically" />

      {/* Search + Tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search ref code, name…"
            className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
        </div>
      </div>
      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors
                ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2">
          <span className="hidden text-xs font-medium text-gray-500 sm:inline">Sort:</span>
          <SortControl value={sort} onChange={setSort} options={[
            { value: 'created_at', label: 'By date' },
            { value: 'requester_name', label: 'By requester' },
            { value: 'status', label: 'By status' },
            { value: 'source', label: 'By source' },
          ]} />
        </div>
      </div>

      <div className="table-scroll bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No requests in this category.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Ref Code', 'Requester', 'Student', 'Document', 'Source', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedRequests.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600">{r.reference_code}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.requester_name}</p>
                    {r.relationship && <p className="text-xs text-gray-400">{r.relationship}</p>}
                    {r.contact && <p className="text-xs text-gray-400">{r.contact}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {r.students
                      ? <><p className="font-medium">{r.students.last_name}, {r.students.first_name}</p><p className="text-xs text-gray-400 font-mono">{r.students.lrn}</p></>
                      : <><p className="font-medium">{r.student_last_name}</p><p className="text-xs text-gray-400 font-mono">{r.student_lrn}</p></>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.document_types?.name ?? '—'}</td>
                  <td className="px-4 py-3"><Badge label={r.source} /></td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString('en-PH')}
                  </td>
                  <td className="px-4 py-3"><Badge label={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      {(nextActions[r.status] ?? []).map(action => (
                        <button key={action}
                          onClick={() => setDecide({ request: r, action })}
                          className={`text-xs font-medium transition-colors ${actionColor[action]}`}>
                          {actionLabel[action]}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {decide && (
        <RequestDecideModal
          request={decide.request}
          action={decide.action}
          onClose={() => setDecide(null)}
        />
      )}
    </div>
  )
}
