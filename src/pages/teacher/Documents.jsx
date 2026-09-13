import { useState } from 'react'
import { Search } from 'lucide-react'
import { useAllDocuments } from '../../hooks/useDocuments'
import { useMyAssignments, studentMatchesAssignments } from '../../hooks/useAssignments'
import { PageHeader } from '../../components/ui/index'
import DocumentList from '../../components/DocumentList'

export default function TeacherDocuments() {
  const [search, setSearch] = useState('')
  const { data: documents = [], isLoading } = useAllDocuments(search)
  const { data: assignments = [], isLoading: assignmentsLoading } = useMyAssignments()

  // RLS already filters classified + unassigned docs; filter client-side too for safety
  const visible = documents.filter(
    d => !d.is_classified && studentMatchesAssignments(d.students, assignments)
  )

  return (
    <div>
      <PageHeader title="Documents" subtitle="Files from students in your assigned grade levels & sections" />

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title…"
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <DocumentList documents={visible} loading={isLoading || assignmentsLoading} canDelete={false} />
    </div>
  )
}

