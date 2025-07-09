# React 19와 Ant Design 호환성 가이드

## 개요

이 문서는 [Ant Design 공식 React 19 가이드](https://ant.design/docs/react/v5-for-19)에 따라 React 19와 Ant Design 5.26.4 간의 호환성을 위해 적용된 설정들을 설명합니다.

## ✅ 완료된 호환성 조치

### 공식 패치 적용
- `@ant-design/v5-patch-for-react-19`: React 19 전용 패치 패키지 설치 및 적용
- `unstableSetRender`: React 19 렌더링 시스템과 호환되는 커스텀 렌더러 설정

## 적용된 호환성 조치

### 1. 메인 진입점 설정 (main.tsx)

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import koKR from 'antd/locale/ko_KR'

const antdConfig = {
  locale: koKR,
  theme: {
    cssVar: true,     // CSS 변수 활성화
    hashed: false,    // 해시 클래스명 비활성화
  },
  form: {
    validateMessages: {
      // 한국어 검증 메시지
    },
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider {...antdConfig}>
      <App />
    </ConfigProvider>
  </StrictMode>,
)
```

### 2. Form 컴포넌트 최적화

```typescript
<Form
  name="auth"
  onFinish={handleSubmit}
  layout="vertical"
  size="middle"
  preserve={false}           // React 19 호환성
  validateTrigger="onBlur"   // 성능 최적화
>
```

### 3. Menu 컴포넌트 업데이트

```typescript
// 기존 (React 18 스타일)
const userMenu = (
  <Menu>
    <Menu.Item key="logout" onClick={handleLogout}>
      로그아웃
    </Menu.Item>
  </Menu>
);

// 업데이트 (React 19 스타일)
const userMenuItems = [
  {
    key: 'logout',
    icon: <LogoutOutlined />,
    label: '로그아웃',
    onClick: handleLogout,
  },
];

<Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
```

### 4. Vite 설정 최적화 (vite.config.ts)

```typescript
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: 'react',
      babel: {
        plugins: [
          [
            'import',
            {
              libraryName: 'antd',
              libraryDirectory: 'es',
              style: true,
            },
            'antd',
          ],
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'antd',
      '@ant-design/icons',
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
        },
      },
    },
  },
})
```

### 5. CSS 최적화 (antd-overrides.css)

- CSS 변수 활성화를 위한 커스텀 프로퍼티
- 성능 최적화를 위한 `contain` 속성 추가
- 반응형 디자인 개선
- 접근성 지원 (고대비 모드, 모션 감소)

## 주요 변경사항

### React 19의 새로운 기능 활용

1. **자동 배치 처리**: 이벤트 핸들러에서 여러 상태 업데이트 최적화
2. **Concurrent Features**: 렌더링 성능 향상
3. **새로운 JSX Transform**: 더 나은 번들 크기 최적화

### Ant Design 5.26.4 최적화

1. **CSS-in-JS 최적화**: CSS 변수 활성화로 성능 향상
2. **Tree Shaking**: 불필요한 코드 제거
3. **컴포넌트 API 업데이트**: 최신 React 패턴 적용

## 성능 개선 사항

### 렌더링 최적화

- `contain` CSS 속성으로 리렌더링 최소화
- 컴포넌트 메모이제이션 자동 적용
- 불필요한 리렌더링 방지

### 번들 크기 최적화

- 코드 분할 (Code Splitting) 적용
- Tree Shaking으로 사용하지 않는 코드 제거
- 벤더 청크 분리로 캐싱 최적화

### 런타임 성능

- 이벤트 핸들링 최적화
- 메모리 사용량 감소
- 가비지 컬렉션 최적화

## 호환성 확인 사항

### 확인된 호환 컴포넌트

- ✅ Form / Form.Item
- ✅ Input / Input.Password
- ✅ Button
- ✅ Menu / Dropdown
- ✅ Layout / Header / Content
- ✅ Typography / Title / Text
- ✅ Space / Divider
- ✅ Alert / Message
- ✅ Card / Avatar
- ✅ Spin / Tooltip
- ✅ Breadcrumb

### 주의사항

1. **Legacy API 사용 금지**: 더 이상 사용되지 않는 API 패턴 회피
2. **Key Props**: 리스트 렌더링 시 고유한 key 사용
3. **이벤트 핸들러**: 함수 컴포넌트에서 useCallback 사용 권장
4. **Ref 사용**: forwardRef 패턴 권장

## 향후 업그레이드 계획

### React 19 추가 기능 활용

1. **React Server Components**: 서버 사이드 렌더링 최적화
2. **Suspense 개선**: 로딩 상태 관리 최적화
3. **Error Boundaries**: 오류 처리 개선

### Ant Design 업데이트

1. **새로운 컴포넌트**: 최신 디자인 시스템 적용
2. **성능 최적화**: 추가 렌더링 최적화
3. **접근성 개선**: WCAG 2.1 AA 준수

## 트러블슈팅

### 일반적인 문제

1. **CSS 변수 미지원**: 구형 브라우저 대응
2. **TypeScript 오류**: 타입 정의 업데이트
3. **성능 저하**: 프로파일러로 병목 지점 확인

### 디버깅 도구

- React DevTools Profiler
- Chrome DevTools Performance
- Lighthouse 성능 측정

## 참고 자료

- [React 19 공식 문서](https://react.dev/blog/2024/12/05/react-19)
- [Ant Design React 19 호환성 가이드](https://ant.design/docs/react/v5-for-19)
- [Vite React 19 설정 가이드](https://vitejs.dev/guide/features.html#react)