import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/api'

const KEY = ['teachers']

export function useTeachers() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_teacher_accounts')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreateTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, password, full_name }) => {
      // Use the server-side teacher creation endpoint.
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role: 'teacher' },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useToggleTeacherActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
