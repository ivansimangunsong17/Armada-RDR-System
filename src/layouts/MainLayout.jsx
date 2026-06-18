import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header.jsx'
import Sidebar from '../components/layout/Sidebar.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'

function MainLayout({ currentUser, layoutRole, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleConfirmLogout() {
    setIsLoggingOut(true)

    try {
      await onLogout()
    } finally {
      setIsLoggingOut(false)
      setIsLogoutConfirmOpen(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100 font-sans text-slate-800">
      <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden lg:flex-row">
        <Sidebar
          currentUser={currentUser}
          isMobileMenuOpen={isMobileMenuOpen}
          layoutRole={layoutRole}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          onLogout={() => setIsLogoutConfirmOpen(true)}
        />

        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <Header
            currentUser={currentUser}
            layoutRole={layoutRole}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />

          <main className="min-w-0 flex-1 overflow-x-hidden bg-slate-100 p-3 sm:p-5 lg:p-6">
            <div className="mx-auto w-full max-w-7xl min-w-0">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <Modal
        isOpen={isLogoutConfirmOpen}
        onClose={() => {
          if (!isLoggingOut) setIsLogoutConfirmOpen(false)
        }}
        title="Konfirmasi Logout"
      >
        <div className="grid gap-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-bold text-slate-950">Keluar dari RDR System?</p>
            <p className="mt-1 text-sm text-slate-600">
              Session akun akan diakhiri dan Anda akan kembali ke halaman login.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="secondary"
              disabled={isLoggingOut}
              onClick={() => setIsLogoutConfirmOpen(false)}
            >
              Batal
            </Button>
            <Button type="button" disabled={isLoggingOut} onClick={handleConfirmLogout}>
              {isLoggingOut ? 'Keluar...' : 'Ya, Logout'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MainLayout
