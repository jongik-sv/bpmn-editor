# Yjs + Supabase Realtime 협업 시스템 구축 가이드

이 문서는 y-supabase 라이브러리 없이 **Yjs**와 **Supabase Realtime**을 직접 연결하여 안정적인 실시간 협업 시스템을 구축하는 방법을 설명합니다.

## 1. 왜 직접 구현하는가?

### y-supabase의 한계점
- **알파 버전**: 불안정한 API와 예측 불가한 변경사항
- **패키지 구조 문제**: import 에러와 빌드 문제
- **제한적인 커뮤니티 지원**: 문제 해결 시 참고 자료 부족
- **종속성 문제**: 써드파티 라이브러리에 의존

### 직접 구현의 장점
- **완전한 제어**: 코드 전체를 이해하고 제어 가능
- **안정성**: 공식적으로 지원되는 라이브러리만 사용
- **커스터마이징**: 프로젝트 요구사항에 맞게 최적화
- **유지보수성**: 문제 발생 시 빠른 해결 가능

## 2. 핵심 아키텍처

### 2.1. Yjs (Collaborative Data Structure)
- **Y.Doc**: 모든 협업 데이터를 담는 중앙 문서
- **CRDT**: 충돌 없는 데이터 병합 보장
- **바이너리 업데이트**: 효율적인 변경사항 전파
- **로컬 우선**: 오프라인 작업 지원

### 2.2. Supabase Realtime
- **WebSocket 연결**: 실시간 양방향 통신
- **채널 기반**: 룸별 데이터 격리
- **자동 재연결**: 연결 끊김 시 자동 복구
- **PostgreSQL 통합**: 데이터 영속성 보장

### 2.3. 데이터 흐름
```
사용자 A 편집 → Y.Doc 변경 → 바이너리 업데이트 생성 → Supabase Realtime 전송 
                    ↓
사용자 B Y.Doc ← 바이너리 업데이트 적용 ← Supabase Realtime 수신 ← 데이터베이스 저장
```

## 3. 구현 단계별 가이드

### 3.1. 패키지 설치

```bash
npm install yjs @supabase/supabase-js
```

### 3.2. 기본 타입 정의

```typescript
// types/collaboration.ts
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
  update: Uint8Array;
  origin: string;
  timestamp: number;
}
```

### 3.3. Yjs 문서 초기화

```typescript
// hooks/useYjsDocument.ts
import * as Y from 'yjs';
import { useEffect, useRef } from 'react';

export const useYjsDocument = (documentId: string) => {
  const ydoc = useRef<Y.Doc | null>(null);
  
  useEffect(() => {
    // Y.Doc 초기화
    ydoc.current = new Y.Doc();
    
    // 문서 정리
    return () => {
      if (ydoc.current) {
        ydoc.current.destroy();
      }
    };
  }, [documentId]);
  
  return ydoc.current;
};
```

### 3.4. Supabase Realtime 연결

```typescript
// providers/RealtimeProvider.tsx
import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import * as Y from 'yjs';
import { supabase } from '../config/supabase';

export const useRealtimeCollaboration = (
  ydoc: Y.Doc | null,
  documentId: string,
  userId: string
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  useEffect(() => {
    if (!ydoc || !documentId) return;
    
    const channel = supabase.channel(`document-${documentId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: userId }
      }
    });
    
    channelRef.current = channel;
    
    // Y.Doc 업데이트 리스너
    const handleUpdate = (update: Uint8Array, origin: any) => {
      if (origin === 'remote') return; // 원격 업데이트 무시
      
      // Realtime으로 업데이트 전송
      channel.send({
        type: 'broadcast',
        event: 'yjs-update',
        payload: {
          update: Array.from(update),
          origin: userId,
          timestamp: Date.now()
        }
      });
    };
    
    // Realtime 메시지 수신
    channel.on('broadcast', { event: 'yjs-update' }, (payload) => {
      if (payload.payload.origin === userId) return; // 자신의 업데이트 무시
      
      const update = new Uint8Array(payload.payload.update);
      Y.applyUpdate(ydoc, update, 'remote');
    });
    
    // 연결 상태 관리
    channel.on('presence', { event: 'sync' }, () => {
      setIsConnected(true);
      setIsLoading(false);
    });
    
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', key, newPresences);
    });
    
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', key, leftPresences);
    });
    
    // 채널 구독
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setIsLoading(false);
        
        // 현재 사용자 presence 전송
        await channel.track({
          userId,
          timestamp: Date.now()
        });
      } else if (status === 'CHANNEL_ERROR') {
        setError('실시간 연결에 실패했습니다.');
        setIsLoading(false);
      }
    });
    
    // Y.Doc 업데이트 리스너 등록
    ydoc.on('update', handleUpdate);
    
    // 정리
    return () => {
      ydoc.off('update', handleUpdate);
      channel.unsubscribe();
    };
  }, [ydoc, documentId, userId]);
  
  return {
    isConnected,
    isLoading,
    error,
    channel: channelRef.current
  };
};
```

### 3.5. 데이터 영속성 (자동 저장)

```typescript
// hooks/useAutoSave.ts
import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { supabase } from '../config/supabase';

