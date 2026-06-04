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

export interface GetWorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  apis: {
    id: string;
    name: string;
  }[];
}
