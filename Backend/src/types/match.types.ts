
export interface CreateMatchDto {
  userId: string;
  jobId: string;
  score: number;
}

export interface UpdateMatchDto {
  score?: number;
}

export interface MatchResponse {
  id: string;
  userId: string;
  jobId: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
  job?: {
    id: string;
    title: string;
    company: {
      id: string;
      name: string;
      logo?: string;
    };
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
} 