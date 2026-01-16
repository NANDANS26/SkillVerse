export interface Match {
  jobId: string;
  candidateId: string;
  score: number;
  matchedSkills: string[];
  evidence: string[];
  status: 'pending' | 'reviewed' | 'contacted' | 'rejected';
  lastUpdated: string;
}