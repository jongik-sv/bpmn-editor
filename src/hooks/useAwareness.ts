import { useState, useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { UserAwareness } from '../types/collaboration';

interface UseAwarenessProps {
  channel: RealtimeChannel | null;
  userId: string;
  userName: string;
}

/**
 * 사용자 인지 상태(Awareness)를 관리하는 훅
 * 사용자의 선택 상태, 커서 위치 등을 실시간으로 공유합니다.
 */
export const useAwareness = ({
  channel,
  userId,
  userName
}: UseAwarenessProps) => {
  const [awarenessState, setAwarenessState] = useState<Map<string, UserAwareness>>(new Map());
  
  useEffect(() => {
    if (!channel || !userId) return;
    
    // Awareness 업데이트 수신 리스너
    const handleAwarenessUpdate = (payload: any) => {
      const awarenessData = payload.payload as UserAwareness;
      
      if (awarenessData.userId === userId) return; // 자신의 awareness는 무시
      
      console.log('Received awareness update:', awarenessData);
      
      setAwarenessState(prev => {
        const newState = new Map(prev);
        
        // 타임스탬프가 너무 오래된 경우 무시 (30초 이상)
        const now = Date.now();
        if (now - awarenessData.timestamp > 30000) {
          return prev;
        }
        
        newState.set(awarenessData.userId, awarenessData);
        return newState;
      });
    };
    
    // 사용자 연결 해제 처리
    const handleUserLeave = ({ key }: { key: string }) => {
      setAwarenessState(prev => {
        const newState = new Map(prev);
        newState.delete(key);
        return newState;
      });
    };
    
    // 이벤트 리스너 등록
    channel.on('broadcast', { event: 'awareness-update' }, handleAwarenessUpdate);
    channel.on('presence', { event: 'leave' }, handleUserLeave);
    
    // 정리
    return () => {
      channel.off('broadcast', { event: 'awareness-update' }, handleAwarenessUpdate);
      channel.off('presence', { event: 'leave' }, handleUserLeave);
    };
  }, [channel, userId]);
  
  // 정리 작업 - 오래된 awareness 데이터 제거
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setAwarenessState(prev => {
        const newState = new Map(prev);
        let hasChanges = false;
        
        for (const [key, value] of newState) {
          if (now - value.timestamp > 30000) { // 30초 이상 오래된 데이터 제거
            newState.delete(key);
            hasChanges = true;
          }
        }
        
        return hasChanges ? newState : prev;
      });
    }, 10000); // 10초마다 정리
    
    return () => clearInterval(cleanupInterval);
  }, []);
  
  // 선택 상태 업데이트 함수
  const updateSelection = (selectedElements: string[]) => {
    if (!channel) return;
    
    const awarenessData: UserAwareness = {
      userId,
      userName,
      userColor: getUserColor(userId),
      selectedElements,
      timestamp: Date.now()
    };
    
    console.log('Sending awareness update:', awarenessData);
    
    channel.send({
      type: 'broadcast',
      event: 'awareness-update',
      payload: awarenessData
    });
  };
  
  // 커서 위치 업데이트 함수 (향후 확장 가능)
  const updateCursor = () => {
    if (!channel) return;
    
    const awarenessData: UserAwareness = {
      userId,
      userName,
      userColor: getUserColor(userId),
      selectedElements: [], // 현재 선택된 요소들 유지 필요
      timestamp: Date.now()
    };
    
    channel.send({
      type: 'broadcast',
      event: 'awareness-update',
      payload: awarenessData
    });
  };
  
  return {
    awarenessState,
    updateSelection,
    updateCursor
  };
};

/**
 * 사용자 ID를 기반으로 고유한 색상을 생성합니다.
 */
const getUserColor = (userId: string): string => {
  const colors = [
    '#FF6B6B', // 빨간색
    '#4ECDC4', // 청록색
    '#45B7D1', // 파란색
    '#96CEB4', // 민트색
    '#FFEAA7', // 노란색
    '#DDA0DD', // 보라색
    '#98D8C8', // 연두색
    '#F7DC6F', // 주황색
    '#BB8FCE', // 라벤더색
    '#85C1E9'  // 하늘색
  ];
  
  // 사용자 ID를 해시하여 색상 선택
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};