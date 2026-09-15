import { ArrowDownAZ, ArrowUpAZ } from 'lucide-react'

export function sortRecords(records, field, direction = 'asc') {
  return [...records].sort((a, b) => {
    const left = a?.[field] ?? ''
    const right = b?.[field] ?? ''
    const leftValue = field.endsWith('_at') ? new Date(left).getTime() : String(left).toLowerCase()
    const rightValue = field.endsWith('_at') ? new Date(right).getTime() : String(right).toLowerCase()
    const result = leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0
    return direction === 'asc' ? result : -result
  })
}

export default function SortControl({ value, onChange, options }) {
  const [field, direction] = value.split(':')
  const toggleDirection = () => onChange(`${field}:${direction === 'asc' ? 'desc' : 'asc'}`)

  return (
    <div className="inline-flex items-center gap-1">
      <label className="sr-only" htmlFor="sort-records">Sort records</label>
      <select
        id="sort-records"
        value={field}
        onChange={e => onChange(`${e.target.value}:${direction}`)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <button
        type="button"
        onClick={toggleDirection}
        title={direction === 'asc' ? 'Ascending order' : 'Descending order'}
        className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50"
      >
        {direction === 'asc' ? <ArrowUpAZ size={16} /> : <ArrowDownAZ size={16} />}
      </button>
    </div>
  )
}
