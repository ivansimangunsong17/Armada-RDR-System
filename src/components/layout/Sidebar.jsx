import { NavLink } from 'react-router-dom'
import { FaTimes } from 'react-icons/fa'
import { getRoutesForRole } from '../../routes/roleRoutes.jsx'
import bgLogoArmada from '../../assets/BGLogoArmada.png'

function Sidebar({ currentUser, isMobileMenuOpen = false, layoutRole, onCloseMobileMenu }) {
  const currentRole = layoutRole || currentUser?.role || 'checker'
  const visibleMenuItems = getRoutesForRole(currentRole).filter((item) => !item.hidden)

  return (
    <>
    {isMobileMenuOpen && (
      <button
        aria-label="Close navigation overlay"
        className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
        type="button"
        onClick={onCloseMobileMenu}
      />
    )}

    <aside
      className={[
        'fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw] shrink-0 overflow-hidden border-r border-red-950 bg-red-950 text-white shadow-2xl shadow-slate-950/30 transition-transform duration-200 ease-out lg:z-30 lg:h-screen lg:w-64 lg:max-w-none lg:translate-x-0 lg:shadow-none',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-white/95 p-1 shadow-md shadow-red-950/30 ring-1 ring-white/30 lg:h-12 lg:w-12">
              <img
                className="max-h-full max-w-full object-contain"
                src={bgLogoArmada}
                alt="Armada logo"
              />
            </span>
            <div className="min-w-0">
              <strong className="block truncate text-lg font-black tracking-tight lg:text-base">RDR System</strong>
              <small className="block truncate text-xs font-semibold uppercase tracking-wide text-red-100/75">
                Discharge Monitoring
              </small>
            </div>
            <button
              aria-label="Close navigation menu"
              className="ml-auto grid h-11 w-11 place-items-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/20 lg:hidden"
              type="button"
              onClick={onCloseMobileMenu}
            >
              <FaTimes aria-hidden="true" />
            </button>
          </div>
        </div>

        <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-red-100/50">
            Navigation
          </p>
          <div className="grid gap-2">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                onClick={onCloseMobileMenu}
                to={item.path}
                className={({ isActive }) =>
                  [
                    'flex min-h-12 min-w-0 items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-bold transition-colors lg:min-h-11 lg:rounded-lg lg:px-3 lg:py-2.5 lg:text-sm',
                    isActive
                      ? 'bg-white text-red-950 shadow-md shadow-red-950/20'
                      : 'text-red-50/85 hover:bg-white/10 hover:text-white',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        'grid h-10 w-10 shrink-0 place-items-center rounded-lg text-base lg:h-9 lg:w-9 lg:text-sm',
                        isActive ? 'bg-red-50 text-red-800' : 'bg-white/10 text-red-50',
                      ].join(' ')}
                    >
                      <Icon aria-hidden="true" />
                    </span>
                    <span className="min-w-0 truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
          </div>
        </nav>

        <div className="shrink-0 border-t border-white/10 px-4 py-4 text-xs text-red-100/70">
          <p className="font-bold text-white">{currentUser?.name || 'User'}</p>
          <p className="mt-1 capitalize text-red-100/70">{currentRole} workspace</p>
        </div>
      </div>
    </aside>
    </>
  )
}

export default Sidebar
