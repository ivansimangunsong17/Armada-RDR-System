import DashboardPage from '../DashboardPage.jsx'

function SupervisorDashboardPage({ appState }) {
  return (
    <DashboardPage
      appState={appState}
      dashboardTitle="Supervisor Dashboard"
      dashboardDescription="Monitoring progress discharge semua kapal aktif untuk kebutuhan pengawasan."
    />
  )
}

export default SupervisorDashboardPage
