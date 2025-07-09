import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { unstableSetRender } from 'antd';

unstableSetRender((node, container) => {
  container._reactRoot ||= createRoot(container);
  const root = container._reactRoot;
  root.render(node);
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.unmount();
  };
});
import { ConfigProvider, App as AntApp } from 'antd'
import koKR from 'antd/locale/ko_KR'

import './index.css'
import './styles/antd-overrides.css'
import App from './App.tsx'

// React 19와 Ant Design 호환성을 위한 공식 설정
const antdConfig = {
  locale: koKR,
  theme: {
    // React 19 공식 권장 설정
    cssVar: {
      prefix: 'ant',
      key: 'app',
    },
    hashed: false,
  },
  // React 19와 호환되는 Form 설정
  form: {
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
  },
  // React 19 호환성을 위한 컴포넌트 설정
  componentSize: 'middle',
  // 메시지 및 알림 시스템 최적화
  notification: {
    placement: 'topRight',
  },
  message: {
    maxCount: 3,
    duration: 3,
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider {...antdConfig}>
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
)
