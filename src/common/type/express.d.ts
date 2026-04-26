declare namespace Express {
  interface Request {
    apikey?: {
      id: string;
      workspaceId: string;
    };
  }
}
