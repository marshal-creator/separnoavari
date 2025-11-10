import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { type Assignment } from "./index";
import { type Idea } from "./index";
import { type Judge } from "./index";

const API_BASE = "http://localhost:5000";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!res.ok) {
    let reason = "";
    try { const d = await res.clone().json(); reason = d?.error || d?.message || ""; } catch {}
    throw new Error(`${res.status} ${res.statusText}${reason ? ` - ${reason}` : ""}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  return (await res.text()) as unknown as T;
}

export function useAssignments() {
  return useQuery({ queryKey: ["assignments"], queryFn: () => request<Assignment[]>("/api/assignments") });
}

export function useAssignmentDetail(id?: string) {
  return useQuery({ enabled: !!id, queryKey: ["assignments", id], queryFn: () => request(`/api/assignments/${id}`) });
}

export function useAssignJudges() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { assignmentId: string; judgeIds: string[] }) => {
      return await request(`/api/assignments/${payload.assignmentId}/assign`, {
        method: "POST",
        body: JSON.stringify({ judgeIds: payload.judgeIds }),
      });
    },
    onMutate: () => { toast.loading("Assigning…", { id: "assign" }); },
    onSuccess: () => { toast.success("Assigned", { id: "assign" }); qc.invalidateQueries({ queryKey: ["assignments"] }); },
    onError: (e: any) => { toast.error(e?.message || "Assign failed", { id: "assign" }); },
  });
}

export function useUnassignJudges() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { assignmentId: string; judgeIds: string[] }) => {
      return await request(`/api/assignments/${payload.assignmentId}/unassign`, {
        method: "POST",
        body: JSON.stringify({ judgeIds: payload.judgeIds }),
      });
    },
    onMutate: () => { toast.loading("Unassigning…", { id: "unassign" }); },
    onSuccess: () => { toast.success("Unassigned", { id: "unassign" }); qc.invalidateQueries({ queryKey: ["assignments"] }); },
    onError: (e: any) => { toast.error(e?.message || "Unassign failed", { id: "unassign" }); },
  });
}

export function useUploadBrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { assignmentId: string; file: File }) => {
      const form = new FormData();
      form.append("file", payload.file);
      const res = await fetch(`${API_BASE}/api/assignments/${payload.assignmentId}/brief`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onMutate: () => { toast.loading("Uploading…", { id: "upload" }); },
    onSuccess: () => { toast.success("Uploaded", { id: "upload" }); qc.invalidateQueries({ queryKey: ["assignments"] }); },
    onError: (e: any) => { toast.error(e?.message || "Upload failed", { id: "upload" }); },
  });
}

export function useRemoveBrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      return await request(`/api/assignments/${assignmentId}/brief`, { method: "DELETE" });
    },
    onMutate: () => { toast.loading("Removing…", { id: "remove-brief" }); },
    onSuccess: () => { toast.success("Removed", { id: "remove-brief" }); qc.invalidateQueries({ queryKey: ["assignments"] }); },
    onError: (e: any) => { toast.error(e?.message || "Remove failed", { id: "remove-brief" }); },
  });
}

export function useAutoAssign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return await request(`/api/assignments/auto-assign`, { method: "POST" });
    },
    onMutate: () => { toast.loading("Auto-assigning…", { id: "auto-assign" }); },
    onSuccess: () => { toast.success("Auto-assigned", { id: "auto-assign" }); qc.invalidateQueries({ queryKey: ["assignments"] }); },
    onError: (e: any) => { toast.error(e?.message || "Auto-assign failed", { id: "auto-assign" }); },
  });
}


