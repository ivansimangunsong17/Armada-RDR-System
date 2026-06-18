import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AdminLayout from './layouts/AdminLayout.jsx'
import CheckerLayout from './layouts/CheckerLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SupervisorLayout from './layouts/SupervisorLayout.jsx'
import { getDefaultPathForRole, getRoutesForRole } from './routes/roleRoutes.jsx'
import { normalizeRole } from './utils/roles.js'
import {
  getCurrentSession,
  getProfileByUserId,
  mapProfileToCurrentUser,
  signInWithLoginIdentifier,
  signOutSupabase,
} from './services/authService.js'
import {
  dischargeEntries as initialDischargeEntries,
  emailRecipients as initialEmailRecipients,
  hatchCargo as initialHatchCargo,
  vessels as initialVessels,
} from './data/dummyData.js'

function App() {
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [vessels, setVessels] = useState(initialVessels)
  const [hatchCargo, setHatchCargo] = useState(initialHatchCargo)
  const [dischargeEntries, setDischargeEntries] = useState(initialDischargeEntries)
  const [emailRecipients, setEmailRecipients] = useState(initialEmailRecipients)

  const appState = {
    vessels,
    setVessels,
    hatchCargo,
    setHatchCargo,
    dischargeEntries,
    setDischargeEntries,
    emailRecipients,
    setEmailRecipients,
    currentUser,
  }

  async function applyAuthUser(authUser) {
    const { profile, error } = await getProfileByUserId(authUser.id)

    if (error) {
      throw error
    }

    if (!profile) {
      throw new Error('Profile user tidak ditemukan. Hubungi admin.')
    }

    if (!profile.is_active) {
      throw new Error('Akun tidak aktif. Hubungi admin.')
    }

    const nextUser = mapProfileToCurrentUser(profile, authUser)
    setCurrentUser(nextUser)
    setIsLoggedIn(true)

    return nextUser
  }

  async function handleLogin(identifier, password) {
    setIsLoginLoading(true)
    setAuthError('')

    try {
      const { user, error } = await signInWithLoginIdentifier(identifier, password)

      if (error) {
        throw error
      }

      if (!user) {
        throw new Error('Login gagal. Data user Supabase tidak ditemukan.')
      }

      await applyAuthUser(user)
    } catch (error) {
      await signOutSupabase()
      setCurrentUser(null)
      setIsLoggedIn(false)
      setAuthError(error.message || 'Login gagal.')
    } finally {
      setIsLoginLoading(false)
    }
  }

  async function handleLogout() {
    await signOutSupabase()
    setCurrentUser(null)
    setIsLoggedIn(false)
    setAuthError('')
  }

  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      setIsAuthLoading(true)
      setAuthError('')

      try {
        const { session, error } = await getCurrentSession()

        if (error) {
          throw error
        }

        if (session?.user) {
          await applyAuthUser(session.user)
        }
      } catch (error) {
        await signOutSupabase()
        if (isMounted) {
          setCurrentUser(null)
          setIsLoggedIn(false)
          setAuthError(error.message || 'Gagal memulihkan session.')
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      isMounted = false
    }
  }, [])

  if (isAuthLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 p-6 text-center">
        <div>
          <p className="text-sm font-bold uppercase text-red-800">RDR System</p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-950">Memulihkan session...</h1>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              authError={authError}
              isLoading={isLoginLoading}
              onLogin={handleLogin}
            />
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  const currentRole = normalizeRole(currentUser?.role)
  const availableRoutes = getRoutesForRole(currentRole)
  const defaultRoute = getDefaultPathForRole(currentRole)
  const RoleLayout =
    currentRole === 'admin'
      ? AdminLayout
      : currentRole === 'viewer'
        ? SupervisorLayout
        : CheckerLayout

  return (
    <Routes>
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />
      <Route
        element={
          <RoleLayout
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        }
      >
        <Route index element={<Navigate to={defaultRoute} replace />} />
        {availableRoutes.map((route) => (
          <Route key={route.path} path={route.path.replace(/^\//, '')} element={route.element(appState)} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  )
}

export default App
