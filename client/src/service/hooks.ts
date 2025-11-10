// Service hooks for assignments and ideas
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import type { Assignment } from "../types/domain";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!res.ok) {
    let reason = "";
    try {
      const d = await res.clone().json();
      reason = d?.error || d?.message || "";
    } catch {}
    throw new Error(`${res.status} ${res.statusText}${reason ? ` - ${reason}` : ""}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  return (await res.text()) as unknown as T;
}

export function useIdeaAssignments(ideaId?: string) {
  return useQuery({
    enabled: !!ideaId,
    queryKey: ["idea-assignments", ideaId],
    queryFn: () =>
      request<{ assignments: Assignment[]; maxJudges: number }>(
        `/api/ideas/${ideaId}/assignments`
      ),
  });
}

export function useManualAssign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { ideaId: string; judgeIds: string[] }) => {
      return request(`/api/ideas/${payload.ideaId}/assignments`, {
        method: "POST",
        body: JSON.stringify({ judgeIds: payload.judgeIds }),
      });
    },
    onSuccess: () => {
      message.success("Judges assigned successfully");
      qc.invalidateQueries({ queryKey: ["idea-assignments"] });
    },
    onError: (err: any) => {
      message.error(err?.message || "Assignment failed");
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; ideaId: string }) => {
      return request(`/api/ideas/${payload.ideaId}/assignments/${payload.id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      message.success("Assignment removed");
      qc.invalidateQueries({ queryKey: ["idea-assignments"] });
    },
    onError: (err: any) => {
      message.error(err?.message || "Delete failed");
    },
  });
}

export function useLockAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; ideaId: string }) => {
      return request(`/api/ideas/${payload.ideaId}/assignments/${payload.id}/lock`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      message.success("Assignment locked");
      qc.invalidateQueries({ queryKey: ["idea-assignments"] });
    },
    onError: (err: any) => {
      message.error(err?.message || "Lock failed");
    },
  });
}

type AdminJudge = {
  id: string;
  user?: {
    name?: string;
    email?: string;
  };
  capacity?: number | null;
};

export function useAdminJudges() {
  return useQuery({
    queryKey: ["admin-judges"],
    queryFn: () =>
      request<{ items: AdminJudge[] }>(`/api/judges`).then((data) => {
        // If data is an array, wrap it in items
        if (Array.isArray(data)) {
          return { items: data };
        }
        return data;
      }),
  });
}

