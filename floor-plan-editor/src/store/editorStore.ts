import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { EditorState, ToolType, FloorElement, TableTemplate, Project } from '../types';

const DEFAULT_TEMPLATES: TableTemplate[] = [
  { id: 'tpl-1', name: '2 Persoane Rotund', shape: 'round', capacity: 2, width: 60, height: 60, color: '#3b82f6' },
  { id: 'tpl-2', name: '4 Persoane Pătrat', shape: 'square', capacity: 4, width: 80, height: 80, color: '#22c55e' },
  { id: 'tpl-3', name: '6 Persoane Dreptunghi', shape: 'rectangle', capacity: 6, width: 120, height: 80, color: '#f59e0b' },
];

export const useEditorStore = create<EditorState>((set, get) => ({
  // Tool
  activeTool: 'select',
  setActiveTool: (tool: ToolType) => set({ activeTool: tool }),
  
  // Canvas
  zoom: 1,
  setZoom: (zoom: number) => set({ zoom: Math.max(0.1, Math.min(3, zoom)) }),
  panOffset: { x: 0, y: 0 },
  setPanOffset: (offset) => set({ panOffset: offset }),
  
  // Grid
  showGrid: true,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  snapToGrid: true,
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  gridSize: 20,
  
  // Selection
  selectedElementId: null,
  setSelectedElementId: (id) => set({ selectedElementId: id }),
  
  // Elements
  elements: [],
  addElement: (element) => set((state) => ({ 
    elements: [...state.elements, element] 
  })),
  updateElement: (id, updates) => set((state) => ({
    elements: state.elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    )
  })),
  deleteElement: (id) => set((state) => ({
    elements: state.elements.filter(el => el.id !== id),
    selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
  })),
  
  // Table Templates
  tableTemplates: DEFAULT_TEMPLATES,
  addTableTemplate: (template) => set((state) => ({
    tableTemplates: [...state.tableTemplates, template]
  })),
  updateTableTemplate: (id, updates) => set((state) => ({
    tableTemplates: state.tableTemplates.map(t =>
      t.id === id ? { ...t, ...updates } : t
    )
  })),
  deleteTableTemplate: (id) => set((state) => ({
    tableTemplates: state.tableTemplates.filter(t => t.id !== id)
  })),
  
  // Project
  projectName: 'Proiect Nou',
  setProjectName: (name) => set({ projectName: name }),
  
  // Actions
  clearCanvas: () => set({ elements: [], selectedElementId: null }),
  
  loadProject: (project: Project) => set({
    projectName: project.name,
    elements: project.elements,
    tableTemplates: project.tableTemplates.length > 0 ? project.tableTemplates : DEFAULT_TEMPLATES,
    selectedElementId: null
  }),
  
  exportProject: () => {
    const state = get();
    return {
      id: uuidv4(),
      name: state.projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      canvasWidth: 2000,
      canvasHeight: 2000,
      elements: state.elements,
      tableTemplates: state.tableTemplates
    };
  }
}));