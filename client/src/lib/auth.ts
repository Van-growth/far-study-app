import { supabase } from './supabase'

export const signUp = (email: string, password: string) =>
  supabase.auth.signUp({ email, password })

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getSession = () => supabase.auth.getSession()

export const onAuthChange = (
  cb: Parameters<typeof supabase.auth.onAuthStateChange>[0],
) => supabase.auth.onAuthStateChange(cb)
