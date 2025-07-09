# BPMN.io (bpmn-js)와 Yjs 통합을 위한 세분화된 업데이트 API 개발 가이드

이 문서는 `bpmn-js` 에디터와 `Yjs`를 통합하여 실시간 협업 기능을 구현할 때, UI 끊김 현상 없이 변경 사항을 매끄럽게 반영하기 위한 구체적인 API 개발 방안을 제시합니다. 핵심은 Yjs의 변경 사항을 `bpmn-js`의 모델링 API를 통해 세분화된 방식으로 적용하는 것입니다.

## 1. 개요

기존의 `bpmn-js`와 `Yjs` 통합 방식은 Yjs에서 변경이 발생할 때마다 전체 BPMN XML을 다시 파싱하여 `bpmn-js` 에디터에 `importXML` 또는 `importDiagram`하는 경우가 많습니다. 이는 에디터의 내부 상태를 초기화하고 UI 끊김, 컨텍스트 메뉴 사라짐 등의 사용자 경험 저하를 초래합니다.

이 가이드에서는 이러한 문제를 해결하기 위해 Yjs의 변경 이벤트를 감지하고, 이를 `bpmn-js`의 세분화된 모델링 API 호출로 변환하여 적용하는 방법을 설명합니다.

## 2. 핵심 개발 단계

### 2.1. Yjs 데이터 모델 설계 (Designing the Yjs Data Model)

가장 먼저 해야 할 일은 BPMN 다이어그램의 구조를 Yjs의 협업 데이터 타입(`Y.Map`, `Y.Array`, `Y.Text` 등)으로 어떻게 표현할지 설계하는 것입니다. 이 모델은 `bpmn-js`의 내부 모델과 유사하게 구성하는 것이 변경 매핑을 용이하게 합니다.

**고려사항:**
*   **루트 문서**: 전체 BPMN 다이어그램을 나타내는 `Y.Map`을 사용합니다.
*   **요소별 `Y.Map`**: 각 BPMN 요소(예: 태스크, 게이트웨이, 이벤트, 시퀀스 플로우)는 고유한 ID를 키로 하는 `Y.Map`으로 표현합니다. 이 `Y.Map` 안에는 요소의 속성(예: `id`, `name`, `x`, `y`, `width`, `height`, `sourceRef`, `targetRef`)을 저장합니다.
*   **컬렉션**: 시퀀스 플로우나 메시지 플로우와 같은 연결 요소는 `Y.Array`로 관리할 수 있습니다.
*   **텍스트**: 다중 라인 텍스트(예: 주석)는 `Y.Text`를 사용하여 실시간 텍스트 편집 기능을 활용할 수 있습니다.

**예시 (개념적):**
```typescript
// Yjs Y.Doc의 루트에 BPMN 다이어그램을 위한 Y.Map 생성
const ybpmnMap = ydoc.getMap('bpmnDiagram');

// 각 BPMN 요소를 위한 Y.Map
ybpmnMap.set('task_1', new Y.Map({
  id: 'task_1',
  name: 'Process Order',
  x: 100, y: 100, width: 80, height: 80
}));

// 시퀀스 플로우를 위한 Y.Array
ybpmnMap.set('flows', new Y.Array());
ybpmnMap.get('flows').push([new Y.Map({
  id: 'flow_1',
  sourceRef: 'task_1',
  targetRef: 'gateway_1'
})]);
```

### 2.2. Yjs 변경 감지 (Listening for Yjs Changes)

Yjs의 `Y.Doc` 또는 특정 `Y.Map`, `Y.Array`에 옵저버를 설정하여 변경 사항을 감지합니다. 옵저버 콜백은 `YEvent` 객체를 제공하며, 이 객체는 변경된 내용에 대한 자세한 정보를 포함합니다.

**주요 API:**
*   `ydoc.observe(event => { /* 전체 문서 변경 감지 */ })`
*   `yMap.observe(event => { /* Y.Map 내부의 키 변경 감지 */ })`
*   `yArray.observe(event => { /* Y.Array 내부의 요소 추가/삭제/이동 감지 */ })`
*   `yText.observe(event => { /* Y.Text 내용 변경 감지 */ })`

**`YEvent`의 중요 속성:**
*   `event.target`: 변경이 발생한 Yjs 타입 (예: `Y.Map`, `Y.Array`).
*   `event.changes`: 변경된 내용에 대한 상세 정보. `Y.Map`의 경우 `keys` 속성을 통해 변경된 키를 알 수 있습니다. `Y.Array`의 경우 `delta` 속성을 통해 추가/삭제/유지된 요소를 알 수 있습니다.
*   `event.origin`: 변경을 시작한 트랜잭션의 출처를 식별합니다. 이를 사용하여 로컬에서 발생한 변경이 다시 `bpmn-js`로 반영되는 무한 루프를 방지할 수 있습니다.

