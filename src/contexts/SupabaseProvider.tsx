import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Y from 'yjs';
// @ts-ignore
import YSupabaseProvider from 'y-supabase/dist/index.js';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';

interface SupabaseProviderContextType {
  ydoc: Y.Doc;
  provider: YSupabaseProvider | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

const SupabaseProviderContext = createContext<SupabaseProviderContextType | undefined>(undefined);

export const useSupabaseProvider = () => {
  const context = useContext(SupabaseProviderContext);
  if (!context) {
    throw new Error('useSupabaseProvider must be used within a SupabaseProviderProvider');
  }
  return context;
};

interface SupabaseProviderProviderProps {
  children: React.ReactNode;
  diagramId: string;
}

export const SupabaseProviderProvider: React.FC<SupabaseProviderProviderProps> = ({
  children,
  diagramId,
}) => {
  const { user } = useAuth();
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<YSupabaseProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !diagramId) {
      setIsLoading(false);
      return;
    }

    const initializeProvider = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Y-Supabase 프로바이더 초기화
        const supabaseProvider = new YSupabaseProvider(ydoc, supabase, {
          channel: `diagram-${diagramId}`,
          tableName: 'bpmn_documents',
          columnName: 'content',
          id: diagramId,
          resyncInterval: 30000, // 30초마다 재동기화
        });

        // 연결 상태 이벤트 리스너
        supabaseProvider.on('status', (event: any) => {
          console.log('Y-Supabase Provider Status:', event.detail);
          setIsConnected(event.detail.status === 'connected');
        });

        supabaseProvider.on('sync', (event: any) => {
          console.log('Y-Supabase Provider Sync:', event.detail);
          setIsLoading(false);
        });

        supabaseProvider.on('error', (event: any) => {
          console.error('Y-Supabase Provider Error:', event.detail);
          setError(event.detail?.message || 'Provider error occurred');
          setIsLoading(false);
        });

        setProvider(supabaseProvider);
      } catch (err) {
        console.error('Failed to initialize Y-Supabase provider:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize provider');
        setIsLoading(false);
      }
    };

    initializeProvider();

    // 클린업
    return () => {
      if (provider) {
        provider.disconnect();
      }
    };
  }, [user, diagramId]);

  return (
    <SupabaseProviderContext.Provider
      value={{
        ydoc,
        provider,
        isConnected,
        isLoading,
        error,
      }}
    >
      {children}
    </SupabaseProviderContext.Provider>
  );
};