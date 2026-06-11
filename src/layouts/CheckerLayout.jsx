import MainLayout from './MainLayout.jsx'

function CheckerLayout({ currentUser, onLogout }) {
  return <MainLayout currentUser={currentUser} layoutRole="checker" onLogout={onLogout} />
}

export default CheckerLayout
