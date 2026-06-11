const roleLabels = {
  admin: 'Admin Workspace',
  checker: 'Checker Workspace',
  supervisor: 'Supervisor Workspace',
}

function Header({ currentUser, layoutRole, onLogout }) {
  const displayName = currentUser?.name || 'User Dummy'
  const displayRole = currentUser?.role || 'user'

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm shadow-slate-200/70 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-red-800">
            {roleLabels[layoutRole] || 'Operation Dashboard'}
          </p>
          <h1 className="mt-1 text-xl font-extrabold text-slate-950 sm:text-2xl">
            Running Discharge Report System
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm shadow-sm">
            <span className="font-semibold text-slate-900">User:</span>{' '}
            <span className="text-slate-700">{displayName}</span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="font-semibold text-slate-900">Role:</span>{' '}
            <span className="text-slate-700 capitalize">{displayRole}</span>
          </div>

          <button
            className="rounded-md bg-red-800 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-900 focus:outline-none focus:ring-4 focus:ring-red-100"
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
