import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, message, Divider, Alert } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import type { LoginCredentials, SignupCredentials } from '../types';

const { Title, Text } = Typography;

interface FormValues {
  email: string;
  password: string;
  display_name?: string;
}

const LoginPage: React.FC = () => {
  const [formLoading, setFormLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const { login, loginWithGoogle, signup, loading, error, clearError } = useAuth();

  // Clear error when switching between login/signup
  useEffect(() => {
    clearError();
  }, [isLogin, clearError]);

  const handleSubmit = async (values: FormValues) => {
    setFormLoading(true);
    try {
      if (isLogin) {
        const credentials: LoginCredentials = {
          email: values.email,
          password: values.password,
        };
        await login(credentials);
        message.success('로그인 성공!');
      } else {
        const credentials: SignupCredentials = {
          email: values.email,
          password: values.password,
          display_name: values.display_name,
        };
        await signup(credentials);
        message.success('회원가입 성공! 이메일을 확인해주세요.');
      }
    } catch (error: any) {
      // Error is already set in context, just show message
      message.error(error.message || '인증에 실패했습니다.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error: any) {
      message.error(error.message || 'Google 로그인에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-2xl" style={{ maxWidth: '380px', padding: '16px' }}>
        <div className="text-center mb-6">
          <Title level={3} className="text-gray-800 mb-2">
            BPMN 협업 에디터
          </Title>
          <Text type="secondary">
            실시간 협업으로 BPMN 다이어그램을 편집하세요
          </Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            closable
            onClose={clearError}
            className="mb-4"
          />
        )}

        <Form
          name="auth"
          onFinish={handleSubmit}
          layout="vertical"
          size="middle"
          // React 19 공식 권장 설정
          preserve={false}
          validateTrigger={['onChange', 'onBlur']}
          scrollToFirstError
          requiredMark={false}
        >
          {!isLogin && (
            <Form.Item
              name="display_name"
              label="이름"
              rules={[{ required: true, message: '이름을 입력해주세요!' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="이름"
              />
            </Form.Item>
          )}

          <Form.Item
            name="email"
            label="이메일"
            rules={[
              { required: true, message: '이메일을 입력해주세요!' },
              { type: 'email', message: '올바른 이메일 형식이 아닙니다!' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="이메일"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="비밀번호"
            rules={[
              { required: true, message: '비밀번호를 입력해주세요!' },
              { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다!' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="비밀번호"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={formLoading || loading}
              className="w-full"
            >
              {isLogin ? '로그인' : '회원가입'}
            </Button>
          </Form.Item>
        </Form>

        <Divider>또는</Divider>

        <Button
          icon={<GoogleOutlined />}
          onClick={handleGoogleLogin}
          loading={loading}
          className="w-full mb-4"
        >
          Google로 로그인
        </Button>

        <div className="text-center">
          <Text type="secondary">
            {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
          </Text>
          <Button
            type="link"
            onClick={() => setIsLogin(!isLogin)}
            className="p-0 ml-2"
          >
            {isLogin ? '회원가입' : '로그인'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;