import { useState, useRef, useEffect } from 'react'
import AuthModal from './components/AuthModal'
import ChatSidebar from './components/ChatSidebar'
import MarkdownRenderer from './components/MarkdownRenderer'

// a couple of types we'll use
type ChatMessage = {
  role: 'user' | 'assistant'
  text: string
  timestamp?: string
}

type SessionInfo = {
  session_id: string
  is_anonymous: boolean
  created_at: string
  last_activity: string
  message_count: number
}

type User = {
  id: number
  email: string
  is_active: boolean
  created_at: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  
  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  
  // sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarKey, setSidebarKey] = useState(0) // Used to force sidebar to re-render
  const [logoutLoading, setLogoutLoading] = useState(false)
  
  // App initialization state
  const [appInitialized, setAppInitialized] = useState(false)
  const [showLandingPage, setShowLandingPage] = useState(true)
  
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // an effect to auto-scroll to the latest message
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Initialize the whole app on start
  useEffect(() => {
    initializeApp()
  }, [])

  async function initializeApp() {
    try {
      // Check for an existing auth token in localstorage
      const savedToken = localStorage.getItem('auth_token')
      if (savedToken) {
        try {
          const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${savedToken}` }
          })
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
            setAuthToken(savedToken)
          } else {
            localStorage.removeItem('auth_token')
          }
        } catch (error) {
          console.error('Error verifying token:', error)
          localStorage.removeItem('auth_token')
        }
      }
      
      // Initialize the session
      await initializeSession()
      
    } finally {
      setAppInitialized(true)
    }
  }

  async function initializeSession() {
    try {
      // Check if we have a session ID saved
      const savedSessionId = localStorage.getItem('chat_session_id')
      
      if (savedSessionId) {
        // Try to load the existing session
        const response = await fetch(`${API_BASE}/api/session/${savedSessionId}`)
        if (response.ok) {
          const sessionInfo = await response.json()
          setSessionId(savedSessionId)
          setSessionInfo(sessionInfo)
          
          // Load chat history, this also handles showing the landing page or not
          await loadChatHistory(savedSessionId)
          return
        } else {
          // The saved session doesn't exist on the server, so remove it
          localStorage.removeItem('chat_session_id')
        }
      }
      
      // If we got here, it's a new user, so create a new session
      await createNewSession()
      // createNewSession already handles showing the landing page
    } catch (error) {
      console.error('Error initializing session:', error)
    }
  }

  async function createNewSession() {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Add auth header if the user is logged in
      if (authToken && user) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const response = await fetch(`${API_BASE}/api/session/create`, {
        method: 'POST',
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        setSessionId(data.session_id)
        setSessionInfo(data.session_info)
        localStorage.setItem('chat_session_id', data.session_id)
        setMessages([]) // Clear out messages for the new session
        setError(null) // And clear any old errors
        
        // Show the landing page for any new empty sessions
        setShowLandingPage(true)
        
        // If a user is logged in, we should link the session right away
        if (authToken && user) {
          await linkSessionToUser(data.session_id, authToken)
        }
        
        // Force the sidebar to refresh so the new session appears
        setSidebarKey(prev => prev + 1)
      } else {
        console.error('Failed to create session')
      }
    } catch (error) {
      console.error('Error creating session:', error)
    }
  }

  async function loadChatHistory(sessionId: string) {
    try {
      const response = await fetch(`${API_BASE}/api/session/${sessionId}/history`)
      if (response.ok) {
        const data = await response.json()
        const messages = data.messages.map((msg: any) => ({
          role: msg.role,
          text: msg.content,
          timestamp: msg.timestamp
        }))
        setMessages(messages)
        
        // Show the landing page if and only if there are no messages
        setShowLandingPage(messages.length === 0)
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }

  async function switchToSession(newSessionId: string) {
    if (newSessionId === sessionId) return // Don't do anything if it's the same session
    
    try {
      // Load session info
      const response = await fetch(`${API_BASE}/api/session/${newSessionId}`)
      if (response.ok) {
        const sessionInfo = await response.json()
        setSessionId(newSessionId)
        setSessionInfo(sessionInfo)
        localStorage.setItem('chat_session_id', newSessionId)
        
        // Load its chat history
        await loadChatHistory(newSessionId)
        setError(null)
      }
    } catch (error) {
      console.error('Error switching session:', error)
    }
  }

  async function deleteSession(sessionIdToDelete: string) {
    try {
      const headers: Record<string, string> = {}
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const response = await fetch(`${API_BASE}/api/session/${sessionIdToDelete}`, {
        method: 'DELETE',
        headers
      })
      
      if (response.ok) {
        // If we just deleted the session we were on, we need a new one
        if (sessionIdToDelete === sessionId) {
          await createNewSession()
        }
        
        // Force the sidebar to refresh
        setSidebarKey(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || loading || !sessionId) return
    setError(null)
    setShowLandingPage(false) // Hide landing page when a chat starts

    // Optimistically append the user's message
    const newUserMessage: ChatMessage = { role: 'user', text: trimmed }
    setMessages(prev => [...prev, newUserMessage])
    setInput('')
    setLoading(true)

    try {
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      }
      
      // Add auth header if user is logged in
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          message: trimmed,
          session_id: sessionId
        })
      })

      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Request failed with ${res.status}`)
      }

      const data = await res.json()
      
      // Update the session info with new message count
      setSessionInfo((prev: SessionInfo | null) => prev ? { ...prev, message_count: prev.message_count + 2 } : null)
      
      // Add the real response from the assistant
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        text: data.response 
      }
      setMessages(prev => [...prev.slice(0, -1), newUserMessage, assistantMessage])
      
      // Force sidebar to refresh to update message counts
      setSidebarKey(prev => prev + 1)
      
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
      // If something went wrong, remove the optimistic user message
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  function startChatting() {
    setShowLandingPage(false)
  }

  async function handleLogin(email: string, password: string) {
    setAuthLoading(true)
    setAuthError(null)
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Login failed')
      }
      
      const data = await response.json()
      setUser(data.user)
      setAuthToken(data.access_token)
      localStorage.setItem('auth_token', data.access_token)
      
      // Link the current session if anonymous
      if (sessionId && sessionInfo?.is_anonymous) {
        await linkSessionToUser(sessionId, data.access_token)
      }
      
      // Force sidebar to refresh
      setSidebarKey(prev => prev + 1)
      
    } catch (error: any) {
      setAuthError(error.message)
      throw error
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleRegister(email: string, password: string) {
    setAuthLoading(true)
    setAuthError(null)
    
    try {
      const body: any = { email, password }
      if (sessionId && sessionInfo?.is_anonymous) {
        body.session_id = sessionId
      }
      
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Registration failed')
      }
      
      const data = await response.json()
      setUser(data.user)
      setAuthToken(data.access_token)
      localStorage.setItem('auth_token', data.access_token)
      
      // Update the session info to show it's now linked to an account
      if (sessionInfo) {
        setSessionInfo({ ...sessionInfo, is_anonymous: false })
      }
      
      // Force sidebar to refresh
      setSidebarKey(prev => prev + 1)
      
    } catch (error: any) {
      setAuthError(error.message)
      throw error
    } finally {
      setAuthLoading(false)
    }
  }

  async function linkSessionToUser(sessionId: string, token: string) {
    try {
      const response = await fetch(`${API_BASE}/api/auth/link-session`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ session_id: sessionId })
      })
      
      if (response.ok) {
        // Update session info locally to show its linked
        if (sessionInfo) {
          setSessionInfo({ ...sessionInfo, is_anonymous: false })
        }
        console.log('Session successfully linked to user')
        return true
      } else {
        // Log the error but don't blow up, session linking isn't super critical
        const errorData = await response.json().catch(() => ({}))
        console.warn('Failed to link session to user:', errorData.detail || 'Unknown error')
        return false
      }
    } catch (error) {
      console.warn('Error linking session to user:', error)
      return false
    }
  }

  async function handleLogout() {
    setLogoutLoading(true)
    try {
      // First, make sure the current session is linked to the user
      // if it exists and has messages in it
      if (authToken && sessionId && sessionInfo && sessionInfo.message_count > 0) {
        console.log('Saving current chat to your account...')
        await linkSessionToUser(sessionId, authToken)
      }
      
      // Clear out all the auth state
      setUser(null)
      setAuthToken(null)
      localStorage.removeItem('auth_token')
      setSidebarOpen(false) // Close sidebar
      
      // Create a new anonymous session so the user can keep chatting
      await createNewSession()
      
      // Force sidebar to refresh to clear the old chat list
      setSidebarKey(prev => prev + 1)
      
      console.log('Successfully logged out and started new session')
      
    } catch (error) {
      console.error('Error during logout:', error)
      
      // Even if there's an error, we still want to log the user out on the frontend
      setUser(null)
      setAuthToken(null)
      localStorage.removeItem('auth_token')
      setSidebarOpen(false)
      
      // And give them a new session
      await createNewSession()
      setSidebarKey(prev => prev + 1)
    } finally {
      setLogoutLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex overflow-hidden">
      {!appInitialized ? (
        // A little loading screen
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="text-gray-400 text-sm">Loading Ellie...</div>
          </div>
        </div>
      ) : (
        <>
          {/* the sidebar */}
          <ChatSidebar
            key={sidebarKey}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            currentSessionId={sessionId}
            onSelectSession={switchToSession}
            onNewChat={createNewSession}
            onDeleteSession={deleteSession}
            authToken={authToken}
            isAuthenticated={!!user}
          />
          
          {/* main content area */}
          <div className="flex-1 flex flex-col min-w-0 relative">
            {/* Page Header */}
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur supports-[backdrop-filter]:bg-gray-900/80">
              <div className="flex items-center justify-between px-6 py-4">
                {/* left side of header */}
                <div className="flex items-center gap-4">
                  {/* sidebar toggle, only shows when sidebar is closed */}
                  {!sidebarOpen && (
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors text-gray-300 hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  )}
                  
                  <div>
                    <h1 className="text-xl font-semibold text-white">Eloquent AI</h1>
                    <p className="text-xs text-gray-400">Intelligent Financial Assistant</p>
                  </div>
                </div>

                {/* right side of header */}
                <div className="flex items-center gap-4">
                  {/* Session status info */}
                  {sessionInfo && (
                    <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-gray-800/50 rounded-full px-3 py-1.5">
                      <div className={`w-2 h-2 rounded-full ${sessionInfo.is_anonymous ? 'bg-yellow-500' : 'bg-green-500'}`} />
                      <span>{sessionInfo.message_count} messages</span>
                      <span>•</span>
                      <span>{sessionInfo.is_anonymous ? 'Anonymous' : 'Registered'}</span>
                    </div>
                  )}

                  {/* Auth section */}
                  {user ? (
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium text-white">{user.email}</div>
                        <div className="text-xs text-gray-400">Premium User</div>
                      </div>
                      <button
                        onClick={() => handleLogout()}
                        disabled={logoutLoading}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {logoutLoading ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.646 9.646 8.003 8.003 0 0019.793 16m0 0A8.001 8.001 0 0021 12a8 8 0 00-2.647-5.949m0 0A50.005 50.005 0 0019 12c0-2.633.253-5.163.72-7.5" />
                          </svg>
                        ) : (
                          'Logout'
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>
        </header>

            {/* where the messages go */}
            <main className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-950 to-gray-900">
              <div className="max-w-4xl mx-auto px-4 py-6">
                {showLandingPage && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
                    <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-6">
                      <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Chat with Ellie</h2>
                    <p className="text-gray-400 mb-8 max-w-md">
                      I'm your friendly AI assistant from Eloquent AI. <br /> Ask me anything about our services to get started.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                      <button
                        onClick={() => {
                          setInput("How do I create a new account?")
                          startChatting()
                        }}
                        className="p-4 text-left bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700 transition-colors group"
                      >
                        <div className="text-white font-medium mb-1 group-hover:text-purple-400">Account Setup</div>
                        <div className="text-gray-400 text-sm">How do I create a new account?</div>
                      </button>
                      <button
                        onClick={() => {
                          setInput("What documents do I need for verification?")
                          startChatting()
                        }}
                        className="p-4 text-left bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700 transition-colors group"
                      >
                        <div className="text-white font-medium mb-1 group-hover:text-purple-400">Verification</div>
                        <div className="text-gray-400 text-sm">What documents do I need?</div>
                      </button>
                      <button
                        onClick={() => {
                          setInput("What are the different account types?")
                          startChatting()
                        }}
                        className="p-4 text-left bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700 transition-colors group"
                      >
                        <div className="text-white font-medium mb-1 group-hover:text-purple-400">Account Types</div>
                        <div className="text-gray-400 text-sm">What are the different options?</div>
                      </button>
                      <button
                        onClick={() => {
                          setInput("How long does verification take?")
                          startChatting()
                        }}
                        className="p-4 text-left bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700 transition-colors group"
                      >
                        <div className="text-white font-medium mb-1 group-hover:text-purple-400">Processing Time</div>
                        <div className="text-gray-400 text-sm">How long does verification take?</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* The actual chat messages, only show if not on landing page */}
                {(!showLandingPage || messages.length > 0) && (
                  <div className="space-y-6">
                    {messages.map((message, idx) => (
                      <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          {/* User/bot avatar */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            message.role === 'user' 
                              ? 'bg-purple-600' 
                              : 'bg-gray-700'
                          }`}>
                            {message.role === 'user' ? (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            )}
                          </div>

                          {/* The message bubble */}
                          <div className={`rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-800 text-gray-100 border border-gray-700'
                          }`}>
                            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                              {message.role === 'assistant' ? (
                                <MarkdownRenderer>{message.text}</MarkdownRenderer>
                              ) : (
                                message.text
                              )}
                            </div>
                          </div>
                        </div>
            </div>
          ))}

          {loading && (
                      <div className="flex justify-start">
                        <div className="flex gap-3 max-w-3xl">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                              </div>
                              <span className="text-sm text-gray-400">Thinking...</span>
                            </div>
                          </div>
                        </div>
            </div>
          )}

          {error && (
                      <div className="flex justify-center">
                        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-xl text-sm">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Error: {error}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
          )}

          <div ref={endRef} />
              </div>
        </main>

            {/* The text input area */}
            <div className="border-t border-gray-800 bg-gray-900/50 backdrop-blur supports-[backdrop-filter]:bg-gray-900/80">
              <div className="max-w-4xl mx-auto p-4">
                <form onSubmit={sendMessage} className="flex gap-3">
                  <div className="flex-1 relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask me anything about fintech..."
                      disabled={!sessionId} // Only disable if no session, but allow typing while loading
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed pr-12"
          />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !input.trim() || !sessionId}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium rounded-xl transition-colors disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="hidden sm:inline">Sending...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
          </button>
        </form>
      </div>
            </div>
          </div>

          {/* The auth modal */}
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => {
              setShowAuthModal(false)
              setAuthError(null)
            }}
            onLogin={handleLogin}
            onRegister={handleRegister}
            loading={authLoading}
            error={authError}
          />
        </>
      )}
    </div>
  )
}

export default App
