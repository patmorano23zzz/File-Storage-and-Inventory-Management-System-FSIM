import { useState } from 'react'
import { Search } from 'lucide-react'
import { useAllDocuments } from '../../hooks/useDocuments'
import { PageHeader } from '../../components/ui/index'
import DocumentList from '../../components/DocumentList'

export default function TeacherDocuments() {
  const [search, setSearch] = useState('')
  const { data: documents = [], isLoading } = useAllDocuments(search)

  // RLS already filters classified docs; filter client-side too for safety
  const visible = documents.filter(d => !d.is_classified)

  return (
    <div>
      <PageHeader title="Documents" subtitle="Non-classified student files" />

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title…"
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <DocumentList documents={visible} loading={isLoading} canDelete={false} />
    </div>
  )
}
