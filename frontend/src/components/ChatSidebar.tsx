import { useState, useEffect } from 'react'

type ChatSession = {
  session_id: string
  preview: string
  message_count: number
  last_activity: string
  created_at: string
}

type ChatSidebarProps = {
  isOpen: boolean
  onToggle: () => void
  currentSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewChat: () => void
  onDeleteSession: (sessionId: string) => void
  authToken: string | null
  isAuthenticated: boolean
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function ChatSidebar({ 
  isOpen, 
  onToggle, 
  currentSessionId, 
  onSelectSession, 
  onNewChat,
  onDeleteSession,
  authToken,
  isAuthenticated 
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated && authToken) {
      loadUserSessions()
    } else {
      setSessions([])
    }
  }, [isAuthenticated, authToken])

  async function loadUserSessions() {
    if (!authToken) return
    
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/sessions/my-chats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('Error loading user sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(isoDate: string) {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.round(diffMs / 1000);
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffSeconds < 60) {
      return "Just now";
    }
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  return (
    <>
      {/* Overlay for mobile view */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => onToggle()}
        />
      )}

      {/* The actual sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 
        ${isOpen ? 'w-80' : 'w-0 lg:w-0'} 
        transition-all duration-300 ease-in-out
        bg-gray-900 border-r border-gray-800
        flex flex-col overflow-hidden
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 min-h-[73px]">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggle}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors text-gray-300 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {isOpen && (
              <h2 className="text-lg font-semibold text-white">Chat History</h2>
            )}
          </div>
        </div>

        {/* The New Chat button */}
        {isOpen && (
          <div className="p-4 border-b border-gray-800">
            <button
              onClick={onNewChat}
              className="w-full flex items-center gap-3 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>New Chat</span>
            </button>
          </div>
        )}

        {/* Main Content of sidebar */}
        {isOpen && (
          <div className="flex-1 overflow-y-auto">
            {!isAuthenticated ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-white font-medium mb-2">Sign in for Chat History</h3>
                <p className="text-gray-400 text-sm">
                  Create an account to save and access your conversation history across devices.
                </p>
              </div>
            ) : loading ? (
              <div className="p-6 text-center">
                <div className="inline-flex items-center gap-2 text-gray-400">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Loading chats...</span>
                </div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-white font-medium mb-2">No conversations yet</h3>
                <p className="text-gray-400 text-sm">
                  Start a new conversation to see your chat history here.
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.session_id}
                    className={`group relative rounded-xl border transition-all ${
                      currentSessionId === session.session_id
                        ? 'bg-purple-600/10 border-purple-500/50 ring-1 ring-purple-500/30'
                        : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                    }`}
                  >
                    <button
                      onClick={() => onSelectSession(session.session_id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-medium text-sm truncate pr-2 ${
                          currentSessionId === session.session_id
                            ? 'text-purple-300'
                            : 'text-white group-hover:text-purple-300'
                        }`}>
                          {session.preview}
                        </h3>
                        {currentSessionId === session.session_id && (
                          <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {session.message_count} message{session.message_count !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(session.last_activity)}
                        </span>
                      </div>
                    </button>

                    {/* Delete button, only show for non-current sessions */}
                    {session.session_id !== currentSessionId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteSession(session.session_id)
                        }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 hover:text-red-300"
                        title="Delete conversation"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sidebar Footer */}
        {isOpen && (
          <div className="p-4 border-t border-gray-800">
            <div className="text-xs text-gray-500 text-center">
              {isAuthenticated 
                ? `${sessions.length} conversation${sessions.length !== 1 ? 's' : ''} saved`
                : 'Sign in to save conversations'
              }
            </div>
          </div>
        )}
      </div>
    </>
  )
} 