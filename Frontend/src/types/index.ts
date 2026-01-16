export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Project {
  tech: any;
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  fullDescription?: string;
  technologies?: string[];
  duration?: string;
  client?: string;
  link?: string;
  challenges?: string;
  solution?: string;
  results?: string[];
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
}
