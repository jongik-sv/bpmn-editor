import { useEffect, useRef, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';

// 기본 BPMN 다이어그램 XML (최소한의 구조)
const INITIAL_DIAGRAM = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_1" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="159" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

interface BpmnEditorProps {
  initialXml?: string;
  onChange?: (xml: string) => void;
  diagramId?: string;
}

export default function BpmnEditor({ 
  initialXml, 
  onChange, 
  diagramId 
}: BpmnEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnModeler | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 초기화 지연을 위한 timeout
    const initializeModeler = setTimeout(() => {
      try {
        // BPMN 모델러 초기화
        const modeler = new BpmnModeler({
          container: containerRef.current!
        });

        modelerRef.current = modeler;

        // 초기 다이어그램 로드
        const loadDiagram = async () => {
          try {
            setIsLoading(true);
            setError(null);
            
            // initialXml이 있으면 로드, 없으면 새 다이어그램 생성
            if (initialXml) {
              await modeler.importXML(initialXml);
            } else {
              await modeler.createDiagram();
            }
            
            // 캔버스 중앙 정렬
            const canvas = modeler.get('canvas');
            canvas.zoom('fit-viewport');
            
            setIsLoading(false);
          } catch (err) {
            console.error('Error loading BPMN diagram:', err);
            setError('다이어그램을 로드하는 중 오류가 발생했습니다.');
            setIsLoading(false);
          }
        };

        // 변경사항 감지
        if (onChange) {
          modeler.on('commandStack.changed', () => {
            saveXML();
          });
        }

        loadDiagram();
      } catch (err) {
        console.error('Error initializing BPMN modeler:', err);
        setError('BPMN 에디터 초기화 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    }, 100);

    // 컴포넌트 언마운트 시 정리
    return () => {
      clearTimeout(initializeModeler);
      if (modelerRef.current) {
        try {
          modelerRef.current.destroy();
        } catch (err) {
          console.error('Error destroying modeler:', err);
        }
      }
    };
  }, []);

  // XML 저장 (onChange 콜백 호출)
  const saveXML = async () => {
    if (!modelerRef.current || !onChange) return;

    try {
      const { xml } = await modelerRef.current.saveXML({ format: true });
      onChange(xml);
    } catch (err) {
      console.error('Error saving BPMN XML:', err);
    }
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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-gray-600">BPMN 에디터를 로드하는 중...</div>
          </div>
        </div>
      )}
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