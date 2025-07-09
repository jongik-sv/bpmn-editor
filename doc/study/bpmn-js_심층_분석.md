# bpmn-js 심층 분석: 구조와 이벤트 처리

## 1. 개요

`bpmn-js`는 웹 브라우저에서 BPMN 2.0 다이어그램을 보고, 생성하고, 편집할 수 있도록 해주는 강력한 JavaScript 라이브러리입니다. 비즈니스 프로세스 모델링 표기법(BPMN)은 비즈니스 프로세스를 시각적으로 표현하기 위한 표준화된 방법이며, `bpmn-js`는 이러한 다이어그램을 웹 애플리케이션에 통합할 수 있게 해줍니다.

이 문서는 `bpmn-js`의 내부 구조와 핵심적인 이벤트 처리 메커니즘인 `EventBus`에 초점을 맞춰, 개발자가 `bpmn-js`를 더 깊이 이해하고 효과적으로 활용할 수 있도록 돕는 것을 목표로 합니다.

## 2. `bpmn-js`의 핵심 구조

`bpmn-js`는 `diagram-js`라는 범용 다이어그램 렌더링 및 편집 툴킷을 기반으로 구축되었습니다. 이러한 모듈화된 아키텍처는 `bpmn-js`의 유연성과 확장성의 핵심입니다.

### 2.1. `diagram-js` 기반의 모듈화된 아키텍처

`bpmn-js`는 여러 개의 작은 모듈과 서비스들이 결합되어 하나의 완전한 에디터를 구성하는 방식으로 설계되었습니다. 이는 `diagram-js`의 핵심 원칙인 **모듈화(Modularity)**와 **의존성 주입(Dependency Injection)** 덕분입니다.

*   **모듈(Modules)**: `bpmn-js`의 각 기능은 독립적인 모듈로 구현됩니다. 예를 들어, 다이어그램을 그리는 `Canvas` 모듈, 요소를 이동시키는 `Modeling` 모듈 등이 있습니다.
*   **서비스(Services)**: 각 모듈은 특정 기능을 제공하는 서비스들을 내부에 포함하거나 다른 모듈의 서비스를 사용합니다. 이러한 서비스들은 의존성 주입 컨테이너를 통해 서로에게 제공됩니다.

### 2.2. 주요 서비스 및 모듈

`bpmn-js`를 구성하는 핵심 서비스 및 모듈은 다음과 같습니다:

*   **`EventBus`**: (가장 중요) 모든 모듈 간의 통신을 담당하는 중앙 집중식 이벤트 시스템입니다. (자세한 내용은 3절에서 다룹니다.)
*   **`Canvas`**: 다이어그램 요소를 렌더링하고 상호작용하는 캔버스 영역을 관리합니다. 줌, 스크롤, 요소 추가/제거 등의 시각적 작업을 처리합니다.
*   **`ElementRegistry`**: 다이어그램 내의 모든 요소(도형, 연결 등)를 ID를 통해 관리하고 접근할 수 있도록 합니다.
*   **`Modeling`**: 다이어그램 요소의 생성, 삭제, 이동, 크기 조정, 속성 변경 등 실제 모델 변경 작업을 수행하는 핵심 서비스입니다.
*   **`Rules`**: 다이어그램 변경 작업(예: 요소 연결, 이동)이 BPMN 2.0 표준 및 사용자 정의 규칙에 따라 유효한지 검사합니다.
*   **`CommandStack`**: 모든 모델 변경 작업을 기록하여 실행 취소(undo) 및 다시 실행(redo) 기능을 제공합니다.
*   **`Palette`**: 에디터 좌측에 위치한 도구 모음으로, 새로운 BPMN 요소를 드래그 앤 드롭하여 다이어그램에 추가할 수 있게 합니다.
*   **`ContextPad`**: 요소를 선택했을 때 나타나는 컨텍스트 메뉴로, 해당 요소에 대한 빠른 작업(예: 삭제, 연결)을 제공합니다.
*   **`BpmnFactory`**: BPMN 2.0 요소의 인스턴스를 생성하는 팩토리입니다.
*   **`BpmnModdle`**: BPMN 2.0 XML을 JavaScript 객체로 파싱하고, 다시 XML로 직렬화하는 기능을 제공합니다.

