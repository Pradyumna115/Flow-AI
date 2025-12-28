export enum WorkflowStatus {
  Draft = 'Draft',
  Generated = 'Generated',
  Deployed = 'Deployed'
}

export interface WorkflowStep {
  id: string;
  action: string;
  service: string; // e.g., 'Gmail', 'Drive', 'Sheets'
}

export interface WorkflowPlan {
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  prompt: string;
  plan: WorkflowPlan | null;
  script: string | null;
  status: WorkflowStatus;
  createdAt: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export enum WizardStep {
  Describe = 0,
  Review = 1,
  Deploy = 2
}