### 2.3. 변경 해석 및 매핑 (Interpreting and Mapping Changes)

감지된 Yjs 변경 이벤트를 `bpmn-js`가 이해할 수 있는 모델링 작업으로 변환하는 로직을 구현합니다. 이 부분은 가장 복잡하며, Yjs 데이터 모델 설계에 크게 의존합니다.

**일반적인 매핑 시나리오:**
*   **요소 속성 변경**: `Y.Map`의 특정 키(예: `name`, `x`, `y`)가 변경되면, 해당 BPMN 요소의 속성을 업데이트합니다.
*   **요소 생성**: `Y.Map`에 새로운 키-값 쌍이 추가되거나 `Y.Array`에 새로운 요소가 추가되면, `bpmn-js`에 새로운 도형(Shape) 또는 연결(Connection)을 생성합니다.
*   **요소 삭제**: `Y.Map`에서 키-값 쌍이 삭제되거나 `Y.Array`에서 요소가 삭제되면, `bpmn-js`에서 해당 요소를 삭제합니다.
*   **요소 이동/크기 변경**: `x`, `y`, `width`, `height`와 같은 속성 변경을 감지하여 `bpmn-js`의 이동/크기 변경 API를 호출합니다.

### 2.4. `bpmn-js` API를 통한 업데이트 (Updating via `bpmn-js` API)

해석된 BPMN 모델링 작업에 따라 `bpmn-js`의 `modeling` 서비스를 사용하여 에디터의 내부 상태를 직접 업데이트합니다. `bpmn-js`의 모든 핵심 서비스는 `modeler.get('서비스이름')`을 통해 접근할 수 있습니다. 특히 모델링 작업을 위해서는 `modeling`, `elementRegistry`, `bpmnFactory`, `elementFactory` 서비스가 주로 사용됩니다.

*   **`modeling`**: 다이어그램 요소의 생성, 수정, 삭제 등 실제 모델 변경 작업을 수행하는 핵심 서비스입니다.
*   **`elementRegistry`**: 다이어그램 내의 모든 요소를 ID를 통해 관리하고 접근할 수 있도록 합니다.
*   **`bpmnFactory`**: BPMN 2.0 스펙에 맞는 비즈니스 객체(예: `bpmn:Task`, `bpmn:SequenceFlow`)를 생성합니다. 이 비즈니스 객체는 `bpmn-js` 요소의 실제 BPMN 데이터를 담고 있습니다.
*   **`elementFactory`**: `bpmn-js` 캔버스에 렌더링될 도형(Shape)이나 연결(Connection) 객체를 생성합니다. 이 객체는 시각적인 표현과 `bpmn-js` 내부 모델링 작업에 사용됩니다.

**주요 `bpmn-js` API 및 사용 예시:**
*   **`modeling.updateProperties(element, properties)`**: 요소의 속성을 업데이트합니다.
    *   **예시 (이름 변경):**
        ```javascript
        // elementRegistry에서 StartEvent_1 요소를 가져옵니다.
        const startEvent = elementRegistry.get('StartEvent_1');
        // StartEvent_1의 이름을 '새로운 시작 이벤트'로 변경합니다.
        modeling.updateProperties(startEvent, { name: '새로운 시작 이벤트' });
        ```
    *   **예시 (게이트웨이 기본 흐름 설정):**
        ```javascript
        // ExclusiveGateway_1과 SequenceFlow_3 요소를 가져옵니다.
        const exclusiveGateway = elementRegistry.get('ExclusiveGateway_1');
        const sequenceFlow = elementRegistry.get('SequenceFlow_3');
        // 게이트웨이의 기본 흐름을 SequenceFlow_3으로 설정합니다.
        modeling.updateProperties(exclusiveGateway, {
          default: sequenceFlow.businessObject
        });
        ```
    *   **예시 (태스크를 다중 인스턴스로 변경):**
        ```javascript
        // Task_1 요소를 가져옵니다.
        const task = elementRegistry.get('Task_1');
        // bpmnFactory를 사용하여 MultiInstanceLoopCharacteristics 비즈니스 객체를 생성합니다.
        const multiInstanceLoopCharacteristics = bpmnFactory.create('bpmn:MultiInstanceLoopCharacteristics');
        // Task_1에 다중 인스턴스 속성을 추가합니다.
        modeling.updateProperties(task, {
          loopCharacteristics: multiInstanceLoopCharacteristics
        });
        ```
