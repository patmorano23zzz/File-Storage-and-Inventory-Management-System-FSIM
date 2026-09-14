const colors = {
  enrolled:    'bg-green-100 text-green-700',
  transferred: 'bg-yellow-100 text-yellow-700',
  graduated:   'bg-blue-100 text-blue-700',
  dropped:     'bg-red-100 text-red-700',
  pending:     'bg-yellow-100 text-yellow-700',
  approved:    'bg-blue-100 text-blue-700',
  denied:      'bg-red-100 text-red-700',
  released:    'bg-green-100 text-green-700',
  cancelled:   'bg-gray-100 text-gray-600',
  admin:       'bg-purple-100 text-purple-700',
  teacher:     'bg-emerald-100 text-emerald-700',
}

export function Badge({ label }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors[label] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">{action}</div>}
    </div>
  )
}
