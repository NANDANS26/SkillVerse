import { ParsedJD } from '../interfaces/ParsedJD'

export const parsedJDs: ParsedJD[] = [
  {
    jobId: '1',
    requiredSkills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL'],
    niceToHave: ['Node.js', 'AWS', 'Docker', 'Testing'],
    responsibilities: [
      'Develop and maintain responsive web applications',
      'Collaborate with designers and backend engineers',
      'Write clean, maintainable code with tests',
      'Optimize applications for performance',
      'Participate in code reviews'
    ],
    experience: '5+ years in frontend development',
    summary: 'Senior role requiring extensive React and TypeScript experience for building enterprise-grade applications.',
    salaryRange: '$120,000 - $150,000',
    education: ['BS in Computer Science or related field']
  },
  {
    jobId: '2',
    requiredSkills: ['Node.js', 'React', 'TypeScript', 'AWS', 'PostgreSQL'],
    niceToHave: ['Docker', 'GraphQL', 'Microservices', 'CI/CD'],
    responsibilities: [
      'Design and develop full-stack applications',
      'Implement RESTful APIs',
      'Deploy and maintain cloud infrastructure',
      'Collaborate with product team on feature development'
    ],
    experience: '3+ years full-stack development',
    summary: 'Versatile full-stack role requiring both frontend and backend expertise.',
    salaryRange: '$110,000 - $140,000',
    education: ['BS/MS in Computer Science']
  }
]