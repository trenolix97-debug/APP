import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { EditorState, ToolType, FloorElement, TableTemplate, Project, FloorPlan, AngleMode, MeasurePoint } from '../types';

const DEFAULT_TEMPLATES: TableTemplate[] = [
  { id: 'tpl-1', name: 'Masă 2 pers. rotundă', shape: 'round', capacity: 2, widthM: 0.8, heightM: 0.8, canCombine: false },
  { id: 'tpl-2', name: 'Masă 4 pers. pătrată', shape: 'square', capacity: 4, widthM: 0.9, heightM: 0.9, canCombine: true },
  { id: 'tpl-3', name: 'Masă 6 pers. dreptunghi', shape: 'rectangle', capacity: 6, widthM: 1.8, heightM: 0.9, canCombine: true },
  { id: 'tpl-4', name: 'Masă 8 pers. ovală', shape: 'oval', capacity: 8, widthM: 2.4, heightM: 1.2, canCombine: false },
];

const DEFAULT_FLOOR_PLAN: FloorPlan = {
  id: 'fp-1',
  name: 'Interior',
  elements: []
};

export const useEditorStore = create<EditorState>((set, get) => ({
  // Tool
  activeTool: 'select',
  setActiveTool: (tool: ToolType) => set({ activeTool: tool }),
  
  // Angle mode
  angleMode: 'free',
  setAngleMode: (mode: AngleMode) => set({ angleMode: mode }),
  
  // Scale: 50 pixels = 1 meter by default
  scale: 50,
  setScale: (scale: number) => set({ scale }),
  
  // Canvas
  zoom: 1,
  setZoom: (zoom: number) => set({ zoom: Math.max(0.2, Math.min(4, zoom)) }),
  panOffset: { x: 100, y: 100 },
  setPanOffset: (offset) => set({ panOffset: offset }),
  
  // Grid & Snap
  showGrid: true,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  snapToGrid: true,
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  snapToCorners: true,
  toggleSnapToCorners: () => set((state) => ({ snapToCorners: !state.snapToCorners })),
  gridSizeM: 0.5, // 0.5 meter grid
  
  // Selection
  selectedElementId: null,
  setSelectedElementId: (id) => set({ selectedElementId: id }),
  
  // Floor Plans
  floorPlans: [DEFAULT_FLOOR_PLAN],
  activeFloorPlanId: 'fp-1',
  
  addFloorPlan: (name: string) => {
    const newPlan: FloorPlan = {
      id: uuidv4(),
      name,
      elements: []
    };
    set((state) => ({
      floorPlans: [...state.floorPlans, newPlan],
      activeFloorPlanId: newPlan.id
    }));
  },
  
  removeFloorPlan: (id: string) => set((state) => {
    if (state.floorPlans.length <= 1) return state;
    const newPlans = state.floorPlans.filter(p => p.id !== id);
    return {
      floorPlans: newPlans,
      activeFloorPlanId: state.activeFloorPlanId === id ? newPlans[0].id : state.activeFloorPlanId
    };
  }),
  
  renameFloorPlan: (id: string, name: string) => set((state) => ({
    floorPlans: state.floorPlans.map(p => p.id === id ? { ...p, name } : p)
  })),
  
  setActiveFloorPlan: (id: string) => set({ activeFloorPlanId: id, selectedElementId: null }),
  
  // Elements
  getElements: () => {
    const state = get();
    const plan = state.floorPlans.find(p => p.id === state.activeFloorPlanId);
    return plan?.elements || [];
  },
  
  addElement: (element) => set((state) => ({
    floorPlans: state.floorPlans.map(p => 
      p.id === state.activeFloorPlanId 
        ? { ...p, elements: [...p.elements, element] }
        : p
    )
  })),
  
  updateElement: (id, updates) => set((state) => ({
    floorPlans: state.floorPlans.map(p => 
      p.id === state.activeFloorPlanId
        ? { ...p, elements: p.elements.map(el => el.id === id ? { ...el, ...updates } : el) }
        : p
    )
  })),
  
  deleteElement: (id) => set((state) => ({
    floorPlans: state.floorPlans.map(p => 
      p.id === state.activeFloorPlanId
        ? { ...p, elements: p.elements.filter(el => el.id !== id) }
        : p
    ),
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
  
  // Measure
  measureStart: null,
  measureEnd: null,
  setMeasurePoints: (start, end) => set({ measureStart: start, measureEnd: end }),
  
  // Project
  projectName: 'Proiect Nou',
  setProjectName: (name) => set({ projectName: name }),
  
  // Actions
  clearCanvas: () => set((state) => ({
    floorPlans: state.floorPlans.map(p =>
      p.id === state.activeFloorPlanId ? { ...p, elements: [] } : p
    ),
    selectedElementId: null
  })),
  
  loadProject: (project: Project) => set({
    projectName: project.name,
    scale: project.scale || 50,
    floorPlans: project.floorPlans,
    activeFloorPlanId: project.activeFloorPlanId,
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
      scale: state.scale,
      floorPlans: state.floorPlans,
      activeFloorPlanId: state.activeFloorPlanId,
      tableTemplates: state.tableTemplates
    };
  }
}));