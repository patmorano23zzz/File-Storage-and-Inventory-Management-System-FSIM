import { useState } from 'react'
import { Clock3, UserRound, FileText, X } from 'lucide-react'
import { useAuditLogs } from '../../hooks/useStats'
import { PageHeader } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'

const actionColor = {
  INSERT: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
}

const entityLabels = {
  access_requests: 'file request',
  documents: 'student document',
}

const actionLabels = {
  INSERT: 'Added',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
}

const detailLabels = {
  requester_name: 'Requester',
  student_last_name: 'Student last name',
  student_lrn: 'Student LRN',
  document_type_id: 'Document type',
  purpose: 'Purpose',
  status: 'Request status',
  source: 'Submitted through',
  title: 'Document title',
  file_name: 'File name',
  school_year: 'School year',
  grade_level: 'Grade level',
  is_classified: 'Confidential file',
}

function getActivityLabel(log) {
  const action = actionLabels[log.action] ?? 'Changed'
  const entity = entityLabels[log.entity] ?? 'record'
  return `${action} ${entity}`
}

function formatDetailValue(key, value) {
  if (key === 'is_classified') return value ? 'Yes' : 'No'
  if (key === 'source') return value === 'web' ? 'Public request form' : 'Teacher portal'
  if (key === 'status') return String(value).replace(/_/g, ' ')
  return String(value)
}

function readableDetails(details) {
  if (!details || typeof details !== 'object') return []
  return Object.entries(details)
    .filter(([key, value]) => detailLabels[key] && value !== null && value !== '')
    .map(([key, value]) => [detailLabels[key], formatDetailValue(key, value)])
}

export default function AuditLogs() {
  const [limit, setLimit] = useState(50)
  const [selectedLog, setSelectedLog] = useState(null)
  const { data: logs = [], isLoading, isError, error } = useAuditLogs(limit)

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="All system actions are recorded here" />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-600">
            Unable to load audit logs: {error.message}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No logs yet.</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['When', 'Who', 'Activity', 'Information'].map(h => (
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
                      <div className="flex flex-col items-start gap-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${actionColor[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                          {actionLabels[log.action] ?? log.action}
                        </span>
                        <span className="text-xs text-gray-500">{getActivityLabel(log).replace(`${actionLabels[log.action] ?? log.action} `, '')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-md">
                      {readableDetails(log.details).length === 0 ? (
                        <span className="text-gray-400">No additional information</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 font-medium text-blue-700 hover:border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          View information
                        </button>
                      )}
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

      {selectedLog && (
        <Modal
          title="Activity information"
          onClose={() => setSelectedLog(null)}
          size="md"
        >
          <div className="space-y-5">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-blue-600 p-2.5 text-white">
                  <FileText size={19} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Activity</p>
                  <h4 className="mt-1 text-lg font-semibold text-slate-900">{getActivityLabel(selectedLog)}</h4>
                  <p className="mt-1 text-sm text-slate-500">This activity was recorded in the school records system.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Clock3 size={14} /> When</div>
                <p className="mt-1 text-sm font-medium text-slate-800">{new Date(selectedLog.created_at).toLocaleString('en-PH')}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><UserRound size={14} /> Who</div>
                <p className="mt-1 text-sm font-medium text-slate-800">{selectedLog.profiles?.full_name ?? 'System'}</p>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-800">Information recorded</h4>
              <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {readableDetails(selectedLog.details).map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[minmax(0,40%)_1fr] gap-3 px-4 py-3">
                    <dt className="text-sm font-medium text-slate-500">{label}</dt>
                    <dd className="break-words text-sm text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 transition-colors"
              >
                <X size={15} /> Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
