import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { supabase } from '../config/supabase';

interface UseDocumentLoaderProps {
  ydoc: Y.Doc | null;
  documentId: string;
  tableName?: string;
}

/**
 * 데이터베이스에서 Yjs 문서를 로드하는 훅
 * 초기 로드 시 기존 문서 상태를 복원합니다.
 */
export const useDocumentLoader = ({
  ydoc,
  documentId,
  tableName = 'bpmn_documents'
}: UseDocumentLoaderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  useEffect(() => {
    if (!ydoc || !documentId || hasLoaded) return;
    
    const loadDocument = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        console.log('Loading document:', documentId);
        
        // 데이터베이스에서 문서 조회
        const { data, error } = await supabase
          .from(tableName)
          .select('content, updated_at')
          .eq('diagram_id', documentId)
          .single();
        
        if (error) {
          // 문서가 존재하지 않는 경우 (PGRST116)는 정상적인 상황
          if (error.code === 'PGRST116') {
            console.log('Document not found, creating new:', documentId);
            setHasLoaded(true);
            return;
          }
          
          throw error;
        }
        
        if (data?.content) {
          // Check if content is already binary data or needs to be converted
          let state: Uint8Array;
          if (Array.isArray(data.content)) {
            // 배열 형태로 저장된 바이너리 데이터를 Uint8Array로 변환
            state = new Uint8Array(data.content);
          } else {
            // JSONB 형태라면 새로운 문서로 처리
            console.log('Document exists but has JSONB content, treating as new document');
            setHasLoaded(true);
            return;
          }
          
          // Y.Doc에 상태 적용
          Y.applyUpdate(ydoc, state, 'remote');
          
          console.log('Document loaded successfully:', {
            documentId,
            updatedAt: data.updated_at
          });
        } else {
          console.log('Document exists but has no content:', documentId);
        }
        
        setHasLoaded(true);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setLoadError(`문서 로드 실패: ${errorMessage}`);
        console.error('Failed to load document:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDocument();
  }, [ydoc, documentId, tableName, hasLoaded]);
  
  // 문서 재로드 함수
  const reloadDocument = async () => {
    if (!ydoc || !documentId) return;
    
    setHasLoaded(false);
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // Y.Doc 초기화
      ydoc.destroy();
      
      // 새로운 Y.Doc으로 교체는 useYjsDocument에서 처리되므로
      // 여기서는 로드 상태만 리셋
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLoadError(`문서 재로드 실패: ${errorMessage}`);
      console.error('Failed to reload document:', error);
    }
  };
  
  return {
    isLoading,
    loadError,
    hasLoaded,
    reloadDocument
  };
};