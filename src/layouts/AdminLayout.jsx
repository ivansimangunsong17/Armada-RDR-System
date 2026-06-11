import MainLayout from './MainLayout.jsx'

function AdminLayout({ currentUser, onLogout }) {
  return <MainLayout currentUser={currentUser} layoutRole="admin" onLogout={onLogout} />
}

export default AdminLayout
