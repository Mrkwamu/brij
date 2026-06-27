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
  name: string;
  slug: string;
  createdAt: Date;
}

export interface GetWorkspaceResponse {
  name: string;
  slug: string;
  createdAt: Date;
  apis: {
    publicId: string;
    name: string;
  }[];
}
