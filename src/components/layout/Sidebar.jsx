import { NavLink } from 'react-router-dom'
import { getRoutesForRole } from '../../routes/roleRoutes.jsx'
import bgLogoArmada from '../../assets/BGLogoArmada.png'

function Sidebar({ currentUser, layoutRole }) {
  const currentRole = layoutRole || currentUser?.role || 'checker'
  const visibleMenuItems = getRoutesForRole(currentRole).filter((item) => !item.hidden)

  return (
    <aside className="w-full shrink-0 overflow-hidden border-r border-red-950 bg-red-950 text-white lg:sticky lg:top-0 lg:h-screen lg:w-72">
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-4">
            <span className="grid h-24 w-24 shrink-0 place-items-center rounded-lg bg-white/95 p-0.5 shadow-md shadow-red-950/30 ring-1 ring-white/30">
              <img
                className="max-h-full max-w-full object-contain"
                src={bgLogoArmada}
                alt="Armada logo"
              />
            </span>
            <div>
              <strong className="block text-base font-extrabold">RDR System</strong>
              <small className="block text-xs text-red-100/75">Discharge Monitoring</small>
            </div>
          </div>
        </div>

        <nav className="sidebar-scroll grid min-h-0 flex-1 grid-cols-1 gap-1 overflow-y-auto px-3 py-4 sm:grid-cols-2 lg:block lg:space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-white text-red-950 shadow-sm'
                      : 'text-red-50/80 hover:bg-white/10 hover:text-white',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        'grid h-8 w-8 place-items-center rounded-md text-sm',
                        isActive ? 'bg-red-50 text-red-800' : 'bg-white/10 text-red-50',
                      ].join(' ')}
                    >
                      <Icon aria-hidden="true" />
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="shrink-0 border-t border-white/10 px-5 py-4 text-xs text-red-100/70">
          Frontend dummy mode
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
