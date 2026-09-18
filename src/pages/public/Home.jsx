import { Link } from 'react-router-dom'
import { FileSearch, FilePlus2, ShieldCheck, ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react'

const features = [
  {
    icon: FilePlus2,
    title: 'Request a Document',
    desc: 'Parents and guardians can submit a file request online. Receive a reference code instantly.',
    to: '/request',
    cta: 'Submit a Request',
    color: 'bg-blue-600',
  },
  {
    icon: FileSearch,
    title: 'Track Your Request',
    desc: 'Check the status of your submitted request anytime using your reference code.',
    to: '/track',
    cta: 'Track Now',
    color: 'bg-emerald-600',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Private',
    desc: 'All student records are protected. Identity verification is required upon document release.',
    color: 'bg-indigo-600',
  },
]

export default function Home() {
  return (
    <div className="page-enter max-w-6xl mx-auto px-4 py-8 sm:py-10 lg:py-16">
      <div className="grid lg:grid-cols-[1.1fr_.9fr] items-center gap-8 lg:gap-12 mb-12 lg:mb-16">
        <div className="animate-[fadeIn_.6s_ease-out]">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Official school records portal
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.08] mb-5">
            Student records, <span className="text-blue-600">handled with care.</span>
          </h1>
          <p className="text-base lg:text-lg text-slate-500 max-w-xl leading-relaxed mb-7">
            Request Form 137, Form 138, certificates, and other school files through one secure,
            paperless workflow. The registrar verifies every request before release.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/request"             className="inline-flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition-colors">
              Request a document <ArrowRight size={17} />
            </Link>
            <Link to="/track"             className="inline-flex justify-center items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-5 py-3 rounded-xl transition-colors">
              Track a request
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-6 text-xs text-slate-500">
            {['No account required', 'Reference code tracking', 'Verified release'].map(item => (
              <span key={item} className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> {item}</span>
            ))}
          </div>
        </div>
        <div className="relative animate-[floatIn_.7s_.12s_ease-out_both]">
          <div className="absolute -inset-5 bg-blue-100/60 rounded-[2rem] blur-2xl" />
          <div className="relative rounded-3xl bg-slate-900 p-5 sm:p-6 lg:p-8 shadow-xl overflow-hidden">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-500/20" />
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <div><p className="text-xs uppercase tracking-[0.18em] text-blue-300 font-semibold">Secure workspace</p><p className="text-white font-semibold mt-1">EduVault portal</p></div>
                <div className="rounded-xl bg-white/10 p-2.5 text-blue-200"><LockKeyhole size={20} /></div>
              </div>
              <div className="space-y-3">
                {['Submit a request', 'Registrar review', 'Verified file release'].map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-xl bg-white/10 px-3.5 py-3">
                    <span className="h-7 w-7 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">{index + 1}</span>
                    <span className="text-sm text-slate-200">{step}</span>
                    {index < 2 && <span className="ml-auto text-xs text-slate-500">next</span>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-6">Your student’s information stays private and every access action is logged.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between mb-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 mb-1">How it works</p><h2 className="text-xl font-bold text-slate-900">A clearer way to get school files</h2></div>
      </div>
      <div className="grid sm:grid-cols-3 gap-5">
        {features.map(({ icon: Icon, title, desc, to, cta, color }) => (
          <div key={title} className="interactive-card bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
            <div className={`${color} text-white rounded-xl w-11 h-11 flex items-center justify-center`}>
              <Icon size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
            {to && (
              <Link
                to={to}
                className={`mt-auto ${color} hover:opacity-90 text-white text-sm font-semibold px-4 py-2.5 rounded-lg text-center transition-opacity`}
              >
                {cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