*   **`modeling.moveShape(shape, delta, newParent)`**: 도형을 이동합니다.
*   `modeling.removeElements(elements)`: 요소를 삭제합니다.
*   **`modeling.addLane(participant, position)`**: 참가자(Participant)에 레인(Lane)을 추가합니다.
    *   **예시:**
        ```javascript
        // participant는 elementRegistry에서 가져온 bpmn:Participant 요소입니다.
        const participant = elementRegistry.get('Participant_1');
        // 참가자의 하단에 새로운 레인을 추가합니다.
        const newLane = modeling.addLane(participant, 'bottom');
        ```
*   **`modeling.splitLane(lane, count)`**: 기존 레인을 분할하여 새로운 레인을 생성합니다.
    *   **예시:**
        ```javascript
        // lane은 elementRegistry에서 가져온 bpmn:Lane 요소입니다.
        const lane = elementRegistry.get('Lane_1');
        // 기존 레인을 2개의 하위 레인으로 분할합니다.
        modeling.splitLane(lane, 2);
        ```
*   **`modeling.createShape(attrs, position, parent, is) `**: 새로운 도형을 생성합니다.
    *   **예시 (기본 태스크 생성):**
        ```javascript
        // elementFactory를 사용하여 새로운 태스크 도형을 생성합니다.
        const task = elementFactory.createShape({ type: 'bpmn:Task' });
        // 생성된 태스크를 (x: 400, y: 100) 위치에 추가하고, Process_1을 부모로 설정합니다.
        modeling.createShape(task, { x: 400, y: 100 }, elementRegistry.get('Process_1'));
        ```
    *   **예시 (비즈니스 객체를 포함한 태스크 생성):**
        ```javascript
        // bpmnFactory를 사용하여 'Task_1' ID와 'Task' 이름을 가진 비즈니스 객체를 생성합니다.
        const taskBusinessObject = bpmnFactory.create('bpmn:Task', { id: 'Task_1', name: 'Task' });
        // 생성된 비즈니스 객체를 사용하여 도형을 생성합니다.
        const task = elementFactory.createShape({ type: 'bpmn:Task', businessObject: taskBusinessObject });
        // 도형을 다이어그램에 추가합니다.
        modeling.createShape(task, { x: 400, y: 100 }, elementRegistry.get('Process_1'));
        ```
    *   **예시 (경계 이벤트 생성 및 연결):**
        ```javascript
        // 서비스 태스크와 경계 이벤트 도형을 생성합니다.
        const serviceTask = elementFactory.createShape({ type: 'bpmn:ServiceTask' });
        const boundaryEvent = elementFactory.createShape({ type: 'bpmn:BoundaryEvent' });
        // 서비스 태스크를 추가합니다.
        modeling.createShape(serviceTask, { x: 400, y: 100 }, elementRegistry.get('Process_1'));
        // 경계 이벤트를 서비스 태스크에 연결하여 추가합니다.
        modeling.createShape(boundaryEvent, { x: 400, y: 140 }, serviceTask, { attach: true });
        ```
    *   **예시 (여러 도형 한 번에 생성):**
        ```javascript
        // 메시지 시작 이벤트와 사용자 태스크 도형을 생성합니다.
        const messageStartEvent = elementFactory.createShape({
          type: 'bpmn:StartEvent',
          eventDefinitionType: 'bpmn:MessageEventDefinition',
          x: 0, y: 22 // 상대 좌표
        });
        const userTask = elementFactory.createShape({
          type: 'bpmn:UserTask',
          x: 100, y: 0 // 상대 좌표
        });
        // 두 도형을 (x: 300, y: 600)을 기준으로 Process_1에 추가합니다.
        modeling.createElements([ messageStartEvent, userTask ], { x: 300, y: 600 }, elementRegistry.get('Process_1'));
        ```
*   **`modeling.connect(source, target, attrs)`**: 두 요소를 연결합니다. 이 함수는 주로 시퀀스 플로우나 메시지 플로우와 같은 연결을 생성할 때 사용됩니다.
    *   **예시 (기존 요소 연결):**
        ```javascript
        // StartEvent_1과 Task_1 요소를 가져옵니다.
        const startEvent = elementRegistry.get('StartEvent_1');
        const task = elementRegistry.get('Task_1');
        // StartEvent_1과 Task_1을 연결합니다.
        modeling.connect(startEvent, task);
        ```
