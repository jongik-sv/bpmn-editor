import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, App as AntApp, unstableSetRender } from 'antd'
import koKR from 'antd/locale/ko_KR'
// React 19 공식 패치 적용
import '@ant-design/v5-patch-for-react-19'
import './index.css'
import './styles/antd-overrides.css'
import App from './App.tsx'

// React 19 공식 가이드에 따른 unstableSetRender 설정
unstableSetRender((node, container) => {
  // React 19와 호환되는 루트 생성
  const containerElement = container as Element & { _reactRoot?: ReturnType<typeof createRoot> };
  containerElement._reactRoot ||= createRoot(container);
  const root = containerElement._reactRoot;
  root.render(node);
  
  // 정리 함수 반환
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.unmount();
  };
});

// React 19 공식 가이드에 따른 ConfigProvider 설정
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={koKR}
      theme={{
        // React 19에서 권장하는 CSS 변수 활성화
        cssVar: true,
        hashed: false,
      }}
      form={{
        validateMessages: {
          required: '${label}은(는) 필수 항목입니다.',
          types: {
            email: '올바른 이메일 주소를 입력하세요.',
            number: '올바른 숫자를 입력하세요.',
          },
          string: {
            min: '최소 ${min}자 이상 입력하세요.',
          },
        },
      }}
      componentSize="middle"
    >
      <AntApp
        notification={{ placement: 'topRight' }}
        message={{ maxCount: 3, duration: 3 }}
      >
        <App />
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
)
