import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const API_BASE = "http://localhost:5000";

async function request<T>(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init.headers||{}) } });
  if (!res.ok) { let r = ''; try { const d = await res.clone().json(); r = d?.error||d?.message||''; } catch{}; throw new Error(r || 'Request failed'); }
  const ct = res.headers.get('content-type')||''; if (ct.includes('application/json')) return res.json() as Promise<T>; return (await res.text()) as unknown as T;
}

export function useJudges() {
  return useQuery({ queryKey: ['judges'], queryFn: ()=>request<any[]>(`/api/judges`) });
}

export function useUpdateJudge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; capacity?: number | null; expertise?: string[]; name?: string; email?: string; status?: 'ACTIVE'|'INACTIVE'|'SUSPENDED' }) => {
      return request(`/api/judges/${payload.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    },
    onMutate: () => { toast.loading('Saving…', { id: 'judge-update' }); },
    onSuccess: () => { toast.success('Saved', { id: 'judge-update' }); qc.invalidateQueries({ queryKey: ['judges'] }); },
    onError: (e:any) => { toast.error(e?.message||'Save failed', { id: 'judge-update' }); }
  });
}

export function useToggleJudgeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; status: 'ACTIVE'|'INACTIVE'|'SUSPENDED' }) => {
      return request(`/api/judges/${payload.id}`, { method: 'PATCH', body: JSON.stringify({ status: payload.status }) });
    },
    onMutate: () => { toast.loading('Updating status…', { id: 'judge-status' }); },
    onSuccess: () => { toast.success('Status updated', { id: 'judge-status' }); qc.invalidateQueries({ queryKey: ['judges'] }); },
    onError: (e:any) => { toast.error(e?.message||'Update failed', { id: 'judge-status' }); },
  });
}

export function useInviteJudge() {
  return useMutation({
    mutationFn: async (payload: { name: string; email: string }) => {
      return request(`/api/judges/invite`, { method: 'POST', body: JSON.stringify(payload) });
    },
    onMutate: () => { toast.loading('Inviting…', { id: 'judge-invite' }); },
    onSuccess: () => { toast.success('Invite sent', { id: 'judge-invite' }); },
    onError: (e:any) => { toast.error(e?.message||'Invite failed', { id: 'judge-invite' }); },
  });
}

export function useJudgePerformance(id?: string) {
  return useQuery({ enabled: !!id, queryKey: ['judge-performance', id], queryFn: ()=>request(`/api/judges/${id}/performance`) });
}


