import { useState } from 'react'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import backgroundArmada from '../assets/BackgroundArmada.png'
import bgLogoArmada from '../assets/BGLogoArmada.png'

function LoginPage({ onLogin, isLoading = false, authError = '' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const cleanEmail = email.trim()
    const cleanPassword = password.trim()

    if (!cleanEmail || !cleanPassword) {
      setError('Email dan password wajib diisi.')
      return
    }

    setError('')
    await onLogin(cleanEmail, cleanPassword)
  }


  return (
    <main
      className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 p-6"
      style={{
        backgroundImage: `linear-gradient(rgba(69, 10, 10, 0.72), rgba(15, 23, 42, 0.78)), url(${backgroundArmada})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/70 via-slate-950/35 to-slate-950/80" />

      <form
        className="relative z-10 w-full max-w-md rounded-lg border border-white/20 bg-white/95 p-7 shadow-2xl shadow-red-950/40 backdrop-blur"
        onSubmit={handleSubmit}
      >
        <div className="mb-7 flex items-center gap-5">
          <span className="grid h-28 w-28 shrink-0 place-items-center">
            <img
              className="max-h-full max-w-full object-contain"
              src={bgLogoArmada}
              alt="Armada logo"
            />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Running Discharge Report System</h1>
            <p className="mt-1 text-sm text-slate-500">Login menggunakan akun Supabase.</p>
          </div>
        </div>

        <div className="grid gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? 'Memproses...' : 'Login'}
          </Button>
          {(error || authError) && (
            <p className="text-sm font-semibold text-red-700">{error || authError}</p>
          )}
        </div>
      </form>
    </main>
  )
}

export default LoginPage
