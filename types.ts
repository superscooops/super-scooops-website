
export interface ServicePlan {
  id: string;
  name: string;
  price: number;
  frequency: string;
  description: string;
  features: string[];
  color: string;
  badge?: string;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  unit?: string;
}
