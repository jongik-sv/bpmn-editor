import { useEffect, useRef, useState, useCallback } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import * as Y from 'yjs';
import { useCollaboration } from '../providers/CollaborationProvider';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';

interface NewCollaborativeBpmnEditorProps {
  diagramId: string;
  initialXml?: string;
  onChange?: (xml: string) => void;
}

export default function NewCollaborativeBpmnEditor({ 
  diagramId, 
  initialXml, 
  onChange 
}: NewCollaborativeBpmnEditorProps) {
  const { 
    ydoc, 
    isConnected, 
    isLoading: connectionLoading, 
    error: connectionError,
    isDocumentLoading,
    documentLoadError,
    hasDocumentLoaded,
    isSaving,
    lastSaved,
    saveError,
    awarenessState,
    updateSelection
  } = useCollaboration();
  
  const { user } = useAuth();
  const { saveDiagramXml } = useProject();
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnModeler | null>(null);
  const [isEditorLoading, setIsEditorLoading] = useState(true);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Yjs 데이터 구조 설정
  const xmlText = ydoc?.getText('xml');
  
  // 자동 저장 대신 기존 시스템과 연동
  const debouncedSave = useCallback(async (xml: string) => {
    if (!xml) return;
    
    try {
      await saveDiagramXml(diagramId, xml);
      console.log('BPMN XML saved to database');
    } catch (error) {
      console.error('Failed to save BPMN XML:', error);
    }
  }, [diagramId, saveDiagramXml]);
  
  // Y.Doc 변경사항을 BPMN 모델러에 반영
  const updateModelerFromYjs = useCallback(async (modeler: BpmnModeler, xml: string) => {
    try {
      // 현재 XML과 비교하여 변경된 경우만 업데이트
      const { xml: currentXml } = await modeler.saveXML({ format: true });
      
      if (currentXml !== xml) {
        await modeler.importXML(xml);
        
        // 캔버스 다시 맞춤
        const canvas = modeler.get('canvas') as any;
        canvas.zoom('fit-viewport');
      }
    } catch (err) {
      console.error('Error updating modeler from Yjs:', err);
    }
  }, []);
  
  // 선택 변경 처리 (Awareness용)
  const handleSelectionChange = useCallback((event: any) => {
    const selectedElements = event.newSelection || [];
    updateSelection(selectedElements.map((el: any) => el.id));
  }, [updateSelection]);
  
  // BPMN 변경사항을 Y.Doc에 반영
  const handleBpmnChange = useCallback(async (modeler: BpmnModeler) => {
    if (!ydoc || !xmlText) return;
    
    try {
      // 트랜잭션 시작 (origin을 사용자 ID로 설정)
      ydoc.transact(() => {
        // XML 업데이트
        modeler.saveXML({ format: true }).then(({ xml }) => {
          if (xml) {
            // 기존 XML 텍스트 삭제 후 새 XML 삽입
            xmlText.delete(0, xmlText.length);
            xmlText.insert(0, xml);
            
            // onChange 콜백 호출
            if (onChange) {
              onChange(xml);
            }
            
            // 기존 저장 시스템과 연동
            debouncedSave(xml);
          }
        });
      }, user?.id || '');
    } catch (err) {
      console.error('Error handling BPMN change:', err);
    }
  }, [ydoc, xmlText, onChange, debouncedSave, user?.id]);
  
  // BPMN 모델링 이벤트 리스너 설정
  const setupModelingEventListeners = useCallback((modeler: BpmnModeler) => {
    const eventBus = modeler.get('eventBus') as any;
    
    // 요소 변경 이벤트
    eventBus.on('commandStack.changed', () => {
      handleBpmnChange(modeler);
    });
    
    // 선택 이벤트 (Awareness용)
    eventBus.on('selection.changed', (event: any) => {
      handleSelectionChange(event);
    });
  }, [handleBpmnChange, handleSelectionChange]);
  
  // Y.Doc 변경 이벤트 리스너 설정
  const setupYjsEventListeners = useCallback((modeler: BpmnModeler) => {
    if (!xmlText) return;
    
    // XML 텍스트 변경 감지
    xmlText.observe((event: Y.YTextEvent) => {
      if ((event as any).origin === user?.id) return; // 자신의 변경사항 무시
      
      const currentXml = xmlText.toString();
      if (currentXml) {
        updateModelerFromYjs(modeler, currentXml);
      }
    });
  }, [xmlText, user?.id, updateModelerFromYjs]);
  
  useEffect(() => {
    if (!containerRef.current || !ydoc || !hasDocumentLoaded || isInitialized) return;
    
    const initializeModeler = async () => {
      try {
        setIsEditorLoading(true);
        setEditorError(null);
        
        // BPMN 모델러 초기화
        const modeler = new BpmnModeler({
          container: containerRef.current!
        });
        
        modelerRef.current = modeler;
        
        // 초기 다이어그램 로드
        let xmlToLoad = initialXml;
        
        // Y.Doc에서 기존 XML 확인
        if (xmlText && xmlText.length > 0) {
          xmlToLoad = xmlText.toString();
        } else if (initialXml && xmlText) {
          // 초기 XML이 있으면 Y.Doc에 저장
          xmlText.insert(0, initialXml);
          xmlToLoad = initialXml;
        }
        
        if (xmlToLoad) {
          await modeler.importXML(xmlToLoad);
        } else {
          await modeler.createDiagram();
          // 새 다이어그램 XML을 Y.Doc에 저장
          const { xml } = await modeler.saveXML({ format: true });
          if (xml && xmlText) {
            xmlText.insert(0, xml);
          }
        }
        
        // 캔버스 중앙 정렬
        const canvas = modeler.get('canvas') as any;
        canvas.zoom('fit-viewport');
        
        // 모델링 이벤트 리스너 설정
        setupModelingEventListeners(modeler);
        
        // Y.Doc 변경 이벤트 리스너 설정
        setupYjsEventListeners(modeler);
        
        setIsInitialized(true);
        setIsEditorLoading(false);
      } catch (err) {
        console.error('Error initializing collaborative BPMN editor:', err);
        setEditorError('협업 BPMN 에디터 초기화 중 오류가 발생했습니다.');
        setIsEditorLoading(false);
      }
    };
    
    initializeModeler();
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      if (modelerRef.current) {
        try {
          modelerRef.current.destroy();
        } catch (err) {
          console.error('Error destroying modeler:', err);
        }
      }
    };
  }, [ydoc, hasDocumentLoaded, isInitialized, initialXml, xmlText, setupModelingEventListeners, setupYjsEventListeners]);
  
  // Awareness UI 업데이트
  const updateAwarenessUI = useCallback((modeler: BpmnModeler) => {
    const canvas = modeler.get('canvas') as any;
    const container = canvas.getContainer();
    
    // 기존 awareness 요소들 제거
    const existingElements = container.querySelectorAll('.awareness-indicator');
    existingElements.forEach((el: Element) => el.remove());
    
    // 새로운 awareness 요소들 추가
    awarenessState.forEach((awareness) => {
      if (awareness.selectedElements.length > 0) {
        awareness.selectedElements.forEach(elementId => {
          const elementRegistry = modeler.get('elementRegistry') as any;
          const element = elementRegistry.get(elementId);
          
          if (element) {
            const gfx = canvas.getGraphics(element);
            if (gfx) {
              // 사용자 표시를 위한 요소 추가
              const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              indicator.setAttribute('x', (element.x - 2).toString());
              indicator.setAttribute('y', (element.y - 2).toString());
              indicator.setAttribute('width', (element.width + 4).toString());
              indicator.setAttribute('height', (element.height + 4).toString());
              indicator.setAttribute('fill', 'none');
              indicator.setAttribute('stroke', awareness.userColor);
              indicator.setAttribute('stroke-width', '2');
              indicator.setAttribute('stroke-dasharray', '5,5');
              indicator.setAttribute('class', 'awareness-indicator');
              
              gfx.appendChild(indicator);
            }
          }
        });
      }
    });
  }, [awarenessState]);
  
  // Awareness 상태 변경 시 UI 업데이트
  useEffect(() => {
    if (modelerRef.current && isInitialized) {
      updateAwarenessUI(modelerRef.current);
    }
  }, [awarenessState, isInitialized, updateAwarenessUI]);
  
  if (connectionError || documentLoadError || editorError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">오류 발생</div>
          <div className="text-gray-600">
            {connectionError || documentLoadError || editorError}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full bg-white relative">
      {/* 연결 상태 표시 */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
          isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isConnected ? 'bg-green-500' : 'bg-yellow-500'
          }`} />
          {isConnected ? '연결됨' : '연결 중...'}
        </div>
        
        {/* 저장 상태 표시 */}
        {isSaving && (
          <div className="flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            <div className="animate-spin w-2 h-2 border border-blue-600 rounded-full mr-2"></div>
            저장 중...
          </div>
        )}
        
        {lastSaved && (
          <div className="text-xs text-gray-500 px-3">
            마지막 저장: {lastSaved.toLocaleTimeString()}
          </div>
        )}
        
        {saveError && (
          <div className="text-xs text-red-500 px-3">
            저장 오류: {saveError}
          </div>
        )}
      </div>
      
      {/* 온라인 사용자 표시 */}
      {awarenessState.size > 0 && (
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">온라인:</span>
            {Array.from(awarenessState.values()).map(user => (
              <div
                key={user.userId}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: user.userColor }}
                title={user.userName}
              >
                {user.userName.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 로딩 오버레이 */}
      {(isEditorLoading || connectionLoading || isDocumentLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-gray-600">
              {isDocumentLoading ? '문서를 로드하는 중...' : 
               connectionLoading ? '협업 환경을 준비하는 중...' : 
               'BPMN 에디터를 로드하는 중...'}
            </div>
          </div>
        </div>
      )}
      
      {/* BPMN 에디터 컨테이너 */}
      <div 
        ref={containerRef} 
        className="h-full w-full"
        style={{ 
          minHeight: '500px',
          position: 'relative'
        }}
      />
    </div>
  );
}