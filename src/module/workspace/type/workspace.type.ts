export interface Workspace {
  id: string;
  userId: string;
  slug: string;
}

export interface WorkspaceResponse {
  name: string;
  slug: string;
}
export interface GetAllWorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}
