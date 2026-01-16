export interface Job {
  id: string;
  title: string;
  company: string;
  experience: string;
  location: string;
  jdText: string;
  requiredSkills: string[];
  niceToHave: string[];
  responsibilities: string[];
  parsedSkills: string[];
  createdAt: string;
  status: 'active' | 'draft' | 'closed';
}

export interface ParsedJD {
  jobId: string;
  requiredSkills: string[];
  niceToHave: string[];
  responsibilities: string[];
  experience: string;
  summary: string;
}

export interface Project {
  title: string;
  description: string;
  tech: string[];
  evidence: string;
  duration: string;
}

export interface Candidate {
  id: string;
  name: string;
  title: string;
  experience: string;
  location: string;
  skills: Record<string, number>;
  projects: Project[];
  resumeSummary: string;
  education: string[];
  availability: string;
  lastActive: string;
  matchScore: number;
}

export interface Match {
  id: string;
  jobId: string;
  candidateId: string;
  score: number;
  skillOverlap: number;
  embeddingSimilarity: number;
  matchedSkills: string[];
  evidence: string[];
  status: 'pending' | 'reviewed' | 'contacted' | 'rejected';
  lastUpdated: string;
}

export interface Recruiter {
  id: string;
  name: string;
  email: string;
  company: string;
  jobs: string[];
}