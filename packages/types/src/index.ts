export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  domainLock?: string;
  createdAt: string;
}

export interface CandidateApplication {
  id: string;
  organizationId: string;
  jobPostingId: string;
  candidateProfileId: string;
  currentStage: 'screening' | 'technical' | 'coding' | 'hr' | 'synthesis' | 'completed' | 'rejected';
  stageStatus: 'pending' | 'in_progress' | 'passed' | 'rejected';
  createdAt: string;
}
