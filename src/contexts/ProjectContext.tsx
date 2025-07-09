import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './AuthContext';
import { useAuth } from './AuthContext';
import { Project, Diagram, Folder } from '../types';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  diagrams: Diagram[];
  folders: Folder[];
  loading: boolean;
  loadProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  selectProject: (project: Project) => void;
  loadDiagrams: (projectId: string) => Promise<void>;
  createDiagram: (name: string, projectId: string, folderId?: string) => Promise<Diagram>;
  updateDiagram: (id: string, updates: Partial<Diagram>) => Promise<void>;
  deleteDiagram: (id: string) => Promise<void>;
  saveDiagramXml: (id: string, xml: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProjects = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (name: string, description?: string): Promise<Project> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          name,
          description,
          owner_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    
    const newProject = data as Project;
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    if (currentProject?.id === id) {
      setCurrentProject(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setProjects(prev => prev.filter(p => p.id !== id));
    if (currentProject?.id === id) {
      setCurrentProject(null);
    }
  };

  const selectProject = (project: Project) => {
    setCurrentProject(project);
    loadDiagrams(project.id);
  };

  const loadDiagrams = async (projectId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('diagrams')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDiagrams(data || []);
    } catch (error) {
      console.error('Error loading diagrams:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDiagram = async (name: string, projectId: string, folderId?: string): Promise<Diagram> => {
    if (!user) throw new Error('User not authenticated');
    const defaultXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_${Date.now()}" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_${Date.now()}" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_${Date.now()}">
      <bpmndi:BPMNShape id="BPMNShape_1" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="159" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

    const { data, error } = await supabase
      .from('diagrams')
      .insert([
        {
          name,
          bpmn_xml: defaultXml,
          project_id: projectId,
          folder_id: folderId,
          created_by: user!.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    
    const newDiagram = data as Diagram;
    setDiagrams(prev => [newDiagram, ...prev]);
    return newDiagram;
  };

  const updateDiagram = async (id: string, updates: Partial<Diagram>) => {
    const { error } = await supabase
      .from('diagrams')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    
    setDiagrams(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDiagram = async (id: string) => {
    const { error } = await supabase
      .from('diagrams')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setDiagrams(prev => prev.filter(d => d.id !== id));
  };

  const saveDiagramXml = async (id: string, xml: string) => {
    const { error } = await supabase
      .from('diagrams')
      .update({ bpmn_xml: xml, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    
    setDiagrams(prev => prev.map(d => 
      d.id === id 
        ? { ...d, bpmn_xml: xml, updated_at: new Date().toISOString() }
        : d
    ));
  };

  // Load projects when user changes
  useEffect(() => {
    if (user) {
      loadProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
      setDiagrams([]);
      setFolders([]);
    }
  }, [user]);

  const value = {
    projects,
    currentProject,
    diagrams,
    folders,
    loading,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    selectProject,
    loadDiagrams,
    createDiagram,
    updateDiagram,
    deleteDiagram,
    saveDiagramXml,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};