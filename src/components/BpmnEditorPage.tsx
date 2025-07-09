import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Breadcrumb, 
  Button, 
  Space, 
  Typography, 
  message, 
  Spin, 
  Avatar, 
  Tooltip,
  Dropdown
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  DownloadOutlined, 
  ShareAltOutlined,
  UserOutlined,
  LogoutOutlined,
  UndoOutlined,
  RedoOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { CollaborationProvider } from '../providers/CollaborationProvider';
import NewCollaborativeBpmnEditor from './NewCollaborativeBpmnEditor';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const BpmnEditorPage: React.FC = () => {
  const { diagramId } = useParams<{ diagramId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { 
    currentProject, 
    diagrams, 
    saveDiagramXml 
  } = useProject();

  const [currentDiagram, setCurrentDiagram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bpmnXml, setBpmnXml] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Load diagram data
  useEffect(() => {
    if (diagramId) {
      const diagram = diagrams.find(d => d.id === diagramId);
      if (diagram) {
        setCurrentDiagram(diagram);
        setBpmnXml(diagram.bpmn_xml);
        setLoading(false);
      } else {
        // If diagram not found in current diagrams, try to load from all projects
        // This is a simplified approach - in real app, you'd fetch diagram by ID
        setLoading(false);
      }
    }
  }, [diagramId, diagrams]);

  const handleSave = async () => {
    if (!currentDiagram || !bpmnXml) return;

    setSaving(true);
    try {
      await saveDiagramXml(currentDiagram.id, bpmnXml);
      setIsDirty(false);
      message.success('저장되었습니다.');
    } catch (error: any) {
      message.error(error.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleXmlChange = (xml: string) => {
    setBpmnXml(xml);
    setIsDirty(true);
  };

  const handleDownload = () => {
    if (!currentDiagram || !bpmnXml) return;

    const element = document.createElement('a');
    const file = new Blob([bpmnXml], { type: 'application/xml' });
    element.href = URL.createObjectURL(file);
    element.download = `${currentDiagram.name}.bpmn`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleLogout = async () => {
    try {
      await logout();
      message.success('로그아웃되었습니다.');
    } catch (error: any) {
      message.error(error.message || '로그아웃에 실패했습니다.');
    }
  };

  // React 19 호환성을 위한 Menu 설정
  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      onClick: handleLogout,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!currentDiagram) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Title level={3}>다이어그램을 찾을 수 없습니다</Title>
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            대시보드로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="bg-white shadow-sm border-b px-4">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              대시보드
            </Button>
            
            <Breadcrumb>
              <Breadcrumb.Item>
                <Text type="secondary">{currentProject?.name || '프로젝트'}</Text>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <Text strong>{currentDiagram.name}</Text>
              </Breadcrumb.Item>
            </Breadcrumb>
          </div>

          <Space size="middle">
            <Space>
              <Tooltip title="실행 취소">
                <Button icon={<UndoOutlined />} />
              </Tooltip>
              <Tooltip title="다시 실행">
                <Button icon={<RedoOutlined />} />
              </Tooltip>
            </Space>

            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                disabled={!isDirty}
              >
                저장
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownload}
              >
                다운로드
              </Button>
              <Button
                icon={<ShareAltOutlined />}
                onClick={() => message.info('공유 기능 준비중입니다.')}
              >
                공유
              </Button>
            </Space>

            <div className="flex items-center">
              <Space>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                />
                <Text type="secondary">1 명 편집 중</Text>
              </Space>
            </div>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center cursor-pointer">
                <Avatar 
                  icon={<UserOutlined />} 
                  size="small"
                />
              </div>
            </Dropdown>
          </Space>
        </div>
      </Header>

      <Content style={{ padding: 0 }}>
        <CollaborationProvider 
          documentId={currentDiagram.id}
          userId={user?.id || ''}
          userName={user?.email || 'Anonymous'}
        >
          <NewCollaborativeBpmnEditor 
            diagramId={currentDiagram.id}
            initialXml={bpmnXml}
            onChange={handleXmlChange}
          />
        </CollaborationProvider>
      </Content>
    </Layout>
  );
};

export default BpmnEditorPage;