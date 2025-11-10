// Domain types for ideas and assignments

export interface IdeaFile {
  id?: string;
  path: string;
  originalName: string;
  size?: number | null;
  mime?: string;
}

export interface Assignment {
  id: string;
  ideaId: string;
  judgeId: string;
  judge?: {
    id: string;
    user?: {
      name?: string;
      email?: string;
    };
  };
  status: "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "REVIEWED" | "LOCKED";
  submission?: {
    version: number;
    uploadedAt: string;
    downloadUrl: string;
  };
}


