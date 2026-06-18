import MainLayout from './MainLayout.jsx'

function SupervisorLayout({ currentUser, onLogout }) {
  return <MainLayout currentUser={currentUser} layoutRole="viewer" onLogout={onLogout} />
}

export default SupervisorLayout
