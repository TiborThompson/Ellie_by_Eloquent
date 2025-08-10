import { useState } from 'react'

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string) => Promise<void>
  loading: boolean
  error: string | null
}

export default function AuthModal({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  loading,
  error
}: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (isLogin) {
        await onLogin(email, password)
      } else {
        await onRegister(email, password)
      }
      // On success, reset the form and close the modal
      setEmail('')
      setPassword('')
      onClose()
    } catch (error) {
      // The parent component will handle showing the error
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 relative">
        {/* The close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-sm text-gray-400 text-center mt-2">
            {isLogin 
              ? 'Sign in to access your chat history.' 
              : 'Join Eloquent AI to save your conversations and get personalized assistance.'}
          </p>
        </div>

        {/* The actual form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder={isLogin ? "Enter your password" : "Create a password (min 8 characters)"}
              minLength={isLogin ? undefined : 8}
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-xl text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium rounded-xl transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
              </>
            ) : (
              <span>{isLogin ? 'Sign in' : 'Create account'}</span>
            )}
          </button>
        </form>

        {/* The little toggle to switch between login/register */}
        <div className="mt-6 pt-6 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            {' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setEmail('')
                setPassword('')
              }}
              disabled={loading}
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors disabled:opacity-50"
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* A few feature highlights */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            <span>Save conversation history</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            <span>Access from any device</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            <span>Personalized assistance</span>
          </div>
        </div>
      </div>
    </div>
  )
} 