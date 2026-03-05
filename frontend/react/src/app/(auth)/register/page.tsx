'use client'

/**
 * /register page — new account creation with GDPR consent.
 *
 * Mirrors RegisterSerializer fields exactly.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

// ---------------------------------------------------------------------------
// Validation schema — mirrors Django RegisterSerializer
// ---------------------------------------------------------------------------

const schema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirm: z.string(),
    gdpr_consent: z.boolean().refine((v) => v === true, {
      message: 'You must accept the privacy policy to continue',
    }),
    marketing_consent: z.boolean().optional(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Passwords do not match',
    path: ['password_confirm'],
  })

type FormValues = z.infer<typeof schema>

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function RegisterPage() {
  const { register: registerUser, isAuthenticating, error, clearError } = useAuth()
  const router = useRouter()
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    clearError()
    try {
      await registerUser({
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        password: values.password,
        password_confirm: values.password_confirm,
        gdpr_consent: values.gdpr_consent,
        marketing_consent: values.marketing_consent ?? false,
      })
      setSuccess(true)
      setTimeout(() => router.replace('/login'), 2000)
    } catch {
      // Error is handled by AuthContext
    }
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900">Account created</h1>
          <p className="mt-2 text-sm text-gray-600">
            You can now sign in with your email and password.
          </p>
          <p className="mt-4 text-xs text-gray-400">Redirecting to login…</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Join JOL-HUB today</p>
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
          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                First name
              </label>
              <input
                id="first_name"
                type="text"
                {...register('first_name')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.first_name && (
                <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                Last name
              </label>
              <input
                id="last_name"
                type="text"
                {...register('last_name')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.last_name && (
                <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
              )}
            </div>
          </div>

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
              autoComplete="new-password"
              {...register('password')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </label>
            <input
              id="password_confirm"
              type="password"
              autoComplete="new-password"
              {...register('password_confirm')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password_confirm && (
              <p className="mt-1 text-xs text-red-600">{errors.password_confirm.message}</p>
            )}
          </div>

          {/* GDPR consent (required) */}
          <div className="flex items-start gap-3">
            <input
              id="gdpr_consent"
              type="checkbox"
              {...register('gdpr_consent')}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="gdpr_consent" className="text-sm text-gray-700">
              I agree to the{' '}
              <Link href="/privacy" className="underline hover:text-blue-700">
                Privacy Policy
              </Link>{' '}
              and consent to the processing of my personal data under GDPR.
            </label>
          </div>
          {errors.gdpr_consent && (
            <p className="text-xs text-red-600">{errors.gdpr_consent.message}</p>
          )}

          {/* Marketing consent (optional) */}
          <div className="flex items-start gap-3">
            <input
              id="marketing_consent"
              type="checkbox"
              {...register('marketing_consent')}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="marketing_consent" className="text-sm text-gray-700">
              Send me occasional updates about JOL-HUB features and events (optional).
            </label>
          </div>

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {isAuthenticating ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="underline hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
