import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import * as Y from 'yjs';
import { supabase } from '../config/supabase';
import type { YjsUpdate } from '../types/collaboration';

interface UseRealtimeCollaborationProps {
  ydoc: Y.Doc | null;
  documentId: string;
  userId: string;
}

/**
 * Supabase Realtime을 통한 Yjs 문서 실시간 동기화 훅
 */
export const useRealtimeCollaboration = ({
  ydoc,
  documentId,
  userId,
}: UseRealtimeCollaborationProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  useEffect(() => {
    if (!ydoc || !documentId || !userId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Realtime 채널 생성
    const channel = supabase.channel(`document-${documentId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: userId }
      }
    });
    
    channelRef.current = channel;
    
    // Y.Doc 업데이트 리스너
    const handleYjsUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote') return; // 원격 업데이트는 무시
      
      console.log('Sending Yjs update:', { documentId, origin: userId });
      
      // Realtime으로 업데이트 전송
      channel.send({
        type: 'broadcast',
        event: 'yjs-update',
        payload: {
          update: Array.from(update), // Uint8Array를 배열로 직렬화
          origin: userId,
          timestamp: Date.now()
        } as YjsUpdate
      });
    };
    
    // Realtime 메시지 수신 리스너
    channel.on('broadcast', { event: 'yjs-update' }, (payload: { payload: YjsUpdate }) => {
      const updateData = payload.payload;
      
      if (updateData.origin === userId) return; // 자신의 업데이트는 무시
      
      console.log('Received Yjs update:', { documentId, origin: updateData.origin });
      
      try {
        const update = new Uint8Array(updateData.update);
        Y.applyUpdate(ydoc, update, 'remote');
      } catch (error) {
        console.error('Failed to apply Yjs update:', error);
      }
    });
    
    // 연결 상태 관리
    channel.on('presence', { event: 'sync' }, () => {
      console.log('Presence sync:', documentId);
      setIsConnected(true);
      setIsLoading(false);
    });
    
    channel.on('presence', { event: 'join' }, ({ key, newPresences }: { key: string, newPresences: unknown }) => {
      console.log('User joined:', key, newPresences);
    });
    
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }: { key: string, leftPresences: unknown }) => {
      console.log('User left:', key, leftPresences);
    });
    
    // 채널 구독
    channel.subscribe(async (status: string) => {
      console.log('Channel subscription status:', status);
      
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setIsLoading(false);
        
        // 현재 사용자 presence 전송
        try {
          await channel.track({
            userId,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('Failed to track presence:', error);
        }
      } else if (status === 'CHANNEL_ERROR') {
        setError('실시간 연결에 실패했습니다.');
        setIsLoading(false);
        setIsConnected(false);
      } else if (status === 'TIMED_OUT') {
        setError('연결 시간이 초과되었습니다.');
        setIsLoading(false);
        setIsConnected(false);
      } else if (status === 'CLOSED') {
        setIsConnected(false);
      }
    });
    
    // Y.Doc 업데이트 리스너 등록
    ydoc.on('update', handleYjsUpdate);
    
    // 정리
    return () => {
      console.log('Cleaning up realtime collaboration for:', documentId);
      
      ydoc.off('update', handleYjsUpdate);
      
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      
      setIsConnected(false);
      setIsLoading(false);
      setError(null);
    };
  }, [ydoc, documentId, userId]);
  
  return {
    isConnected,
    isLoading,
    error,
    channel: channelRef.current
  };
};