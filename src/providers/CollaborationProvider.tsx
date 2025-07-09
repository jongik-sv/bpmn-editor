import React, { createContext, useContext } from 'react';
import * as Y from 'yjs';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useYjsDocument } from '../hooks/useYjsDocument';
import { useRealtimeCollaboration } from '../hooks/useRealtimeCollaboration';
import { useAutoSave } from '../hooks/useAutoSave';
import { useDocumentLoader } from '../hooks/useDocumentLoader';
import { useAwareness } from '../hooks/useAwareness';
import { UserAwareness } from '../types/collaboration';

interface CollaborationContextType {
  // Yjs 문서
  ydoc: Y.Doc | null;
  
  // 연결 상태
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 문서 로드 상태
  isDocumentLoading: boolean;
  documentLoadError: string | null;
  hasDocumentLoaded: boolean;
  reloadDocument: () => Promise<void>;
  
  // 자동 저장 상태
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  saveNow: () => Promise<void>;
  
  // Awareness 상태
  awarenessState: Map<string, UserAwareness>;
  updateSelection: (selectedElements: string[]) => void;
  updateCursor: (x: number, y: number) => void;
  
  // Realtime 채널
  channel: RealtimeChannel | null;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within CollaborationProvider');
  }
  return context;
};

interface CollaborationProviderProps {
  children: React.ReactNode;
  documentId: string;
  userId: string;
  userName: string;
  tableName?: string;
  autoSaveDebounce?: number;
}

/**
 * 모든 협업 기능을 통합하는 메인 Provider
 */
export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({
  children,
  documentId,
  userId,
  userName,
  tableName = 'bpmn_documents',
  autoSaveDebounce = 2000
}) => {
  // Yjs 문서 생성
  const ydoc = useYjsDocument(documentId);
  
  // 문서 로드
  const { 
    isLoading: isDocumentLoading, 
    loadError: documentLoadError, 
    hasLoaded: hasDocumentLoaded,
    reloadDocument 
  } = useDocumentLoader({
    ydoc,
    documentId,
    tableName
  });
  
  // 실시간 협업 연결
  const { 
    isConnected, 
    isLoading, 
    error, 
    channel 
  } = useRealtimeCollaboration({
    ydoc,
    documentId,
    userId
  });
  
  // 자동 저장
  const { 
    isSaving, 
    lastSaved, 
    saveError, 
    saveNow 
  } = useAutoSave({
    ydoc,
    documentId,
    userId,
    debounceMs: autoSaveDebounce,
    tableName
  });
  
  // Awareness (사용자 상태 공유)
  const { 
    awarenessState, 
    updateSelection, 
    updateCursor 
  } = useAwareness({
    channel,
    userId,
    userName
  });
  
  const contextValue: CollaborationContextType = {
    // Yjs 문서
    ydoc,
    
    // 연결 상태
    isConnected,
    isLoading,
    error,
    
    // 문서 로드 상태
    isDocumentLoading,
    documentLoadError,
    hasDocumentLoaded,
    reloadDocument,
    
    // 자동 저장 상태
    isSaving,
    lastSaved,
    saveError,
    saveNow,
    
    // Awareness 상태
    awarenessState,
    updateSelection,
    updateCursor,
    
    // Realtime 채널
    channel
  };
  
  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
};