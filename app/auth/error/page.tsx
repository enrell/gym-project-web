'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthError() {
  const router = useRouter()

  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      router.push('/')
    }, 5000)

    return () => clearTimeout(redirectTimer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow rounded">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Authentication Error
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          There was an error during the authentication process. Please try again.
        </p>
        <p className="mt-2 text-center text-sm text-gray-600">
          You will be redirected to the home page in 5 seconds.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Go to Home Page
        </button>
      </div>
    </div>
  )
}