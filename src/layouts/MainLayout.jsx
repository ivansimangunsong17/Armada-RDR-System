import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header.jsx'
import Sidebar from '../components/layout/Sidebar.jsx'

function MainLayout({ currentUser, layoutRole, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar currentUser={currentUser} layoutRole={layoutRole} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header currentUser={currentUser} layoutRole={layoutRole} onLogout={onLogout} />

          <main className="min-w-0 flex-1 overflow-x-hidden bg-slate-100 p-4 sm:p-5 lg:p-6">
            <div className="mx-auto w-full max-w-7xl min-w-0">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default MainLayout
