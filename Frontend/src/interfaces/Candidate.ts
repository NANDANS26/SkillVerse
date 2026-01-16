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
  contact: string;
  email: string;
  location: string;
  skills: Record<string, number>;
  projects: Project[];
  resumeSummary: string;
  education: string[];
  availability: string;
  salaryExpectation: string;
}