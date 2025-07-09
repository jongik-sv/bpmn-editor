import { useEffect, useRef, useState, useCallback } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import * as Y from 'yjs';
import { useSupabaseProvider } from '../contexts/SupabaseProvider';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';

interface CollaborativeBpmnEditorProps {
  diagramId: string;
  initialXml?: string;
  onChange?: (xml: string) => void;
}

export default function CollaborativeBpmnEditor({ 
  diagramId, 
  initialXml, 
  onChange 
}: CollaborativeBpmnEditorProps) {
  const { ydoc, provider, isConnected, isLoading: providerLoading } = useSupabaseProvider();
  const { user } = useAuth();
  const { saveDiagramXml } = useProject();
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnModeler | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSavedXml, setLastSavedXml] = useState<string>('');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Yjs 데이터 구조 설정
  const xmlText = ydoc.getText('xml');
  const elementsMap = ydoc.getMap('elements');
  const awarenessMap = ydoc.getMap('awareness');

  // 자동 저장 기능
  const autoSave = useCallback(async (xml: string) => {
    if (!xml || xml === lastSavedXml) return;
    
    try {
      await saveDiagramXml(diagramId, xml);
      setLastSavedXml(xml);
      console.log('Auto-saved diagram:', diagramId);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [diagramId, lastSavedXml, saveDiagramXml]);

  // 디바운스된 자동 저장
  const debouncedAutoSave = useCallback((xml: string) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave(xml);
    }, 2000); // 2초 후 자동 저장
  }, [autoSave]);

  useEffect(() => {
    if (!containerRef.current || !provider || isInitialized) return;

    const initializeModeler = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // BPMN 모델러 초기화
        const modeler = new BpmnModeler({
          container: containerRef.current!,
          additionalModules: [
            // 추후 협업 모듈 추가 가능
          ]
        });

        modelerRef.current = modeler;

        // 초기 다이어그램 로드
        let xmlToLoad = initialXml;
        
        // Y.Doc에서 기존 XML 확인
        if (xmlText.length > 0) {
          xmlToLoad = xmlText.toString();
        } else if (initialXml) {
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
          if (xml) {
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
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing collaborative BPMN editor:', err);
        setError('협업 BPMN 에디터 초기화 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    initializeModeler();

    // 컴포넌트 언마운트 시 정리
    return () => {
      // 자동 저장 타이머 정리
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Awareness 정보 정리
      if (user?.id) {
        ydoc.transact(() => {
          awarenessMap.delete(user.id);
        }, user.id);
      }
      
      if (modelerRef.current) {
        try {
          modelerRef.current.destroy();
        } catch (err) {
          console.error('Error destroying modeler:', err);
        }
      }
    };
  }, [provider, isInitialized]);

  // BPMN 모델링 이벤트 리스너 설정
  const setupModelingEventListeners = (modeler: BpmnModeler) => {
    const eventBus = modeler.get('eventBus') as any;
    
    // 요소 변경 이벤트
    eventBus.on('commandStack.changed', () => {
      handleBpmnChange(modeler);
    });

    // 선택 이벤트 (Awareness용)
    eventBus.on('selection.changed', (event: any) => {
      handleSelectionChange(event);
    });
  };

  // Y.Doc 변경 이벤트 리스너 설정
  const setupYjsEventListeners = (modeler: BpmnModeler) => {
    // XML 텍스트 변경 감지
    xmlText.observe((event: Y.YTextEvent) => {
      if ((event as any).origin === user?.id) return; // 자신의 변경사항 무시
      
      const currentXml = xmlText.toString();
      if (currentXml) {
        updateModelerFromYjs(modeler, currentXml);
      }
    });

    // 요소 변경 감지
    elementsMap.observe((event: Y.YMapEvent<any>) => {
      if ((event as any).origin === user?.id) return; // 자신의 변경사항 무시
      
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add' || change.action === 'update') {
          const element = elementsMap.get(key);
          updateElementFromYjs(modeler, key, element);
        } else if (change.action === 'delete') {
          removeElementFromBpmn(modeler, key);
        }
      });
    });

    // Awareness 변경 감지
    awarenessMap.observe((event: Y.YMapEvent<any>) => {
      event.changes.keys.forEach((change, userId) => {
        if (userId === user?.id) return; // 자신의 awareness 무시
        
        if (change.action === 'add' || change.action === 'update') {
          const awarenessData = awarenessMap.get(userId);
          updateAwarenessUI(modeler, userId, awarenessData);
        } else if (change.action === 'delete') {
          removeAwarenessUI(modeler, userId);
        }
      });
    });
  };

  // BPMN 변경사항을 Y.Doc에 반영
  const handleBpmnChange = async (modeler: BpmnModeler) => {
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
            
            // 자동 저장 실행
            debouncedAutoSave(xml);
          }
        });

        // 요소별 변경사항 추적
        const elementRegistry = modeler.get('elementRegistry') as any;
        const allElements = elementRegistry.getAll();
        
        allElements.forEach((element: any) => {
          const elementData = {
            id: element.id,
            type: element.type,
            businessObject: element.businessObject,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            waypoints: element.waypoints,
            lastModified: Date.now(),
            modifiedBy: user?.id
          };
          
          elementsMap.set(element.id, elementData);
        });
      }, user?.id || '');
    } catch (err) {
      console.error('Error handling BPMN change:', err);
    }
  };

  // 선택 변경 처리 (Awareness용)
  const handleSelectionChange = (event: any) => {
    const selectedElements = event.newSelection || [];
    const selectionData = {
      userId: user?.id,
      userName: user?.display_name || user?.email,
      userColor: getUserColor(user?.id || ''),
      selectedElements: selectedElements.map((el: any) => el.id),
      timestamp: Date.now()
    };
    
    // Awareness 데이터 업데이트
    ydoc.transact(() => {
      awarenessMap.set(user?.id || '', selectionData);
    }, user?.id || '');
  };

  // 사용자별 고유 색상 생성
  const getUserColor = (userId: string) => {
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

  // Y.Doc 변경사항을 BPMN 모델러에 반영
  const updateModelerFromYjs = async (modeler: BpmnModeler, xml: string) => {
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
  };

  // 개별 요소 업데이트 (세분화된 업데이트)
  const updateElementFromYjs = (modeler: BpmnModeler, elementId: string, elementData: any) => {
    try {
      const elementRegistry = modeler.get('elementRegistry') as any;
      const modeling = modeler.get('modeling') as any;
      
      const element = elementRegistry.get(elementId);
      
      if (element && elementData) {
        // 속성 업데이트
        if (elementData.businessObject) {
          modeling.updateProperties(element, elementData.businessObject);
        }
        
        // 위치/크기 업데이트
        if (elementData.x !== undefined && elementData.y !== undefined) {
          const delta = {
            x: elementData.x - element.x,
            y: elementData.y - element.y
          };
          
          if (delta.x !== 0 || delta.y !== 0) {
            modeling.moveShape(element, delta);
          }
        }
        
        // 크기 업데이트
        if (elementData.width !== undefined && elementData.height !== undefined) {
          modeling.resizeShape(element, {
            x: elementData.x,
            y: elementData.y,
            width: elementData.width,
            height: elementData.height
          });
        }
      }
    } catch (err) {
      console.error('Error updating element from Yjs:', err);
    }
  };

  // 요소 삭제
  const removeElementFromBpmn = (modeler: BpmnModeler, elementId: string) => {
    try {
      const elementRegistry = modeler.get('elementRegistry') as any;
      const modeling = modeler.get('modeling') as any;
      
      const element = elementRegistry.get(elementId);
      if (element) {
        modeling.removeElements([element]);
      }
    } catch (err) {
      console.error('Error removing element from BPMN:', err);
    }
  };

  // Awareness UI 업데이트
  const updateAwarenessUI = (modeler: BpmnModeler, userId: string, awarenessData: any) => {
    if (!awarenessData) return;
    
    const canvas = modeler.get('canvas') as any;
    const elementRegistry = modeler.get('elementRegistry') as any;
    
    // 기존 awareness 요소 제거
    removeAwarenessUI(modeler, userId);
    
    // 선택된 요소들에 시각적 표시 추가
    awarenessData.selectedElements.forEach((elementId: string) => {
      const element = elementRegistry.get(elementId);
      if (element) {
        const gfx = canvas.getGraphics(element);
        if (gfx) {
          // 선택 표시를 위한 외곽선 추가
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', (element.x - 2).toString());
          rect.setAttribute('y', (element.y - 2).toString());
          rect.setAttribute('width', (element.width + 4).toString());
          rect.setAttribute('height', (element.height + 4).toString());
          rect.setAttribute('fill', 'none');
          rect.setAttribute('stroke', awarenessData.userColor);
          rect.setAttribute('stroke-width', '2');
          rect.setAttribute('stroke-dasharray', '5,5');
          rect.setAttribute('class', `awareness-${userId}`);
          
          gfx.appendChild(rect);
          
          // 사용자 이름 표시
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', (element.x + element.width + 5).toString());
          text.setAttribute('y', (element.y - 5).toString());
          text.setAttribute('fill', awarenessData.userColor);
          text.setAttribute('font-size', '12');
          text.setAttribute('font-weight', 'bold');
          text.setAttribute('class', `awareness-${userId}`);
          text.textContent = awarenessData.userName;
          
          gfx.appendChild(text);
        }
      }
    });
  };

  // Awareness UI 제거
  const removeAwarenessUI = (modeler: BpmnModeler, userId: string) => {
    const canvas = modeler.get('canvas') as any;
    const container = canvas.getContainer();
    
    // 해당 사용자의 awareness 요소들 제거
    const awarenessElements = container.querySelectorAll(`.awareness-${userId}`);
    awarenessElements.forEach((element: Element) => {
      element.remove();
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">오류 발생</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white relative">
      {/* 연결 상태 표시 */}
      <div className="absolute top-4 right-4 z-10">
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
      </div>

      {/* 로딩 오버레이 */}
      {(isLoading || providerLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-gray-600">
              {providerLoading ? '협업 환경을 준비하는 중...' : 'BPMN 에디터를 로드하는 중...'}
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