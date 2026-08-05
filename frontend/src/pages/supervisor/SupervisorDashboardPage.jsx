import DashboardPage from '../DashboardPage.jsx'

function SupervisorDashboardPage({ appState }) {
  return (
    <DashboardPage
      appState={appState}
      dashboardTitle="Report Viewer Dashboard"
      dashboardDescription="Monitoring read-only progress discharge semua kapal aktif untuk kebutuhan report."
    />
  )
}

export default SupervisorDashboardPage