### 2.3. 뷰어(Viewer)와 모델러(Modeler)의 차이

`bpmn-js`는 두 가지 주요 모드로 사용될 수 있습니다:

*   **`BpmnJS` (Viewer)**: BPMN 다이어그램을 단순히 보여주는(렌더링) 기능만 제공합니다. 편집 기능은 포함되지 않습니다.
*   **`BpmnJS` (Modeler)**: `Viewer`의 기능에 더해 다이어그램을 편집하고 조작할 수 있는 모든 기능을 포함합니다. 일반적으로 `Modeling`, `Palette`, `ContextPad` 등의 모듈이 추가됩니다.

### 2.4. 의존성 주입(Dependency Injection) 개념

`bpmn-js`는 `diagram-js`의 의존성 주입 시스템을 활용합니다. 이는 모듈들이 필요한 서비스들을 직접 생성하는 대신, 컨테이너로부터 주입받는 방식입니다.

```javascript
// 예시: EventBus와 Modeling 서비스를 주입받는 커스텀 모듈
function MyCustomModule(eventBus, modeling) {
  // eventBus와 modeling 서비스를 사용하여 로직 구현
  eventBus.on('element.click', function(event) {
    console.log('Element clicked:', event.element);
    modeling.updateProperties(event.element, { name: 'Clicked Element' });
  });
}

// 의존성 주입을 위해 서비스 이름을 배열로 명시
MyCustomModule.$inject = ['eventBus', 'modeling'];

// bpmn-js 인스턴스 생성 시 모듈 추가
const bpmnjs = new BpmnJS({
  container: '#canvas',
  additionalModules: [
    {
      __init__: [ 'myCustomModule' ],
      myCustomModule: [ 'type', MyCustomModule ]
    }
  ]
});
```
이러한 방식은 모듈 간의 결합도를 낮추고, 테스트 용이성을 높이며, `bpmn-js`의 기능을 쉽게 확장할 수 있도록 합니다.

## 3. 이벤트 처리: `EventBus`의 역할

`EventBus`는 `bpmn-js` 아키텍처의 심장과 같습니다. 모든 모듈과 서비스는 `EventBus`를 통해 서로 통신하며, 이는 강력한 확장성과 유연성을 제공합니다.

### 3.1. `EventBus`의 중요성 및 목적

*   **중앙 집중식 통신**: 모든 이벤트가 `EventBus`를 통해 발생하고 전달되므로, 모듈 간의 직접적인 의존성을 줄이고 느슨한 결합을 가능하게 합니다.
*   **확장성**: 개발자는 `EventBus`에 커스텀 리스너를 등록하여 `bpmn-js`의 기본 동작을 확장하거나 변경할 수 있습니다.
*   **디버깅 용이성**: 모든 이벤트 흐름을 한 곳에서 관찰할 수 있어 디버깅이 용이합니다.

### 3.2. `EventBus` 주요 API

`EventBus`는 주로 세 가지 메서드를 통해 이벤트를 관리합니다:

*   **`on(event, priority, handler)`**: 특정 이벤트가 발생했을 때 실행될 핸들러 함수를 등록합니다.
    *   `event`: 감지할 이벤트의 이름 (문자열, 예: `'element.click'`, `'shape.added'`).
    *   `priority` (선택 사항): 핸들러의 실행 우선순위 (숫자). 숫자가 높을수록 먼저 실행됩니다. 기본값은 1000입니다.
    *   `handler`: 이벤트가 발생했을 때 호출될 함수. 이벤트 데이터가 인자로 전달됩니다.
*   **`off(event, handler)`**: 이전에 등록된 핸들러를 제거합니다.
*   **`fire(event, data)`**: 특정 이벤트를 발생시키고, 등록된 모든 핸들러를 실행합니다.
    *   `event`: 발생시킬 이벤트의 이름.
    *   `data` (선택 사항): 이벤트와 함께 전달할 데이터 객체.

### 3.3. 일반적인 이벤트 타입 및 사용 예시

