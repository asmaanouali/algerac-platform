import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertRequest, type AccreditationRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Helper for workflow API calls
async function workflowFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erreur ${res.status}`);
  }
  return res.json().catch(() => null);
}

export function useRequests() {
  return useQuery({
    queryKey: [api.requests.list.path],
    queryFn: async () => {
      const res = await fetch(api.requests.list.path);
      if (!res.ok) throw new Error("Failed to fetch requests");
      return api.requests.list.responses[200].parse(await res.json());
    },
  });
}

export function useRequest(id: number) {
  return useQuery({
    queryKey: [api.requests.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.requests.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch request");
      return api.requests.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertRequest) => {
      const res = await fetch(api.requests.create.path, {
        method: api.requests.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.requests.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create request");
      }
      return api.requests.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.requests.list.path] });
      toast({
        title: "Demande créée",
        description: "Votre demande d'accréditation a été soumise avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ── Workflow transition hooks ──────────────────────────────────────────

function useWorkflowMutation(successMessage: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.requests.list.path] });
      toast({ title: "Succès", description: successMessage });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" as const });
    },
  };
}

export function useSubmitRequest() {
  const callbacks = useWorkflowMutation("Demande soumise avec succès");
  return useMutation({
    mutationFn: (requestId: number) =>
      workflowFetch(`/api/workflow/requests/${requestId}/submit`, { method: "POST" }),
    ...callbacks,
  });
}

export function useAssignToRA() {
  const callbacks = useWorkflowMutation("Demande assignée au RA");
  return useMutation({
    mutationFn: ({ requestId, raId }: { requestId: number; raId: number }) =>
      workflowFetch(`/api/workflow/requests/${requestId}/assign`, {
        method: "POST",
        body: JSON.stringify({ raId }),
      }),
    ...callbacks,
  });
}

export function useFeasibilityDecision() {
  const callbacks = useWorkflowMutation("Décision de recevabilité enregistrée");
  return useMutation({
    mutationFn: ({ requestId, ...data }: { requestId: number; decision: string; comments?: string; rejectionReason?: string }) =>
      workflowFetch(`/api/workflow/requests/${requestId}/feasibility`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...callbacks,
  });
}

export function useUpdateRequestStatus() {
  const callbacks = useWorkflowMutation("Statut mis à jour");
  return useMutation({
    mutationFn: ({ requestId, status, step }: { requestId: number; status: string; step?: string }) =>
      workflowFetch(`/api/workflow/requests/${requestId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, step }),
      }),
    ...callbacks,
  });
}

export function useSendQuotationToDAG() {
  const callbacks = useWorkflowMutation("Devis envoyé au DAG");
  return useMutation({
    mutationFn: (quotationId: number) =>
      workflowFetch(`/api/quotations/${quotationId}/send-to-dag`, { method: "POST" }),
    ...callbacks,
  });
}

export function useValidateTeam() {
  const callbacks = useWorkflowMutation("Réponse enregistrée");
  return useMutation({
    mutationFn: ({ teamId, ...data }: { teamId: number; validated: boolean; recusedMemberIds?: number[]; recusationReason?: string; dateAccepted?: boolean }) =>
      workflowFetch(`/api/workflow/teams/${teamId}/oec-response`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...callbacks,
  });
}

export function useSubmitActionPlan() {
  const callbacks = useWorkflowMutation("Plan d'action soumis");
  return useMutation({
    mutationFn: ({ gapId, ...data }: { gapId: number; proposedAction: string; deadline: string; evidence?: string }) =>
      workflowFetch(`/api/workflow/gaps/${gapId}/action-plan`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...callbacks,
  });
}

export function useRecordCASDecision() {
  const callbacks = useWorkflowMutation("Décision CAS enregistrée");
  return useMutation({
    mutationFn: ({ requestId, ...data }: { requestId: number; decisionType: string; justification: string; scope?: string }) =>
      workflowFetch(`/api/accreditation-delivery/requests/${requestId}/cas-decision`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...callbacks,
  });
}

export interface WorkflowProgress {
  requestId: number;
  referenceNumber: string;
  status: string;
  progress: number;
  phase: string;
  phaseLabel: string;
  stepLabel: string;
  currentPhase: string;
  currentStep: string;
  nextAction: string;
  pendingWith: string;
}

export function useWorkflowProgress(requestId: number | undefined) {
  return useQuery<WorkflowProgress>({
    queryKey: ["/api/workflow/progress", requestId],
    queryFn: () => workflowFetch(`/api/workflow/progress/${requestId}`),
    enabled: !!requestId,
  });
}
