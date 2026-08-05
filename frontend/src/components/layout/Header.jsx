import { FaBars } from 'react-icons/fa'
import { getRoleLabel, getWorkspaceLabel } from '../../utils/roles.js'

function Header({ currentUser, layoutRole, onOpenMobileMenu }) {
  const displayName = currentUser?.name || 'User Dummy'
  const displayRole = getRoleLabel(currentUser?.role)

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
            {getWorkspaceLabel(layoutRole)}
          </p>
          <h1 className="mt-1 text-lg font-extrabold text-slate-950 sm:text-2xl">
            Running Discharge Report System
          </h1>
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm sm:px-4">
            <span className="font-semibold text-slate-900">User:</span>{' '}
            <span className="text-slate-700">{displayName}</span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="font-semibold text-slate-900">Role:</span>{' '}
            <span className="text-slate-700">{displayRole}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
