import { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUser, logoutAccount } from './api.js'

const AuthContext = createContext(null)
const tokenKey = 'safe-nyumba-token'
const userKey = 'safe-nyumba-user'

function readSavedUser() {
  try {
    return JSON.parse(localStorage.getItem(userKey) || 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedUser)

  useEffect(() => {
    if (!localStorage.getItem(tokenKey)) {
      setUser(null)
      localStorage.removeItem(userKey)
      return undefined
    }

    let active = true
    getCurrentUser().then((currentUser) => {
      if (active) {
        localStorage.setItem(userKey, JSON.stringify(currentUser))
        setUser(currentUser)
      }
    }).catch(() => {})

    return () => {
      active = false
    }
  }, [])

  function signIn(token, currentUser) {
    localStorage.setItem(tokenKey, token)
    localStorage.setItem(userKey, JSON.stringify(currentUser))
    setUser(currentUser)
  }

  async function signOut() {
    try {
      await logoutAccount()
    } catch {
      // Clear local auth state even if the API is unavailable.
    }
    localStorage.removeItem(tokenKey)
    localStorage.removeItem(userKey)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used within AuthProvider.')
  return auth
}