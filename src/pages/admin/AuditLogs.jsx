import { useState } from 'react'
import { useAuditLogs } from '../../hooks/useStats'
import { PageHeader } from '../../components/ui/index'

const actionColor = {
  INSERT: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
}

export default function AuditLogs() {
  const [limit, setLimit] = useState(50)
  const { data: logs = [], isLoading } = useAuditLogs(limit)

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="All system actions are recorded here" />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No logs yet.</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Timestamp', 'Actor', 'Action', 'Table', 'Entity ID', 'Details'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors align-top">
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-PH')}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{log.profiles?.full_name ?? 'System'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${actionColor[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{log.entity}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 truncate max-w-[120px]">{log.entity_id}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-xs">
                      <details>
                        <summary className="cursor-pointer text-blue-500 hover:underline">View</summary>
                        <pre className="mt-1 text-xs bg-gray-50 rounded p-2 overflow-auto max-h-32">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length >= limit && (
              <div className="px-4 py-3 border-t border-gray-100 text-center">
                <button onClick={() => setLimit(l => l + 50)}
                  className="text-sm text-blue-600 hover:underline">
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
