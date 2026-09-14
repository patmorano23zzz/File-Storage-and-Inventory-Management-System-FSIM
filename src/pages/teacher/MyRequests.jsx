import { useMyRequests } from '../../hooks/useRequests'
import { PageHeader, Badge } from '../../components/ui/index'

export default function TeacherMyRequests() {
  const { data: requests = [], isLoading } = useMyRequests()

  return (
    <div>
      <PageHeader
        title="My Requests"
        subtitle="Status updates in real time"
      />

      <div className="table-scroll bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            You haven't submitted any requests yet. Go to a student's page to request a file.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Ref Code', 'Student', 'Document', 'Purpose', 'Date', 'Status', 'Note'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-600">{r.reference_code}</td>
                  <td className="px-4 py-3">
                    {r.students
                      ? <><p className="font-medium">{r.students.last_name}, {r.students.first_name}</p><p className="text-xs text-gray-400 font-mono">{r.students.lrn}</p></>
                      : <p className="text-gray-400">—</p>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.document_types?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{r.purpose ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString('en-PH')}
                  </td>
                  <td className="px-4 py-3"><Badge label={r.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.release_note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
