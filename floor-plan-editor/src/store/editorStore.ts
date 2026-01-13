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

const MAX_HISTORY = 50;

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
  setZoom: (zoom: number) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
  panOffset: { x: 100, y: 100 },
  setPanOffset: (offset) => set({ panOffset: offset }),
  
  // Grid & Snap
  showGrid: true,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  snapToGrid: true,
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  snapToCorners: true,
  toggleSnapToCorners: () => set((state) => ({ snapToCorners: !state.snapToCorners })),
  gridSizeM: 0.5,
  
  // Rulers
  showRulers: true,
  toggleRulers: () => set((state) => ({ showRulers: !state.showRulers })),
  
  // Selection
  selectedElementId: null,
  setSelectedElementId: (id) => set({ selectedElementId: id }),
  selectedElementIds: [],
  setSelectedElementIds: (ids) => set({ selectedElementIds: ids }),
  
  // Clipboard
  clipboard: null,
  setClipboard: (elements) => set({ clipboard: elements }),
  
  // History (Undo/Redo)
  history: [],
  historyIndex: -1,
  
  pushHistory: () => {
    const state = get();
    const currentState = JSON.stringify(state.floorPlans);
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(currentState);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },
  
  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      const previousState = JSON.parse(state.history[newIndex]);
      set({ floorPlans: previousState, historyIndex: newIndex, selectedElementId: null });
    }
  },
  
  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      const nextState = JSON.parse(state.history[newIndex]);
      set({ floorPlans: nextState, historyIndex: newIndex, selectedElementId: null });
    }
  },
  
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
  
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
    get().pushHistory();
  },
  
  removeFloorPlan: (id: string) => {
    const state = get();
    if (state.floorPlans.length <= 1) return;
    const newPlans = state.floorPlans.filter(p => p.id !== id);
    set({
      floorPlans: newPlans,
      activeFloorPlanId: state.activeFloorPlanId === id ? newPlans[0].id : state.activeFloorPlanId
    });
    get().pushHistory();
  },
  
  renameFloorPlan: (id: string, name: string) => set((state) => ({
    floorPlans: state.floorPlans.map(p => p.id === id ? { ...p, name } : p)
  })),
  
  setActiveFloorPlan: (id: string) => set({ activeFloorPlanId: id, selectedElementId: null }),
  
  duplicateFloorPlan: (id: string) => {
    const state = get();
    const plan = state.floorPlans.find(p => p.id === id);
    if (plan) {
      const newPlan: FloorPlan = {
        id: uuidv4(),
        name: `${plan.name} (copie)`,
        elements: plan.elements.map(el => ({ ...el, id: uuidv4() }))
      };
      set((state) => ({
        floorPlans: [...state.floorPlans, newPlan],
        activeFloorPlanId: newPlan.id
      }));
      get().pushHistory();
    }
  },
  
  // Elements
  getElements: () => {
    const state = get();
    const plan = state.floorPlans.find(p => p.id === state.activeFloorPlanId);
    return plan?.elements || [];
  },
  
  addElement: (element) => {
    set((state) => ({
      floorPlans: state.floorPlans.map(p => 
        p.id === state.activeFloorPlanId 
          ? { ...p, elements: [...p.elements, element] }
          : p
      )
    }));
    get().pushHistory();
  },
  
  updateElement: (id, updates) => {
    set((state) => ({
      floorPlans: state.floorPlans.map(p => 
        p.id === state.activeFloorPlanId
          ? { ...p, elements: p.elements.map(el => el.id === id ? { ...el, ...updates } : el) }
          : p
      )
    }));
  },
  
  deleteElement: (id) => {
    set((state) => ({
      floorPlans: state.floorPlans.map(p => 
        p.id === state.activeFloorPlanId
          ? { ...p, elements: p.elements.filter(el => el.id !== id) }
          : p
      ),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
    }));
    get().pushHistory();
  },
  
  duplicateElement: (id) => {
    const state = get();
    const elements = state.getElements();
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElement = {
        ...element,
        id: uuidv4(),
        x: element.x + 30,
        y: element.y + 30,
        tableNumber: element.type === 'table' 
          ? Math.max(...elements.filter(e => e.type === 'table').map(e => e.tableNumber || 0)) + 1 
          : undefined
      };
      if (element.x2 !== undefined) newElement.x2 = element.x2 + 30;
      if (element.y2 !== undefined) newElement.y2 = element.y2 + 30;
      state.addElement(newElement);
      set({ selectedElementId: newElement.id });
    }
  },
  
  // Alignment
  alignElements: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const state = get();
    const elements = state.getElements();
    const tables = elements.filter(el => el.type === 'table');
    if (tables.length < 2) return;
    
    const bounds = {
      minX: Math.min(...tables.map(t => t.x)),
      maxX: Math.max(...tables.map(t => t.x)),
      minY: Math.min(...tables.map(t => t.y)),
      maxY: Math.max(...tables.map(t => t.y)),
    };
    
    tables.forEach(table => {
      let updates: Partial<FloorElement> = {};
      switch(alignment) {
        case 'left': updates.x = bounds.minX; break;
        case 'right': updates.x = bounds.maxX; break;
        case 'center': updates.x = (bounds.minX + bounds.maxX) / 2; break;
        case 'top': updates.y = bounds.minY; break;
        case 'bottom': updates.y = bounds.maxY; break;
        case 'middle': updates.y = (bounds.minY + bounds.maxY) / 2; break;
      }
      state.updateElement(table.id, updates);
    });
    get().pushHistory();
  },
  
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
  
  // Statistics
  getStatistics: () => {
    const state = get();
    const elements = state.getElements();
    const tables = elements.filter(el => el.type === 'table');
    const walls = elements.filter(el => el.type === 'wall');
    
    const totalCapacity = tables.reduce((sum, t) => sum + (t.capacity || 0), 0);
    const totalWallLength = walls.reduce((sum, w) => sum + (w.widthM || 0), 0);
    
    // Approximate area calculation
    let area = 0;
    if (walls.length >= 3) {
      const xs = walls.flatMap(w => [w.x, w.x2 || w.x]);
      const ys = walls.flatMap(w => [w.y, w.y2 || w.y]);
      const width = (Math.max(...xs) - Math.min(...xs)) / state.scale;
      const height = (Math.max(...ys) - Math.min(...ys)) / state.scale;
      area = width * height;
    }
    
    return {
      totalTables: tables.length,
      totalCapacity,
      totalWalls: walls.length,
      totalWallLength: totalWallLength.toFixed(1),
      approximateArea: area.toFixed(1),
      totalElements: elements.length
    };
  },
  
  // Actions
  clearCanvas: () => {
    set((state) => ({
      floorPlans: state.floorPlans.map(p =>
        p.id === state.activeFloorPlanId ? { ...p, elements: [] } : p
      ),
      selectedElementId: null
    }));
    get().pushHistory();
  },
  
  centerView: () => {
    const state = get();
    const elements = state.getElements();
    if (elements.length === 0) {
      set({ panOffset: { x: 400, y: 300 }, zoom: 1 });
      return;
    }
    
    const xs = elements.flatMap(el => [el.x, el.x2 || el.x]);
    const ys = elements.flatMap(el => [el.y, el.y2 || el.y]);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
    
    set({ panOffset: { x: 600 - centerX, y: 350 - centerY } });
  },
  
  zoomToFit: () => {
    const state = get();
    const elements = state.getElements();
    if (elements.length === 0) {
      set({ zoom: 1, panOffset: { x: 400, y: 300 } });
      return;
    }
    
    const xs = elements.flatMap(el => [el.x, el.x2 || el.x]);
    const ys = elements.flatMap(el => [el.y, el.y2 || el.y]);
    const width = Math.max(...xs) - Math.min(...xs) + 200;
    const height = Math.max(...ys) - Math.min(...ys) + 200;
    
    const zoomX = 1000 / width;
    const zoomY = 600 / height;
    const newZoom = Math.min(zoomX, zoomY, 2);
    
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
    
    set({ 
      zoom: Math.max(0.3, newZoom),
      panOffset: { x: 600 - centerX * newZoom, y: 350 - centerY * newZoom }
    });
  },
  
  loadProject: (project: Project) => {
    set({
      projectName: project.name,
      scale: project.scale || 50,
      floorPlans: project.floorPlans,
      activeFloorPlanId: project.activeFloorPlanId,
      tableTemplates: project.tableTemplates.length > 0 ? project.tableTemplates : DEFAULT_TEMPLATES,
      selectedElementId: null,
      history: [],
      historyIndex: -1
    });
    get().pushHistory();
  },
  
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