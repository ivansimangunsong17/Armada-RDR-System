import DashboardPage from '../DashboardPage.jsx'

function CheckerDashboardPage({ appState }) {
  return (
    <DashboardPage
      appState={appState}
      dashboardTitle="Dashboard / Progress Discharge"
      dashboardDescription="Progress discharge kapal yang ditugaskan kepada checker."
    />
  )
}

export default CheckerDashboardPage
