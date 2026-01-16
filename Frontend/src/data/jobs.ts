import { Job } from '../interfaces/Job'

export const jobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    experience: '5+ years',
    location: 'Remote, Worldwide',
    jdText: 'We are looking for an experienced Frontend Developer with strong React and TypeScript skills. You will be responsible for building modern, responsive web applications using cutting-edge technologies.',
    createdAt: '2024-01-15',
    salary: '$120,000 - $150,000',
    type: 'Full-time',
    department: 'Engineering'
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    experience: '3+ years',
    location: 'San Francisco, CA',
    jdText: 'Join our dynamic team to develop scalable web applications. Experience with Node.js, React, and cloud services required.',
    createdAt: '2024-01-10',
    salary: '$110,000 - $140,000',
    type: 'Full-time',
    department: 'Product Development'
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    experience: '4+ years',
    location: 'Remote, US',
    jdText: 'Looking for a DevOps Engineer to manage our cloud infrastructure and CI/CD pipelines. Kubernetes and AWS experience required.',
    createdAt: '2024-01-05',
    salary: '$130,000 - $160,000',
    type: 'Full-time',
    department: 'Platform'
  },
  {
    id: '4',
    title: 'UI/UX Designer',
    experience: '3+ years',
    location: 'New York, NY',
    jdText: 'Creative designer needed to create beautiful and functional user interfaces for our enterprise applications.',
    createdAt: '2024-01-02',
    salary: '$90,000 - $120,000',
    type: 'Full-time',
    department: 'Design'
  },
  {
    id: '5',
    title: 'Data Scientist',
    experience: '4+ years',
    location: 'Boston, MA',
    jdText: 'Work with large datasets to build predictive models and provide data-driven insights for business decisions.',
    createdAt: '2023-12-28',
    salary: '$140,000 - $170,000',
    type: 'Full-time',
    department: 'Data Science'
  }
]