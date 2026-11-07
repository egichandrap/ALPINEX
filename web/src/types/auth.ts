export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  system_role: string;
  status: string;
}

export interface ProjectItem {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  createdAt?: string;
}
