import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false)   // true once initial boot is done
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    if (data) return data

    const { data: repairedProfile, error: repairError } = await supabase
      .rpc('ensure_my_profile')

    if (repairError) throw repairError
    return repairedProfile
  }

  useEffect(() => {
    async function boot() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        if (session?.user) {
          setUser(session.user)
          setProfile(await loadProfile(session.user.id))
        }
      } catch (error) {
        console.error('Could not initialize authentication:', error)
        setUser(null)
        setProfile(null)
      } finally {
        setReady(true)
      }
    }
    boot()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, _session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      }
      // Login loads the profile explicitly after sign-in. Avoid making
      // another Supabase request inside this auth callback.
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, ready, setUser, setProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
