import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useAuditLogs(limit = 50) {
  return useQuery({
    queryKey: ['audit_logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data
    },
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      const [students, documents, pending, requests] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('documents').select('id', { count: 'exact', head: true }),
        supabase.from('access_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('access_requests').select('id', { count: 'exact', head: true }),
      ])
      return {
        students: students.count ?? 0,
        documents: documents.count ?? 0,
        pendingRequests: pending.count ?? 0,
        totalRequests: requests.count ?? 0,
      }
    },
  })
}
