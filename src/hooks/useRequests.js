import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const KEY = ['access_requests']

export function useRequests(filters = {}) {
  const qc = useQueryClient()
  const channelRef = useRef(null)

  useEffect(() => {
    const name = `requests-${Math.random().toString(36).slice(2)}`
    channelRef.current = supabase
      .channel(name)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'access_requests' }, () => {
        qc.invalidateQueries({ queryKey: KEY })
      })
      .subscribe()
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [qc])

  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: async () => {
      let q = supabase
        .from('access_requests')
        .select('*, document_types(code, name), students(last_name, first_name, lrn), profiles!requester_id(full_name)')
        .order('created_at', { ascending: false })
      if (filters.status) q = q.eq('status', filters.status)
      if (filters.source) q = q.eq('source', filters.source)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function useMyRequests() {
  const qc = useQueryClient()
  const channelRef = useRef(null)

  useEffect(() => {
    const name = `my-requests-${Math.random().toString(36).slice(2)}`
    channelRef.current = supabase
      .channel(name)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'access_requests' }, () => {
        qc.invalidateQueries({ queryKey: [...KEY, 'mine'] })
      })
      .subscribe()
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [qc])

  return useQuery({
    queryKey: [...KEY, 'mine'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('access_requests')
        .select('*, document_types(code, name), students(last_name, first_name, lrn)')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function usePendingCount() {
  return useQuery({
    queryKey: [...KEY, 'pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('access_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      if (error) throw error
      return count ?? 0
    },
    refetchInterval: 30000,
  })
}

export function useSubmitPublicRequest() {
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.rpc('submit_public_request', {
        p_requester_name: payload.requester_name,
        p_relationship: payload.relationship || null,
        p_contact: payload.contact || null,
        p_student_lrn: payload.student_lrn,
        p_student_last_name: payload.student_last_name,
        p_document_type_id: payload.document_type_id || null,
        p_purpose: payload.purpose || null,
      })
      if (error) throw error
      return Array.isArray(data) ? data[0] : data
    },
  })
}

export function useSubmitTeacherRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('access_requests')
        .insert({ ...payload, source: 'teacher', requester_id: user.id })
        .select('reference_code')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDecideRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, release_note }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('access_requests')
        .update({ status, release_note, decided_by: user.id, decided_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export async function trackRequest(code, lastName) {
  const { data, error } = await supabase.rpc('track_request', {
    p_code: code,
    p_last_name: lastName,
  })
  if (error) throw error
  return data?.[0] ?? null
}
