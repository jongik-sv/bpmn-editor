/**
 * 협업 상태 관련 타입 정의
 */

export interface CollaborationState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  onlineUsers: Map<string, UserAwareness>;
}

export interface UserAwareness {
  userId: string;
  userName: string;
  userColor: string;
  selectedElements: string[];
  timestamp: number;
}

export interface YjsUpdate {
  update: number[]; // Uint8Array를 배열로 직렬화
  origin: string;
  timestamp: number;
}

export interface RealtimeMessage {
  type: 'yjs-update' | 'awareness-update';
  payload: YjsUpdate | UserAwareness;
}

export interface CollaborationConfig {
  documentId: string;
  userId: string;
  userName: string;
  tableName?: string;
  channelName?: string;
}