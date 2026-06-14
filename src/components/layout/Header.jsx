import { FaBars } from 'react-icons/fa'

const roleLabels = {
  admin: 'Admin Workspace',
  checker: 'Checker Workspace',
  supervisor: 'Supervisor Workspace',
}

function Header({ currentUser, layoutRole, onLogout, onOpenMobileMenu }) {
  const displayName = currentUser?.name || 'User Dummy'
  const displayRole = currentUser?.role || 'user'

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm shadow-slate-200/70 backdrop-blur sm:px-6 sm:py-4 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            aria-label="Open navigation menu"
            className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 text-red-900 shadow-sm transition-colors hover:border-red-200 hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100 lg:hidden"
            type="button"
            onClick={onOpenMobileMenu}
          >
            <FaBars aria-hidden="true" className="text-base" />
            <span className="hidden text-sm font-extrabold sm:inline">Menu</span>
          </button>
          <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-red-800">
            {roleLabels[layoutRole] || 'Operation Dashboard'}
          </p>
          <h1 className="mt-1 text-lg font-extrabold text-slate-950 sm:text-2xl">
            Running Discharge Report System
          </h1>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm sm:px-4">
            <span className="font-semibold text-slate-900">User:</span>{' '}
            <span className="text-slate-700">{displayName}</span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="font-semibold text-slate-900">Role:</span>{' '}
            <span className="text-slate-700 capitalize">{displayRole}</span>
          </div>

          <button
            className="w-full rounded-md bg-red-800 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-900 focus:outline-none focus:ring-4 focus:ring-red-100 sm:w-auto"
            type="button"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
