import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const KEY = ['students']

export function useStudents(search = '') {
  return useQuery({
    queryKey: [...KEY, search],
    queryFn: async () => {
      let q = supabase
        .from('students')
        .select('*')
        .order('last_name')
      if (search.trim()) {
        q = q.or(`last_name.ilike.%${search}%,first_name.ilike.%${search}%,lrn.ilike.%${search}%`)
      }
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function useStudent(id) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useUpsertStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (student) => {
      const { data, error } = await supabase
        .from('students')
        .upsert(student)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
