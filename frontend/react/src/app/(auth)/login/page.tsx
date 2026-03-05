'use client'

/**
 * /login page — email + password form with MFA code field.
 *
 * On successful login the user is redirected to the `next` query param
 * (from middleware) or to /dashboard.
 */

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import type { Metadata } from 'next'

// ---------------------------------------------------------------------------
// Validation schema — mirrors Django backend field requirements
// ---------------------------------------------------------------------------

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  mfa_code: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const { login, isAuthenticating, error, clearError } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showMfa, setShowMfa] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    clearError()
    try {
      await login({
        email: values.email,
        password: values.password,
        mfa_code: values.mfa_code || undefined,
      })
      const next = searchParams.get('next') ?? '/dashboard'
      router.replace(next)
    } catch {
      // If error mentions MFA, reveal the MFA field
      if (error?.toLowerCase().includes('mfa') || error?.toLowerCase().includes('otp')) {
        setShowMfa(true)
      }
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Sign in to JOL-HUB</h1>
          <p className="mt-1 text-sm text-gray-500">
            Journey Of Life — religious institution platform
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* MFA code (conditionally shown) */}
          {showMfa && (
            <div>
              <label htmlFor="mfa_code" className="block text-sm font-medium text-gray-700 mb-1">
                Authenticator code
              </label>
              <input
                id="mfa_code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                {...register('mfa_code')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {isAuthenticating ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Footer links */}
        <div className="flex justify-between text-xs text-gray-500">
          <Link href="/forgot-password" className="hover:underline">
            Forgot password?
          </Link>
          <Link href="/register" className="hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </main>
  )
}
