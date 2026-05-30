export interface SubscriptionPlan {
  id?: string;
  name: string;
  code: string;
  monthlyPrice: number;
  yearlyPrice: number;
  employeeLimit: number;
  storageLimit: number;
  modules: {
    recruitment: boolean;
    onboarding: boolean;
    payroll: boolean;
    performance: boolean;
    learning: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
