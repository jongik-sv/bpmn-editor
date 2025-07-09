// Common types for the BPMN Editor application

export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  settings?: any;
  created_at?: string;
  updated_at?: string;
}

export interface Diagram {
  id: string;
  name: string;
  description?: string;
  bpmn_xml: string;
  project_id?: string;
  folder_id?: string;
  thumbnail_url?: string;
  created_by: string;
  last_modified_by?: string;
  version?: number;
  is_active?: boolean;
  folder_path?: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Folder {
  id: string;
  name: string;
  parent_id?: string;
  project_id?: string;
  created_by: string;
  path?: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectMember {
  id: string;
  project_id?: string;
  user_id?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  invited_by?: string;
  joined_at?: string;
  invited_at?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

// Auth related types
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  display_name?: string;
}

// BPMN Editor types
export interface BpmnEditorProps {
  initialXml?: string;
  onChange?: (xml: string) => void;
  diagramId?: string;
  readOnly?: boolean;
}

// API Response types
export type ApiResponse<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: string;
}

// Supabase table types (for better type safety)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>;
      };
      diagrams: {
        Row: Diagram;
        Insert: Omit<Diagram, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Diagram, 'id' | 'created_at' | 'updated_at'>>;
      };
      folders: {
        Row: Folder;
        Insert: Omit<Folder, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Folder, 'id' | 'created_at' | 'updated_at'>>;
      };
      project_members: {
        Row: ProjectMember;
        Insert: Omit<ProjectMember, 'id' | 'joined_at' | 'invited_at'>;
        Update: Partial<Omit<ProjectMember, 'id' | 'joined_at' | 'invited_at'>>;
      };
    };
  };
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingStateWithError {
  state: LoadingState;
  error: string | null;
}

// Event types for real-time collaboration
export interface CollaborationEvent {
  type: 'cursor' | 'selection' | 'presence' | 'edit';
  userId: string;
  userName: string;
  data: any;
  timestamp: number;
}

export interface UserPresence {
  userId: string;
  userName: string;
  cursor?: {
    x: number;
    y: number;
  };
  selection?: string[];
  lastActive: number;
}

// Form types
export interface ProjectFormData {
  name: string;
  description?: string;
}

export interface DiagramFormData {
  name: string;
  description?: string;
  project_id: string;
  folder_id?: string;
}