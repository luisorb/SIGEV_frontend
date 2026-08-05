import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  LogIn,
  Eye,
  EyeOff,
  User,
  Lock,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../useAuth'

const loginSchema = z.object({
  identificador: z.string().min(1, 'Ingrese su identificador'),
  password: z.string().min(1, 'Ingrese su contraseña'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setError('')
    const result = await login(data.identificador, data.password)
    if (result.success) {
      navigate('/', { replace: true })
    } else {
      setError(result.error ?? 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md animate-[slideInUp_0.4s_ease-out]">
        <div className="relative">
          <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-900/25 border border-white/80 ring-1 ring-slate-100 p-8 sm:p-10 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary-dark via-primary to-primary-dark" />

            <div className="mb-8">
              <div className="flex flex-col items-center">
                <img src="/logo2.png" alt="SIGEV" className="h-16 w-auto mb-5" />
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Bienvenido de nuevo
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Inicia sesión para acceder al panel de control
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="identificador" className="text-sm font-medium text-slate-700">
                  Identificador
                </label>
                <div className="relative group">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 peer-focus:text-primary transition-colors" />
                  <input
                    id="identificador"
                    type="text"
                    autoComplete="username"
                    placeholder="ej: llopez"
                    {...register('identificador')}
                    className={`peer w-full pl-10 pr-3.5 py-3 border rounded-xl text-sm text-slate-900 bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all duration-150 ${
                      errors.identificador ? 'border-red-300 focus:ring-red-500/10 focus:border-red-400' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.identificador && (
                  <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.identificador.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 peer-focus:text-primary transition-colors" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={`peer w-full pl-10 pr-10 py-3 border rounded-xl text-sm text-slate-900 bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all duration-150 ${
                      errors.password ? 'border-red-300 focus:ring-red-500/10 focus:border-red-400' : 'border-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 peer-focus:text-slate-500 p-1"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none overflow-hidden transition-all duration-200"
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {isSubmitting ? 'Ingresando…' : 'Ingresar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}