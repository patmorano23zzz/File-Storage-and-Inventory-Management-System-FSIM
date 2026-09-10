import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const KEY = ['documents']

export function useDocuments(studentId) {
  return useQuery({
    queryKey: [...KEY, studentId],
    queryFn: async () => {
      let q = supabase
        .from('documents')
        .select('*, document_types(code, name), profiles(full_name)')
        .order('created_at', { ascending: false })
      if (studentId) q = q.eq('student_id', studentId)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function useAllDocuments(search = '') {
  return useQuery({
    queryKey: [...KEY, 'all', search],
    queryFn: async () => {
      let q = supabase
        .from('documents')
        .select('*, document_types(code, name), students(last_name, first_name, lrn), profiles(full_name)')
        .order('created_at', { ascending: false })
      if (search.trim()) {
        q = q.ilike('title', `%${search}%`)
      }
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: ['document_types'],
    queryFn: async () => {
      const { data, error } = await supabase.from('document_types').select('*').order('name')
      if (error) throw error
      return data
    },
    staleTime: Infinity,
  })
}

export function useUploadDocument() {
  const qc = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async ({ file, studentId, typeId, title, schoolYear, gradeLevel, isClassified }) => {
      const ext = file.name.split('.').pop()
      const path = `${studentId}/${Date.now()}_${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('student-files')
        .upload(path, file, { contentType: file.type })
      if (uploadError) throw uploadError

      const { error: dbError } = await supabase.from('documents').insert({
        student_id: studentId,
        type_id: typeId,
        title,
        school_year: schoolYear,
        grade_level: gradeLevel,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        uploaded_by: profile?.id,
        is_classified: isClassified,
      })
      if (dbError) throw dbError
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, storagePath }) => {
      await supabase.storage.from('student-files').remove([storagePath])
      const { error } = await supabase.from('documents').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export async function getSignedUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from('student-files')
    .createSignedUrl(storagePath, 60) // 60s expiry
  if (error) throw error
  return data.signedUrl
}
