import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export default function PasswordInput({ value, onChange, placeholder, className = '', ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${className} pr-11 password-field`}
      />
      <button
        type="button"
        aria-label={visible ? 'Hide password' : 'Show password'}
        onClick={() => setVisible(current => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  )
}
