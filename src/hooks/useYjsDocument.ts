import { useEffect, useRef } from 'react';
import * as Y from 'yjs';

/**
 * Yjs 문서를 관리하는 훅
 * 문서 ID별로 Y.Doc 인스턴스를 생성하고 관리합니다.
 */
export const useYjsDocument = (documentId: string) => {
  const ydoc = useRef<Y.Doc | null>(null);
  
  useEffect(() => {
    if (!documentId) return;
    
    // 새로운 Y.Doc 인스턴스 생성
    ydoc.current = new Y.Doc();
    
    // 디버깅을 위한 로그
    console.log('Yjs Document created for:', documentId);
    
    // 문서 정리
    return () => {
      if (ydoc.current) {
        console.log('Yjs Document destroyed for:', documentId);
        ydoc.current.destroy();
        ydoc.current = null;
      }
    };
  }, [documentId]);
  
  return ydoc.current;
};