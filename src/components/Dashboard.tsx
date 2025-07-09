import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Menu, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Dropdown, 
  Avatar, 
  List, 
  Modal, 
  Form, 
  Input, 
  message,
  Empty,
  Spin
} from 'antd';
import { 
  FolderOutlined, 
  FileOutlined, 
  PlusOutlined, 
  UserOutlined, 
  LogoutOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useNavigate } from 'react-router-dom';
import type { Project, Diagram, ProjectFormData, DiagramFormData } from '../types';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    projects, 
    currentProject, 
    diagrams, 
    loading,
    loadProjects,
    createProject,
    createDiagram,
    selectProject,
    updateProject,
    deleteProject,
    updateDiagram,
    deleteDiagram
  } = useProject();
  const navigate = useNavigate();

  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [diagramModalVisible, setDiagramModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingDiagram, setEditingDiagram] = useState<Diagram | null>(null);

  const [projectForm] = Form.useForm();
  const [diagramForm] = Form.useForm();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async (values: ProjectFormData) => {
    try {
      const newProject = await createProject(values.name, values.description);
      message.success('프로젝트가 생성되었습니다.');
      setProjectModalVisible(false);
      projectForm.resetFields();
      selectProject(newProject);
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : '프로젝트 생성에 실패했습니다.');
    }
  };

  const handleUpdateProject = async (values: Partial<ProjectFormData>) => {
    if (!editingProject) return;
    
    try {
      await updateProject(editingProject.id, values);
      message.success('프로젝트가 수정되었습니다.');
      setProjectModalVisible(false);
      setEditingProject(null);
      projectForm.resetFields();
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : '프로젝트 수정에 실패했습니다.');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    Modal.confirm({
      title: '프로젝트를 삭제하시겠습니까?',
      content: '삭제된 프로젝트는 복구할 수 없습니다.',
      okText: '삭제',
      cancelText: '취소',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteProject(projectId);
          message.success('프로젝트가 삭제되었습니다.');
        } catch (error: unknown) {
          message.error(error instanceof Error ? error.message : '프로젝트 삭제에 실패했습니다.');
        }
      },
    });
  };

  const handleCreateDiagram = async (values: DiagramFormData) => {
    if (!currentProject) return;
    
    try {
      const newDiagram = await createDiagram(values.name, currentProject.id);
      message.success('다이어그램이 생성되었습니다.');
      setDiagramModalVisible(false);
      diagramForm.resetFields();
      navigate(`/editor/${newDiagram.id}`);
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : '다이어그램 생성에 실패했습니다.');
    }
  };

  const handleUpdateDiagram = async (values: Partial<DiagramFormData>) => {
    if (!editingDiagram) return;
    
    try {
      await updateDiagram(editingDiagram.id, values);
      message.success('다이어그램이 수정되었습니다.');
      setDiagramModalVisible(false);
      setEditingDiagram(null);
      diagramForm.resetFields();
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : '다이어그램 수정에 실패했습니다.');
    }
  };

  const handleDeleteDiagram = async (diagramId: string) => {
    Modal.confirm({
      title: '다이어그램을 삭제하시겠습니까?',
      content: '삭제된 다이어그램은 복구할 수 없습니다.',
      okText: '삭제',
      cancelText: '취소',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteDiagram(diagramId);
          message.success('다이어그램이 삭제되었습니다.');
        } catch (error: unknown) {
          message.error(error instanceof Error ? error.message : '다이어그램 삭제에 실패했습니다.');
        }
      },
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      message.success('로그아웃되었습니다.');
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : '로그아웃에 실패했습니다.');
    }
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        로그아웃
      </Menu.Item>
    </Menu>
  );

  const projectActions = (project: Project) => (
    <Menu>
      <Menu.Item 
        key="edit" 
        icon={<EditOutlined />}
        onClick={() => {
          setEditingProject(project);
          projectForm.setFieldsValue(project);
          setProjectModalVisible(true);
        }}
      >
        수정
      </Menu.Item>
      <Menu.Item 
        key="delete" 
        icon={<DeleteOutlined />}
        onClick={() => handleDeleteProject(project.id)}
      >
        삭제
      </Menu.Item>
    </Menu>
  );

  const diagramActions = (diagram: Diagram) => (
    <Menu>
      <Menu.Item 
        key="edit" 
        icon={<EditOutlined />}
        onClick={() => {
          setEditingDiagram(diagram);
          diagramForm.setFieldsValue(diagram);
          setDiagramModalVisible(true);
        }}
      >
        이름 수정
      </Menu.Item>
      <Menu.Item 
        key="delete" 
        icon={<DeleteOutlined />}
        onClick={() => handleDeleteDiagram(diagram.id)}
      >
        삭제
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="bg-white shadow-sm border-b">
        <div className="flex justify-between items-center h-full">
          <Title level={3} className="m-0 text-gray-800">
            BPMN 협업 에디터
          </Title>
          <Dropdown overlay={userMenu} placement="bottomRight">
            <div className="flex items-center cursor-pointer">
              <Avatar 
                src={user?.avatar_url} 
                icon={<UserOutlined />} 
                className="mr-2"
              />
              <Text>{user?.display_name || user?.email}</Text>
            </div>
          </Dropdown>
        </div>
      </Header>

      <Layout>
        <Sider width={300} className="bg-white shadow-sm">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <Title level={4} className="m-0">프로젝트</Title>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingProject(null);
                  projectForm.resetFields();
                  setProjectModalVisible(true);
                }}
              >
                새 프로젝트
              </Button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <Spin size="large" />
              </div>
            ) : (
              <List
                dataSource={projects}
                renderItem={(project) => (
                  <List.Item
                    className={`cursor-pointer hover:bg-gray-50 p-3 rounded ${
                      currentProject?.id === project.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => selectProject(project)}
                    actions={[
                      <Dropdown 
                        overlay={projectActions(project)} 
                        placement="bottomRight"
                        trigger={['click']}
                      >
                        <Button 
                          type="text" 
                          icon={<MoreOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FolderOutlined className="text-blue-500" />}
                      title={project.name}
                      description={project.description}
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        </Sider>

        <Content className="p-6">
          {currentProject ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <Title level={2} className="mb-2">{currentProject.name}</Title>
                  <Text type="secondary">{currentProject.description}</Text>
                </div>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingDiagram(null);
                    diagramForm.resetFields();
                    setDiagramModalVisible(true);
                  }}
                >
                  새 다이어그램
                </Button>
              </div>

              {diagrams.length === 0 ? (
                <Empty
                  description="아직 다이어그램이 없습니다"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingDiagram(null);
                      diagramForm.resetFields();
                      setDiagramModalVisible(true);
                    }}
                  >
                    첫 번째 다이어그램 만들기
                  </Button>
                </Empty>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {diagrams.map((diagram) => (
                    <Card
                      key={diagram.id}
                      hoverable
                      className="cursor-pointer"
                      onClick={() => navigate(`/editor/${diagram.id}`)}
                      actions={[
                        <Dropdown 
                          overlay={diagramActions(diagram)} 
                          placement="bottomRight"
                          trigger={['click']}
                        >
                          <Button 
                            type="text" 
                            icon={<MoreOutlined />}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Dropdown>
                      ]}
                    >
                      <Card.Meta
                        avatar={<FileOutlined className="text-green-500" />}
                        title={diagram.name}
                        description={
                          <div>
                            <Text type="secondary" className="text-sm">
                              {diagram.updated_at ? new Date(diagram.updated_at).toLocaleDateString() : ''}
                            </Text>
                          </div>
                        }
                      />
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Empty
                description="프로젝트를 선택하거나 새 프로젝트를 만들어보세요"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          )}
        </Content>
      </Layout>

      {/* Project Modal */}
      <Modal
        title={editingProject ? '프로젝트 수정' : '새 프로젝트'}
        open={projectModalVisible}
        onCancel={() => {
          setProjectModalVisible(false);
          setEditingProject(null);
          projectForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={projectForm}
          layout="vertical"
          onFinish={editingProject ? handleUpdateProject : handleCreateProject}
        >
          <Form.Item
            name="name"
            label="프로젝트 이름"
            rules={[{ required: true, message: '프로젝트 이름을 입력해주세요!' }]}
          >
            <Input placeholder="프로젝트 이름" />
          </Form.Item>
          <Form.Item
            name="description"
            label="설명"
          >
            <Input.TextArea rows={3} placeholder="프로젝트 설명 (선택사항)" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingProject ? '수정' : '생성'}
              </Button>
              <Button 
                onClick={() => {
                  setProjectModalVisible(false);
                  setEditingProject(null);
                  projectForm.resetFields();
                }}
              >
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Diagram Modal */}
      <Modal
        title={editingDiagram ? '다이어그램 수정' : '새 다이어그램'}
        open={diagramModalVisible}
        onCancel={() => {
          setDiagramModalVisible(false);
          setEditingDiagram(null);
          diagramForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={diagramForm}
          layout="vertical"
          onFinish={editingDiagram ? handleUpdateDiagram : handleCreateDiagram}
        >
          <Form.Item
            name="name"
            label="다이어그램 이름"
            rules={[{ required: true, message: '다이어그램 이름을 입력해주세요!' }]}
          >
            <Input placeholder="다이어그램 이름" />
          </Form.Item>
          <Form.Item
            name="description"
            label="설명"
          >
            <Input.TextArea rows={3} placeholder="다이어그램 설명 (선택사항)" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingDiagram ? '수정' : '생성'}
              </Button>
              <Button 
                onClick={() => {
                  setDiagramModalVisible(false);
                  setEditingDiagram(null);
                  diagramForm.resetFields();
                }}
              >
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Dashboard;