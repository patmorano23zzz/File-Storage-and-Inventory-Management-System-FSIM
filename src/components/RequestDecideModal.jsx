import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import Modal from './ui/Modal'
import { useDecideRequest } from '../hooks/useRequests'
import AlertMessage from './ui/AlertMessage'

const actions = {
  approved:  { label: 'Approve',  btn: 'bg-blue-600 hover:bg-blue-700',   noteLabel: 'Note (optional)' },
  denied:    { label: 'Deny',     btn: 'bg-red-600 hover:bg-red-700',     noteLabel: 'Reason for denial *' },
  released:  { label: 'Release',  btn: 'bg-green-600 hover:bg-green-700', noteLabel: 'Release note (optional)' },
  cancelled: { label: 'Cancel',   btn: 'bg-gray-600 hover:bg-gray-700',   noteLabel: 'Reason (optional)' },
}

export default function RequestDecideModal({ request, action, onClose }) {
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const decide = useDecideRequest()
  const cfg = actions[action]

  async function handleSubmit(e) {
    e.preventDefault()
    if (action === 'denied' && !note.trim()) return setError('Please provide a reason for denial.')
    setError('')
    try {
      await decide.mutateAsync({ id: request.id, status: action, release_note: note })
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Modal title={`${cfg.label} Request`} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 space-y-1">
          <p><span className="font-medium">Requester:</span> {request.requester_name}</p>
          <p><span className="font-medium">Document:</span> {request.document_types?.name}</p>
          <p><span className="font-medium">Student:</span> {request.students?.last_name}, {request.students?.first_name}</p>
          <p><span className="font-medium">Ref:</span> <span className="font-mono">{request.reference_code}</span></p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{cfg.noteLabel}</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {error && <AlertMessage>{error}</AlertMessage>}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
          <button type="button" onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={decide.isPending}
            className={`w-full sm:w-auto justify-center flex items-center gap-2 ${cfg.btn} text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60`}>
            {decide.isPending && <Loader2 size={14} className="animate-spin" />}
            {cfg.label}
          </button>
        </div>
      </form>
    </Modal>
  )
}