export const useAutoSave = (
  ydoc: Y.Doc | null,
  documentId: string,
  userId: string
) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!ydoc) return;
    
    const handleUpdate = (update: Uint8Array, origin: any) => {
      if (origin === 'remote') return; // 원격 업데이트는 저장하지 않음
      
      // 디바운스된 저장
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const state = Y.encodeStateAsUpdate(ydoc);
          
          await supabase
            .from('bpmn_documents')
            .upsert({
              id: documentId,
              content: Array.from(state),
              updated_at: new Date().toISOString(),
              updated_by: userId
            });
            
          console.log('Document auto-saved');
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, 2000); // 2초 디바운스
    };
    
    ydoc.on('update', handleUpdate);
    
    return () => {
      ydoc.off('update', handleUpdate);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [ydoc, documentId, userId]);
};
```

### 3.6. 문서 초기 로드

```typescript
// hooks/useDocumentLoader.ts
import { useEffect } from 'react';
import * as Y from 'yjs';
import { supabase } from '../config/supabase';

export const useDocumentLoader = (
  ydoc: Y.Doc | null,
  documentId: string
) => {
  useEffect(() => {
    if (!ydoc) return;
    
    const loadDocument = async () => {
      try {
        const { data, error } = await supabase
          .from('bpmn_documents')
          .select('content')
          .eq('id', documentId)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data?.content) {
          const state = new Uint8Array(data.content);
          Y.applyUpdate(ydoc, state, 'remote');
        }
      } catch (error) {
        console.error('Failed to load document:', error);
      }
    };
    
    loadDocument();
  }, [ydoc, documentId]);
};
```

### 3.7. Awareness 구현

```typescript
// hooks/useAwareness.ts
import { useState, useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { UserAwareness } from '../types/collaboration';

export const useAwareness = (
  channel: RealtimeChannel | null,
  userId: string,
  userName: string
) => {
  const [awarenessState, setAwarenessState] = useState<Map<string, UserAwareness>>(new Map());
  
  useEffect(() => {
    if (!channel) return;
    
    // Awareness 업데이트 전송
    const updateAwareness = (update: Partial<UserAwareness>) => {
      const awarenessData = {
        userId,
        userName,
        userColor: getUserColor(userId),
        selectedElements: [],
        timestamp: Date.now(),
        ...update
      };
      
      channel.send({
        type: 'broadcast',
        event: 'awareness-update',
        payload: awarenessData
      });
    };
    
    // Awareness 수신
    channel.on('broadcast', { event: 'awareness-update' }, (payload) => {
      const awarenessData = payload.payload as UserAwareness;
      
      setAwarenessState(prev => {
        const newState = new Map(prev);
        if (awarenessData.userId !== userId) {
          newState.set(awarenessData.userId, awarenessData);
        }
        return newState;
      });
    });
    
    // 정리
    return () => {
      channel.off('broadcast', { event: 'awareness-update' });
    };
  }, [channel, userId, userName]);
  
  const updateSelection = (selectedElements: string[]) => {
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'awareness-update',
        payload: {
          userId,
          userName,
          userColor: getUserColor(userId),
          selectedElements,
          timestamp: Date.now()
        }
      });
    }
  };
  
  return {
    awarenessState,
    updateSelection
  };
};

