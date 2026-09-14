import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const KEY = ['assignments']

/**
 * Assignments for the currently logged-in teacher.
 * An assignment is { grade_level, section } — section may be null.
 */
export function useMyAssignments() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [...KEY, profile?.id ?? null],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_assignments')
        .select('id, grade_level, section')
        .eq('teacher_id', profile.id)
        .order('grade_level')
      if (error) throw error
      return data
    },
  })
}

/** Assignments for a specific teacher (admin view). */
export function useTeacherAssignments(teacherId) {
  return useQuery({
    queryKey: [...KEY, teacherId],
    enabled: !!teacherId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_assignments')
        .select('id, grade_level, section')
        .eq('teacher_id', teacherId)
        .order('grade_level')
      if (error) throw error
      return data
    },
  })
}

export function useAddAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ teacher_id, grade_level, section }) => {
      const { error } = await supabase.from('teacher_assignments').insert({
        teacher_id,
        grade_level,
        section: section?.trim() || null,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useRemoveAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('teacher_assignments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

/** True when a student row matches any of the teacher's assignments. */
export function studentMatchesAssignments(student, assignments = []) {
  if (!student) return false
  return assignments.some(
    a =>
      a.grade_level === student.grade_level &&
      (a.section ?? '') === (student.section ?? '')
  )
}
