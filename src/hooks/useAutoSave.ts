import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { supabase } from '../config/supabase';

interface UseAutoSaveProps {
  ydoc: Y.Doc | null;
  documentId: string;
  userId: string;
  debounceMs?: number;
  tableName?: string;
}

/**
 * Yjs 문서의 자동 저장 기능을 제공하는 훅
 * 변경사항을 디바운스하여 데이터베이스에 저장합니다.
 */
export const useAutoSave = ({
  ydoc,
  documentId,
  userId,
  debounceMs = 2000,
  tableName = 'bpmn_documents'
}: UseAutoSaveProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!ydoc || !documentId || !userId) return;
    
    const handleYjsUpdate = (_update: Uint8Array, origin: unknown) => {
      if (origin === 'remote') return; // 원격 업데이트는 저장하지 않음
      
      setSaveError(null);
      
      // 기존 타이머 취소
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // 디바운스된 저장 실행
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        
        try {
          // Y.Doc의 전체 상태를 바이너리로 인코딩
          const state = Y.encodeStateAsUpdate(ydoc);
          
          // 데이터베이스에 저장
          const { error } = await supabase
            .from(tableName)
            .upsert({
              diagram_id: documentId,
              content: Array.from(state), // Uint8Array를 배열로 직렬화
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'diagram_id'
            });
          
          if (error) {
            throw error;
          }
          
          setLastSaved(new Date());
          console.log('Document auto-saved successfully:', documentId);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setSaveError(`자동 저장 실패: ${errorMessage}`);
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }, debounceMs);
    };
    
    // Y.Doc 업데이트 리스너 등록
    ydoc.on('update', handleYjsUpdate);
    
    // 정리
    return () => {
      ydoc.off('update', handleYjsUpdate);
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [ydoc, documentId, userId, debounceMs, tableName]);
  
  // 수동 저장 함수
  const saveNow = async () => {
    if (!ydoc || !documentId || !userId) return;
    
    // 대기 중인 자동 저장 취소
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const state = Y.encodeStateAsUpdate(ydoc);
      
      const { error } = await supabase
        .from(tableName)
        .upsert({
          diagram_id: documentId,
          content: Array.from(state),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'diagram_id'
        });
      
      if (error) {
        throw error;
      }
      
      setLastSaved(new Date());
      console.log('Document saved manually:', documentId);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSaveError(`저장 실패: ${errorMessage}`);
      console.error('Manual save failed:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };
  
  return {
    isSaving,
    lastSaved,
    saveError,
    saveNow
  };
};