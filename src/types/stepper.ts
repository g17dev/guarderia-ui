export type StepStatus = 'pending' | 'current' | 'completed';

export interface Step {
  title: string;
  status: StepStatus;
}