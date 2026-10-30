// Frontend/src/data/mockFixtures.ts
import { UserRole } from '../types/roles';

export interface DemoUserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  organization: string;
  avatar?: string;
  isDemo: true;
}

export const DEMO_USERS: Record<UserRole, DemoUserProfile> = {
  student: {
    id: 'demo-student-01',
    name: 'Alex Chen',
    email: 'alex.chen@student.skillverse.local',
    role: 'student',
    title: 'Computer Science Undergraduate',
    organization: 'Apex Institute of Technology',
    isDemo: true
  },
  college_admin: {
    id: 'demo-college-01',
    name: 'Dean Elena Rostova',
    email: 'e.rostova@apextech.edu',
    role: 'college_admin',
    title: 'Dean of Engineering & Placement Director',
    organization: 'Apex Institute of Technology',
    isDemo: true
  },
  faculty: {
    id: 'demo-faculty-01',
    name: 'Prof. Aris Thorne',
    email: 'a.thorne@apextech.edu',
    role: 'faculty',
    title: 'Associate Professor, Distributed Systems',
    organization: 'Apex Institute of Technology',
    isDemo: true
  },
  company_admin: {
    id: 'demo-company-01',
    name: 'Marcus Vance',
    email: 'marcus.v@novatech.io',
    role: 'company_admin',
    title: 'VP of Engineering & Talent Strategy',
    organization: 'NovaTech Enterprises',
    isDemo: true
  },
  recruiter: {
    id: 'demo-recruiter-01',
    name: 'Sarah Jenkins',
    email: 'sarah.j@novatech.io',
    role: 'recruiter',
    title: 'Senior Technical Talent Partner',
    organization: 'NovaTech Enterprises',
    isDemo: true
  },
  super_admin: {
    id: 'demo-admin-01',
    name: 'Morgan Blake',
    email: 'sysadmin@skillverse.io',
    role: 'super_admin',
    title: 'Principal Platform Operations Architect',
    organization: 'SkillVerse Global Infrastructure',
    isDemo: true
  }
};

export interface MockNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'alert' | 'system';
}

export const MOCK_NOTIFICATIONS: Record<UserRole, MockNotification[]> = {
  student: [
    {
      id: 'notif-s-1',
      title: 'Skill DNA Verified',
      message: 'FastAPI & PyTorch verification passed with 94% confidence score.',
      timestamp: '15m ago',
      read: false,
      type: 'success'
    },
    {
      id: 'notif-s-2',
      title: 'New AI Job Match',
      message: 'NovaTech posted "Junior ML Engineer" matching 88% of your Skill DNA.',
      timestamp: '2h ago',
      read: false,
      type: 'info'
    },
    {
      id: 'notif-s-3',
      title: 'Assessment Due Soon',
      message: 'System Architecture benchmark closes in 3 days.',
      timestamp: '1d ago',
      read: true,
      type: 'alert'
    }
  ],
  college_admin: [
    {
      id: 'notif-ca-1',
      title: 'Placement Drive Scheduled',
      message: 'NovaTech Fall Campus Drive scheduled for Nov 14 (142 students eligible).',
      timestamp: '30m ago',
      read: false,
      type: 'info'
    },
    {
      id: 'notif-ca-2',
      title: 'Curriculum Gap Detected',
      message: 'Industry demand in Docker/Kubernetes is 35% higher than cohort benchmarks.',
      timestamp: '4h ago',
      read: false,
      type: 'alert'
    }
  ],
  faculty: [
    {
      id: 'notif-f-1',
      title: 'Submissions Ready for Review',
      message: '18 students submitted their Distributed Systems Lab 3.',
      timestamp: '1h ago',
      read: false,
      type: 'info'
    },
    {
      id: 'notif-f-2',
      title: 'Mentoring Milestone',
      message: 'Alex Chen completed the Deep Learning pathway.',
      timestamp: '5h ago',
      read: true,
      type: 'success'
    }
  ],
  company_admin: [
    {
      id: 'notif-co-1',
      title: 'Requisition Approved',
      message: 'Senior Data Engineer (Req #408) has been approved and published.',
      timestamp: '2h ago',
      read: false,
      type: 'success'
    },
    {
      id: 'notif-co-2',
      title: 'Team Quota Alert',
      message: 'Technical recruiter allocation reached 92% capacity.',
      timestamp: '1d ago',
      read: true,
      type: 'alert'
    }
  ],
  recruiter: [
    {
      id: 'notif-r-1',
      title: 'Top AI Match Identified',
      message: 'Candidate Alex Chen matched 94% on Full Stack AI Engineer requisition.',
      timestamp: '10m ago',
      read: false,
      type: 'success'
    },
    {
      id: 'notif-r-2',
      title: 'Interview Confirmed',
      message: 'Technical interview scheduled with Maya Lin for tomorrow at 2:00 PM.',
      timestamp: '3h ago',
      read: false,
      type: 'info'
    }
  ],
  super_admin: [
    {
      id: 'notif-sa-1',
      title: 'FastAPI Vector Cluster Health',
      message: 'Faiss index query latency is 4.2ms across 1,240 candidate vectors.',
      timestamp: '5m ago',
      read: false,
      type: 'system'
    },
    {
      id: 'notif-sa-2',
      title: 'Audit Log Retention',
      message: 'Security log rotation completed with 0 anomalous privilege escalations.',
      timestamp: '6h ago',
      read: true,
      type: 'info'
    }
  ]
};