const getUserColor = (userId: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};
```

## 4. 통합 컴포넌트

### 4.1. 메인 협업 프로바이더

```typescript
// providers/CollaborationProvider.tsx
import React, { createContext, useContext } from 'react';
import { useYjsDocument } from '../hooks/useYjsDocument';
import { useRealtimeCollaboration } from '../hooks/useRealtimeCollaboration';
import { useAutoSave } from '../hooks/useAutoSave';
import { useDocumentLoader } from '../hooks/useDocumentLoader';
import { useAwareness } from '../hooks/useAwareness';

interface CollaborationContextType {
  ydoc: Y.Doc | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  awarenessState: Map<string, UserAwareness>;
  updateSelection: (selectedElements: string[]) => void;
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
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({
  children,
  documentId,
  userId,
  userName
}) => {
  const ydoc = useYjsDocument(documentId);
  const { isConnected, isLoading, error, channel } = useRealtimeCollaboration(ydoc, documentId, userId);
  const { awarenessState, updateSelection } = useAwareness(channel, userId, userName);
  
  useAutoSave(ydoc, documentId, userId);
  useDocumentLoader(ydoc, documentId);
  
  return (
    <CollaborationContext.Provider value={{
      ydoc,
      isConnected,
      isLoading,
      error,
      awarenessState,
      updateSelection
    }}>
      {children}
    </CollaborationContext.Provider>
  );
};
```

## 5. 데이터베이스 스키마

```sql
-- bpmn_documents 테이블 (기존 수정)
ALTER TABLE bpmn_documents 
ADD COLUMN IF NOT EXISTS content integer[], -- Yjs 바이너리 데이터
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES profiles(id);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_bpmn_documents_updated_at ON bpmn_documents(updated_at);
CREATE INDEX IF NOT EXISTS idx_bpmn_documents_updated_by ON bpmn_documents(updated_by);
```

## 6. 장점과 특징

### 6.1. 안정성
- 공식 지원 라이브러리만 사용
- 검증된 아키텍처 패턴
- 예측 가능한 동작

### 6.2. 성능
- 효율적인 바이너리 업데이트
- 디바운스된 자동 저장
- 메모리 효율적인 데이터 구조

### 6.3. 확장성
- 모듈화된 구조
- 쉬운 커스터마이징
- 다양한 데이터 타입 지원

### 6.4. 개발 경험
- 완전한 타입 안전성
- 명확한 에러 처리
- 풍부한 디버깅 정보

## 7. 베스트 프랙티스

### 7.1. 에러 처리
- 네트워크 연결 끊김 처리
- 재연결 로직 구현
- 사용자 친화적 에러 메시지

### 7.2. 성능 최적화
- 업데이트 배치 처리
- 메모리 사용량 모니터링
- 불필요한 리렌더링 방지

### 7.3. 보안
- 사용자 인증 검증
- 데이터 검증 및 새니타이징
- RLS 정책 적용

## 8. 마이그레이션 가이드

### 8.1. y-supabase에서 이관
1. y-supabase 패키지 제거
2. 직접 구현 코드로 교체
3. 데이터 마이그레이션 (필요시)
4. 테스트 및 검증

### 8.2. 데이터 호환성
- 기존 Y.Doc 형태 유지
- 바이너리 업데이트 형식 동일
- 하위 호환성 보장

## 9. 결론

직접 Yjs + Supabase Realtime을 구현하는 것은 초기 개발 시간이 더 걸리지만, 장기적으로 다음과 같은 이점을 제공합니다:

- **안정성**: 검증된 기술 스택
- **제어력**: 완전한 코드 제어
- **성능**: 최적화된 구현
- **유지보수**: 쉬운 문제 해결

이 가이드를 통해 안정적이고 확장 가능한 실시간 협업 시스템을 구축할 수 있습니다.

---

**마지막 업데이트**: 2025-07-09  
**버전**: 1.0.0  
**작성자**: Claude Code Assistant