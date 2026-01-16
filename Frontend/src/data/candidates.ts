import { Candidate } from '../interfaces/Candidate'

export const candidates: Candidate[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    title: 'Senior Frontend Engineer',
    experience: '6 years',
    contact: '+1 (555) 123-4567',
    email: 'alex.johnson@example.com',
    location: 'San Francisco, CA',
    skills: {
      'React': 95,
      'TypeScript': 90,
      'Next.js': 85,
      'Tailwind CSS': 92,
      'GraphQL': 75,
      'Node.js': 70
    },
    projects: [
      {
        title: 'E-commerce Platform',
        description: 'Built a scalable e-commerce platform with real-time inventory management',
        tech: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
        evidence: 'Increased conversion by 35% through performance optimizations',
        duration: '2 years'
      },
      {
        title: 'AI Dashboard',
        description: 'Developed a comprehensive dashboard for AI model monitoring and analytics',
        tech: ['Next.js', 'Recharts', 'FastAPI', 'PostgreSQL'],
        evidence: 'Reduced data processing time by 60% through optimized queries',
        duration: '1.5 years'
      }
    ],
    resumeSummary: 'Experienced frontend engineer with 6+ years building scalable web applications. Passionate about clean code, performance optimization, and mentoring junior developers.',
    education: ['BS Computer Science, Stanford University'],
    availability: 'Immediately',
    salaryExpectation: '$130,000 - $150,000'
  },
  {
    id: '2',
    name: 'Sarah Chen',
    title: 'Full Stack Developer',
    experience: '4 years',
    contact: '+1 (555) 987-6543',
    email: 'sarah.chen@example.com',
    location: 'New York, NY',
    skills: {
      'Python': 88,
      'Django': 85,
      'React': 82,
      'AWS': 78,
      'Docker': 80,
      'PostgreSQL': 85
    },
    projects: [
      {
        title: 'Healthcare Analytics Platform',
        description: 'Developed a HIPAA-compliant healthcare data analytics platform',
        tech: ['Python', 'Django', 'React', 'AWS'],
        evidence: 'Processed 1M+ patient records while maintaining 99.9% uptime',
        duration: '2 years'
      }
    ],
    resumeSummary: 'Versatile full-stack developer with expertise in Python and modern JavaScript frameworks. Strong background in healthcare tech and data security.',
    education: ['MS Software Engineering, MIT'],
    availability: '2 weeks notice',
    salaryExpectation: '$110,000 - $135,000'
  },
  {
    id: '3',
    name: 'Marcus Rodriguez',
    title: 'DevOps Engineer',
    experience: '5 years',
    contact: '+1 (555) 456-7890',
    email: 'marcus.rodriguez@example.com',
    location: 'Austin, TX',
    skills: {
      'Kubernetes': 92,
      'AWS': 90,
      'Terraform': 85,
      'Docker': 88,
      'Linux': 90,
      'CI/CD': 87
    },
    projects: [
      {
        title: 'Cloud Migration Project',
        description: 'Led migration of legacy infrastructure to AWS with zero downtime',
        tech: ['AWS', 'Kubernetes', 'Terraform', 'Ansible'],
        evidence: 'Reduced infrastructure costs by 40% through optimization',
        duration: '1 year'
      }
    ],
    resumeSummary: 'DevOps specialist with extensive experience in cloud infrastructure and automation. Passionate about scalable systems and site reliability.',
    education: ['BS Information Technology, UT Austin'],
    availability: 'Immediately',
    salaryExpectation: '$140,000 - $165,000'
  },
  {
    id: '4',
    name: 'Priya Sharma',
    title: 'UI/UX Designer',
    experience: '4 years',
    contact: '+1 (555) 234-5678',
    email: 'priya.sharma@example.com',
    location: 'Seattle, WA',
    skills: {
      'Figma': 95,
      'Adobe XD': 90,
      'User Research': 88,
      'Prototyping': 92,
      'Design Systems': 85,
      'HTML/CSS': 80
    },
    projects: [
      {
        title: 'Design System Implementation',
        description: 'Created comprehensive design system used by 50+ developers',
        tech: ['Figma', 'Storybook', 'React'],
        evidence: 'Increased development speed by 30% and improved consistency',
        duration: '1.5 years'
      }
    ],
    resumeSummary: 'Creative UI/UX designer with a focus on user-centered design and accessibility. Experience in enterprise applications and mobile design.',
    education: ['BFA Graphic Design, RISD'],
    availability: '1 month notice',
    salaryExpectation: '$95,000 - $120,000'
  },
  {
    id: '5',
    name: 'James Wilson',
    title: 'Data Scientist',
    experience: '5 years',
    contact: '+1 (555) 345-6789',
    email: 'james.wilson@example.com',
    location: 'Boston, MA',
    skills: {
      'Python': 92,
      'Machine Learning': 88,
      'TensorFlow': 85,
      'SQL': 90,
      'Data Visualization': 82,
      'Statistics': 90
    },
    projects: [
      {
        title: 'Predictive Maintenance System',
        description: 'Developed ML models for predictive maintenance in manufacturing',
        tech: ['Python', 'TensorFlow', 'Scikit-learn', 'PostgreSQL'],
        evidence: 'Reduced equipment downtime by 45% through accurate predictions',
        duration: '2 years'
      }
    ],
    resumeSummary: 'Data scientist with strong background in machine learning and statistical analysis. Experience in manufacturing and finance domains.',
    education: ['PhD Data Science, Harvard University'],
    availability: '3 weeks notice',
    salaryExpectation: '$145,000 - $170,000'
  }
]