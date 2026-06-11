import DashboardPage from '../DashboardPage.jsx'

function AdminDashboardPage({ appState }) {
  return (
    <DashboardPage
      appState={appState}
      dashboardTitle="Admin Dashboard"
      dashboardDescription="Monitoring seluruh kapal, input checker, dan progress discharge operasional."
    />
  )
}

export default AdminDashboardPage
