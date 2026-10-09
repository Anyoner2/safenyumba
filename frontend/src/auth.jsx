import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  getCurrentUser,
  getNotifications,
  getSavedProperties,
  logoutAccount,
  markAllNotificationsRead,
  saveProperty as savePropertyRequest,
  unsaveProperty as unsavePropertyRequest,
} from './api.js'

const AuthContext = createContext(null)
const tokenKey = 'safe-nyumba-token'
const userKey = 'safe-nyumba-user'

function readSavedUser() {
  if (!localStorage.getItem(tokenKey)) return null
  try {
    return JSON.parse(localStorage.getItem(userKey) || 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedUser)
  const [savedPropertyIds, setSavedPropertyIds] = useState([])
  const [notifications, setNotifications] = useState([])
  const [accountDataError, setAccountDataError] = useState('')

  useEffect(() => {
    if (!localStorage.getItem(tokenKey)) {
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

  const userId = user?.id

  useEffect(() => {
    if (!userId) return undefined

    let active = true
    async function refreshAccountData() {
      try {
        const [saved, currentNotifications] = await Promise.all([
          getSavedProperties(),
          getNotifications(),
        ])
        if (!active) return
        setSavedPropertyIds(saved.map((property) => property.id))
        setNotifications(currentNotifications)
        setAccountDataError('')
      } catch (error) {
        if (active) setAccountDataError(error.message)
      }
    }

    refreshAccountData()
    const interval = window.setInterval(refreshAccountData, 30000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [userId])

  function signIn(token, currentUser) {
    localStorage.setItem(tokenKey, token)
    localStorage.setItem(userKey, JSON.stringify(currentUser))
    setSavedPropertyIds([])
    setNotifications([])
    setAccountDataError('')
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
    setSavedPropertyIds([])
    setNotifications([])
    setAccountDataError('')
    setUser(null)
  }

  const toggleSavedProperty = useCallback(async (propertyId) => {
    const isSaved = savedPropertyIds.includes(propertyId)
    if (isSaved) {
      await unsavePropertyRequest(propertyId)
      setSavedPropertyIds((current) => current.filter((id) => id !== propertyId))
    } else {
      await savePropertyRequest(propertyId)
      setSavedPropertyIds((current) => current.includes(propertyId) ? current : [...current, propertyId])
    }
  }, [savedPropertyIds])

  const markNotificationsRead = useCallback(async () => {
    await markAllNotificationsRead()
    const readAt = new Date().toISOString()
    setNotifications((current) => current.map((notification) => ({ ...notification, read_at: notification.read_at || readAt })))
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      signIn,
      signOut,
      savedPropertyIds,
      toggleSavedProperty,
      notifications,
      markNotificationsRead,
      accountDataError,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used within AuthProvider.')
  return auth
}