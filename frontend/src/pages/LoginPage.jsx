import { useState } from 'react'
import { FaArrowRight, FaLock, FaSpinner, FaUser } from 'react-icons/fa'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import backgroundArmada from '../assets/BackgroundArmada.png'
import bgLogoArmada from '../assets/BGLogoArmada.png'
import { validateLoginForm } from '../utils/validators.js'

function LoginPage({ onLogin, isLoading = false, authError = '' }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const validation = validateLoginForm({ identifier, password })

    if (validation.error) {
      setError(validation.error)
      return
    }

    setError('')
    await onLogin(validation.identifier, validation.password)
  }


  return (
    <main
      className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-slate-950 sm:px-6 lg:px-8"
      style={{
        backgroundImage: `linear-gradient(115deg, rgba(15, 23, 42, 0.9), rgba(69, 10, 10, 0.78) 42%, rgba(15, 23, 42, 0.88)), url(${backgroundArmada})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(248,250,252,0.18),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.18),rgba(15,23,42,0.82))]" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-700 via-white to-red-700" />

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-6xl items-center">
        <div className="grid overflow-hidden rounded-lg border border-white/15 bg-white/10 shadow-2xl shadow-slate-950/50 backdrop-blur-md lg:grid-cols-[1.05fr_0.95fr]">
          <div
            className="relative hidden min-h-[620px] overflow-hidden p-10 text-white lg:block"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.24), rgba(15, 23, 42, 0.82)), url(${backgroundArmada})`,
              backgroundPosition: 'left center',
              backgroundSize: 'cover',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-950/55 via-slate-950/10 to-slate-950/88" />
            <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:56px_56px]" />
            <div className="absolute -right-20 top-0 h-full w-64 skew-x-[-18deg] bg-white/10" />
            <img
              aria-hidden="true"
              className="absolute -bottom-16 -right-10 h-72 w-72 object-contain opacity-10"
              src={bgLogoArmada}
              alt=""
            />
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-slate-950 to-transparent" />

            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center gap-4">
                <span className="grid h-16 w-16 place-items-center rounded-lg border border-white/20 bg-white/95 shadow-xl">
                  <img
                    className="h-12 w-12 object-contain"
                    src={bgLogoArmada}
                    alt="Armada logo"
                  />
                </span>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-white/70">Armada Terminal Operations</p>
                  <h1 className="text-2xl font-black text-white">Running Discharge Report System</h1>
                </div>
              </div>

              <div className="max-w-xl">
                <h2 className="text-4xl font-black leading-tight text-white">
                  Kontrol bongkar muat dengan data yang rapi, cepat, dan siap dilaporkan.
                </h2>
              </div>
            </div>
          </div>

          <form
            className="relative overflow-hidden bg-slate-50 px-5 py-8 shadow-2xl sm:px-8 lg:px-10"
            onSubmit={handleSubmit}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-slate-900" />
            <div className="absolute right-0 top-0 h-40 w-40 border-l border-b border-slate-200/80 bg-white/50 [clip-path:polygon(100%_0,100%_100%,0_0)]" />
            <div className="absolute bottom-8 right-8 h-32 w-32 rotate-12 border border-slate-200/70" />
            <img
              aria-hidden="true"
              className="absolute -bottom-8 -right-6 h-44 w-44 object-contain opacity-[0.035]"
              src={bgLogoArmada}
              alt=""
            />
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 flex items-center gap-4 lg:hidden">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white shadow-lg">
                  <img
                    className="h-12 w-12 object-contain"
                    src={bgLogoArmada}
                    alt="Armada logo"
                  />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-700">Armada Terminal Operations</p>
                  <h1 className="text-xl font-black text-slate-950">Running Discharge Report System</h1>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-950">Masuk ke dashboard</h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
                  Gunakan akun operasional yang sudah terdaftar untuk mengakses data kapal dan laporan discharge.
                </p>
              </div>

              <div className="grid gap-5">
                <div className="relative">
                  <FaUser
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-[43px] z-10 text-sm text-slate-400"
                  />
                  <Input
                    className="h-12 rounded-lg border-slate-200 bg-white pl-11 text-base shadow-sm shadow-slate-200/80 focus:border-red-700 focus:bg-white focus:ring-red-100"
                    label="Username atau Email"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="admin atau admin@example.com"
                  />
                </div>

                <div className="relative">
                  <FaLock
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-[43px] z-10 text-sm text-slate-400"
                  />
                  <Input
                    className="h-12 rounded-lg border-slate-200 bg-white pl-11 text-base shadow-sm shadow-slate-200/80 focus:border-red-700 focus:bg-white focus:ring-red-100"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Masukkan password"
                  />
                </div>

                {(error || authError) && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 shadow-sm">
                    {error || authError}
                  </div>
                )}

                <Button
                  className="mt-1 h-12 w-full gap-2 rounded-lg bg-red-700 text-base font-black shadow-lg shadow-red-900/25 hover:bg-red-800"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <FaSpinner aria-hidden="true" className="animate-spin" />
                      Memproses
                    </>
                  ) : (
                    <>
                      Login
                      <FaArrowRight aria-hidden="true" />
                    </>
                  )}
                </Button>
              </div>

              <div aria-hidden="true" className="mt-8 flex items-center gap-2">
                <span className="h-1.5 w-14 rounded-full bg-red-700" />
                <span className="h-1.5 w-8 rounded-full bg-slate-300" />
                <span className="h-1.5 w-3 rounded-full bg-slate-200" />
              </div>
            </div>
          </form>
        </div>
      </section>

      {isLoading && (
        <div
          aria-live="polite"
          aria-busy="true"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-6 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-lg border border-white/15 bg-white p-6 text-center shadow-2xl shadow-slate-950/50">
            <FaSpinner
              aria-hidden="true"
              className="mx-auto animate-spin text-4xl text-red-800"
            />
            <p className="mt-4 text-lg font-extrabold text-slate-950">Memverifikasi akun...</p>
            <p className="mt-1 text-sm text-slate-600">
              Mohon tunggu sampai dashboard selesai disiapkan.
            </p>
          </div>
        </div>
      )}
    </main>
  )
}

export default LoginPage
