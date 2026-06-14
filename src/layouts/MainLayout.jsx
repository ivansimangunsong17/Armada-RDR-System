import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header.jsx'
import Sidebar from '../components/layout/Sidebar.jsx'

function MainLayout({ currentUser, layoutRole, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100 font-sans text-slate-800">
      <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden lg:flex-row">
        <Sidebar
          currentUser={currentUser}
          isMobileMenuOpen={isMobileMenuOpen}
          layoutRole={layoutRole}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <Header
            currentUser={currentUser}
            layoutRole={layoutRole}
            onLogout={onLogout}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />

          <main className="min-w-0 flex-1 overflow-x-hidden bg-slate-100 p-3 sm:p-5 lg:p-6">
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