*   **`modeling.createConnection(source, target, attrs, parent)`**: 새로운 연결 요소를 생성하고 다이어그램에 추가합니다. `modeling.connect`보다 더 명시적으로 연결 타입을 지정할 때 유용합니다.
    *   **예시 (시퀀스 플로우 생성):**
        ```javascript
        // Task_1과 EndEvent_1 요소를 가져옵니다.
        const task = elementRegistry.get('Task_1');
        const endEvent = elementRegistry.get('EndEvent_1');
        // Task_1과 EndEvent_1 사이에 'bpmn:SequenceFlow' 타입의 연결을 생성합니다.
        modeling.createConnection(task, endEvent, { type: 'bpmn:SequenceFlow' }, elementRegistry.get('Process_1'));
        ```
*   `elementRegistry.get(id)`: 요소 ID를 통해 `bpmn-js` 내부의 요소 객체를 가져옵니다.
*   `canvas.zoom(scale)` / `canvas.scroll(x, y)`: 뷰포트 제어.
*   `selection.select(elements)`: 요소 선택 상태 제어.

### 2.5. 초기 로드 및 동기화 전략 (Initial Load & Sync Strategy)

1.  **초기 로드**: 에디터가 처음 로드될 때, `Y.Doc`의 현재 상태를 BPMN XML 문자열로 변환하여 `bpmn-js.importXML(xmlString)`을 호출합니다. 이 과정은 한 번만 발생합니다.
2.  **무한 루프 방지**: `bpmn-js`에서 발생한 로컬 변경이 `Yjs`로 전파되고, 다시 `Yjs` 옵저버를 통해 `bpmn-js`로 돌아오는 무한 루프를 방지해야 합니다.
    *   **`event.origin` 사용**: Yjs `YEvent`의 `origin` 속성을 사용하여 변경의 출처를 식별합니다. 로컬 `bpmn-js`에서 시작된 변경이라면, 해당 변경에 대한 `bpmn-js` 업데이트 로직을 건너뜁니다.
    *   **옵저버 일시 비활성화**: 로컬 `bpmn-js` 변경을 `Yjs`에 적용하는 동안 Yjs 옵저버를 일시적으로 비활성화하는 방법도 있지만, `origin` 속성 사용이 더 권장됩니다.

## 3. 주요 API 요약

### 3.1. Yjs API
*   `Y.Doc.observe(callback)`: 문서 전체의 변경을 감지합니다.
*   `Y.Map.observe(callback)`: `Y.Map` 내부의 키 변경을 감지합니다.
*   `Y.Array.observe(callback)`: `Y.Array` 내부의 요소 추가/삭제/이동을 감지합니다.
*   `Y.Text.observe(callback)`: `Y.Text` 내용 변경을 감지합니다.
*   `YEvent.origin`: 변경을 시작한 트랜잭션의 출처를 식별합니다.

### 3.2. `bpmn-js` API (주요 서비스)
*   `modeling`: `modeling.updateProperties`, `modeling.moveShape`, `modeling.removeElements`, `modeling.createShape`, `modeling.connect`
*   `elementRegistry`: `elementRegistry.get(id)`
*   `canvas`: `canvas.zoom`, `canvas.scroll`
*   `selection`: `selection.select`

## 4. 고려사항 및 팁

*   **복잡한 변경 처리**: 그룹 이동, 서브 프로세스 추가/삭제와 같은 복잡한 구조적 변경은 여러 개의 `bpmn-js` 모델링 API 호출을 조합하거나, 경우에 따라서는 부분적인 XML 재로드(전체 재로드가 아닌)를 고려해야 할 수도 있습니다.
*   **성능 최적화**: 변경 감지 및 매핑 로직이 너무 무거워지지 않도록 주의합니다. 필요한 경우 디바운싱(debouncing)을 적용하여 짧은 시간 내에 발생하는 여러 변경을 한 번에 처리합니다.
*   **오류 처리**: API 호출 중 발생할 수 있는 오류를 적절히 처리하여 애플리케이션의 안정성을 확보합니다.
*   **테스트 전략**: 단위 테스트와 통합 테스트를 통해 Yjs 변경이 `bpmn-js`에 정확히 반영되는지, 그리고 동시 편집 시나리오에서 문제가 없는지 철저히 검증합니다.

## 5. 결론

`bpmn-js`와 `Yjs` 통합 시 UI 끊김 현상을 해결하기 위한 세분화된 업데이트 방식은 Yjs의 변경 이벤트를 `bpmn-js`의 모델링 API 호출로 정교하게 매핑하는 것이 핵심입니다. 이는 초기 구현에 상당한 노력이 필요하지만, 결과적으로 사용자에게 훨씬 더 매끄럽고 반응성 높은 협업 경험을 제공할 것입니다. Yjs 데이터 모델 설계와 변경 매핑 로직에 대한 신중한 접근이 성공적인 구현의 열쇠입니다.
