export interface AppSettings {
  app: string;
  notes?: string;
  owner?: string;
  publicEnv?: Record<string, string>;
  secrets?: Record<string, string>;
}
