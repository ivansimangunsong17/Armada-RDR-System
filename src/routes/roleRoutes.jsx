import {
  FaChartLine,
  FaClock,
  FaEnvelope,
  FaFileAlt,
  FaLayerGroup,
  FaShip,
  FaTruckLoading,
  FaUserCheck,
  FaUsersCog,
} from 'react-icons/fa'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx'
import CheckerDashboardPage from '../pages/checker/CheckerDashboardPage.jsx'
import SupervisorDashboardPage from '../pages/supervisor/SupervisorDashboardPage.jsx'
import DischargeInputPage from '../pages/DischargeInputPage.jsx'
import EmailSettingsPage from '../pages/EmailSettingsPage.jsx'
import InputMonitoringPage from '../pages/InputMonitoringPage.jsx'
import InputHistoryPage from '../pages/InputHistoryPage.jsx'
import PeriodReportPage from '../pages/PeriodReportPage.jsx'
import RunningReportPage from '../pages/RunningReportPage.jsx'
import ShiftReportPage from '../pages/ShiftReportPage.jsx'
import StowagePlanPage from '../pages/StowagePlanPage.jsx'
import UserManagementPage from '../pages/UserManagementPage.jsx'
import VesselDataPage from '../pages/VesselDataPage.jsx'
import PlaceholderPage from '../pages/PlaceholderPage.jsx'

export const roleRoutes = {
  admin: [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: FaChartLine,
      element: (appState) => <AdminDashboardPage appState={appState} />,
    },
    {
      path: '/admin/vessels',
      label: 'Cargo Information',
      icon: FaShip,
      element: (appState) => <VesselDataPage appState={appState} />,
    },
    {
      path: '/admin/stowage-plan',
      label: 'Final Stowage Plan',
      icon: FaLayerGroup,
      hidden: true,
      element: (appState) => <StowagePlanPage appState={appState} />,
    },
    {
      path: '/admin/checker-assignment',
      label: 'Checker Assignment',
      icon: FaUserCheck,
      hidden: true,
      element: () => (
        <PlaceholderPage
          title="Checker Assignment"
          description="Admin nantinya menentukan checker handle kapal tertentu."
        />
      ),
    },
    {
      path: '/admin/input-discharge',
      label: 'Input Data',
      icon: FaTruckLoading,
      hidden: true,
      element: (appState) => <DischargeInputPage appState={appState} />,
    },
    {
      path: '/admin/input-monitoring',
      label: 'Input Monitoring',
      icon: FaTruckLoading,
      element: (appState) => <InputMonitoringPage appState={appState} />,
    },
    {
      path: '/admin/running-report',
      label: 'Report',
      icon: FaFileAlt,
      element: (appState) => <RunningReportPage appState={appState} />,
    },
    {
      path: '/admin/user-management',
      label: 'User Management',
      icon: FaUsersCog,
      element: (appState) => <UserManagementPage appState={appState} />,
    },
    {
      path: '/admin/period-report',
      label: 'Report 2 Jam',
      icon: FaClock,
      hidden: true,
      element: (appState) => <PeriodReportPage appState={appState} />,
    },
    {
      path: '/admin/shift-report',
      label: 'Report Shift',
      icon: FaClock,
      hidden: true,
      element: (appState) => <ShiftReportPage appState={appState} />,
    },
    {
      path: '/admin/email-settings',
      label: 'Setting Email',
      icon: FaEnvelope,
      hidden: true,
      element: (appState) => <EmailSettingsPage appState={appState} />,
    },
  ],
  checker: [
    {
      path: '/checker/dashboard',
      label: 'Dashboard',
      icon: FaChartLine,
      element: (appState) => <CheckerDashboardPage appState={appState} />,
    },
    {
      path: '/checker/input-data',
      label: 'Input Data',
      icon: FaTruckLoading,
      element: (appState) => <DischargeInputPage appState={appState} />,
    },
    {
      path: '/checker/input-history',
      label: 'Riwayat Input',
      icon: FaFileAlt,
      element: (appState) => <InputHistoryPage appState={appState} />,
    },
    {
      path: '/checker/report',
      label: 'Running Report',
      icon: FaFileAlt,
      element: (appState) => <RunningReportPage appState={appState} />,
    },
  ],
  supervisor: [
    {
      path: '/supervisor/dashboard',
      label: 'Dashboard',
      icon: FaChartLine,
      element: (appState) => <SupervisorDashboardPage appState={appState} />,
    },
    {
      path: '/supervisor/running-report',
      label: 'Report',
      icon: FaFileAlt,
      element: (appState) => <RunningReportPage appState={appState} />,
    },
    {
      path: '/supervisor/period-report',
      label: 'Report 2 Jam',
      icon: FaClock,
      element: (appState) => <PeriodReportPage appState={appState} />,
    },
    {
      path: '/supervisor/shift-report',
      label: 'Report Shift',
      icon: FaClock,
      element: (appState) => <ShiftReportPage appState={appState} />,
    },
    {
      path: '/supervisor/report-logs',
      label: 'Report Logs',
      icon: FaFileAlt,
      hidden: true,
      element: () => (
        <PlaceholderPage
          title="Report Logs"
          description="Supervisor nantinya melihat histori report dan aktivitas perubahan data."
        />
      ),
    },
  ],
}

export function getRoutesForRole(role) {
  return roleRoutes[role] || roleRoutes.checker
}

export function getDefaultPathForRole(role) {
  return getRoutesForRole(role)[0].path
}