`bpmn-js`는 다양한 내부 이벤트를 발생시킵니다. 몇 가지 중요한 이벤트 타입과 사용 예시는 다음과 같습니다:

*   **`element.click`**: 다이어그램 요소(도형 또는 연결)가 클릭되었을 때 발생합니다.
    ```javascript
    eventBus.on('element.click', function(event) {
      console.log('요소 클릭됨:', event.element); // 클릭된 요소 객체
    });
    ```
*   **`shape.added`**: 새로운 도형이 캔버스에 추가되었을 때 발생합니다.
    ```javascript
    eventBus.on('shape.added', function(event) {
      console.log('새로운 도형 추가됨:', event.element);
    });
    ```
*   **`element.changed`**: 요소의 속성(예: 이름, 위치)이 변경되었을 때 발생합니다.
    ```javascript
    eventBus.on('element.changed', function(event) {
      console.log('요소 변경됨:', event.element);
    });
    ```
*   **`commandStack.changed`**: 실행 취소/다시 실행 스택에 변경이 발생했을 때 (예: 새로운 명령이 추가되거나 실행/취소될 때) 발생합니다.
    ```javascript
    eventBus.on('commandStack.changed', function() {
      console.log('명령 스택 변경됨');
      // 실행 취소/다시 실행 버튼 활성화/비활성화 로직 등에 활용
    });
    ```
*   **`canvas.viewbox.changed`**: 캔버스의 뷰포트(줌 레벨, 스크롤 위치)가 변경되었을 때 발생합니다.
    ```javascript
    eventBus.on('canvas.viewbox.changed', function(event) {
      console.log('뷰포트 변경됨:', event.viewbox);
    });
    ```
*   **`diagram.init` / `diagram.destroy`**: 다이어그램이 초기화되거나 파괴될 때 발생합니다. 에디터의 생명 주기 관리에 유용합니다.

### 3.4. 이벤트 우선순위 및 전파

`EventBus`는 핸들러 등록 시 우선순위를 지정할 수 있습니다. 이는 여러 핸들러가 동일한 이벤트에 반응할 때 실행 순서를 제어하는 데 유용합니다.

```javascript
eventBus.on('element.click', 1000, function(event) {
  console.log('우선순위 1000 핸들러');
});

eventBus.on('element.click', 2000, function(event) {
  console.log('우선순위 2000 핸들러 (먼저 실행됨)');
});
```
또한, 이벤트는 `EventBus`를 통해 전파되며, 핸들러는 `event.stopPropagation()`을 호출하여 이벤트 전파를 중단할 수 있습니다.

## 4. `bpmn-js` 확장성

`bpmn-js`의 모듈화된 아키텍처와 `EventBus`는 강력한 확장성을 제공합니다. 개발자는 커스텀 모듈을 생성하고 이를 `bpmn-js` 인스턴스에 추가하여 새로운 기능을 구현하거나 기존 동작을 변경할 수 있습니다.

커스텀 모듈은 `EventBus`를 통해 `bpmn-js`의 다른 서비스들과 상호작용하고, 필요한 이벤트를 감지하거나 새로운 이벤트를 발생시킬 수 있습니다. 이는 `bpmn-js`를 특정 비즈니스 요구사항에 맞춰 커스터마이징하는 데 필수적인 요소입니다.

## 5. 결론

`bpmn-js`는 `diagram-js`를 기반으로 하는 모듈화되고 확장 가능한 아키텍처를 가지고 있습니다. 이 아키텍처의 핵심은 모든 모듈 간의 통신을 담당하는 `EventBus`입니다. `EventBus`를 이해하고 활용하는 것은 `bpmn-js`의 동작을 제어하고, 커스텀 기능을 추가하며, 복잡한 협업 시나리오를 구현하는 데 필수적입니다.

이 문서를 통해 `bpmn-js`의 구조와 이벤트 처리 방식에 대한 기본적인 이해를 얻으셨기를 바랍니다. 더 깊은 학습을 위해서는 `bpmn-js` 공식 문서와 예제 코드를 직접 탐색해보는 것을 권장합니다.
