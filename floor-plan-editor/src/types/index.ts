export type ToolType = 
  | 'select' 
  | 'wall' 
  | 'door' 
  | 'window' 
  | 'line'
  | 'text'
  | 'column'
  | 'table'
  | 'measure'
  | 'pan';

export type AngleMode = 'free' | '90' | '45';

export type TableShape = 'square' | 'round' | 'rectangle' | 'oval';

export interface TableTemplate {
  id: string;
  name: string;
  shape: TableShape;
  capacity: number;
  widthM: number;
  heightM: number;
  canCombine: boolean;
}

export interface FloorElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'rectangle' | 'column' | 'table' | 'text' | 'line';
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  widthM?: number;
  heightM?: number;
  rotation: number;
  locked?: boolean;
  text?: string;
  fontSize?: number;
  tableTemplateId?: string;
  capacity?: number;
  shape?: TableShape;
  tableNumber?: number;
  canCombine?: boolean;
  combinedWith?: string[];
}

export interface FloorPlan {
  id: string;
  name: string;
  elements: FloorElement[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  scale: number;
  floorPlans: FloorPlan[];
  activeFloorPlanId: string;
  tableTemplates: TableTemplate[];
}

export interface MeasurePoint {
  x: number;
  y: number;
}

export interface Statistics {
  totalTables: number;
  totalCapacity: number;
  totalWalls: number;
  totalWallLength: string;
  approximateArea: string;
  totalElements: number;
}

export interface EditorState {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  
  angleMode: AngleMode;
  setAngleMode: (mode: AngleMode) => void;
  
  scale: number;
  setScale: (scale: number) => void;
  
  zoom: number;
  setZoom: (zoom: number) => void;
  panOffset: { x: number; y: number };
  setPanOffset: (offset: { x: number; y: number }) => void;
  
  showGrid: boolean;
  toggleGrid: () => void;
  snapToGrid: boolean;
  toggleSnapToGrid: () => void;
  snapToCorners: boolean;
  toggleSnapToCorners: () => void;
  gridSizeM: number;
  
  showRulers: boolean;
  toggleRulers: () => void;
  
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  selectedElementIds: string[];
  setSelectedElementIds: (ids: string[]) => void;
  
  clipboard: FloorElement[] | null;
  setClipboard: (elements: FloorElement[] | null) => void;
  
  history: string[];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  floorPlans: FloorPlan[];
  activeFloorPlanId: string;
  addFloorPlan: (name: string) => void;
  removeFloorPlan: (id: string) => void;
  renameFloorPlan: (id: string, name: string) => void;
  setActiveFloorPlan: (id: string) => void;
  duplicateFloorPlan: (id: string) => void;
  
  getElements: () => FloorElement[];
  addElement: (element: FloorElement) => void;
  updateElement: (id: string, updates: Partial<FloorElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  
  alignElements: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  
  tableTemplates: TableTemplate[];
  addTableTemplate: (template: TableTemplate) => void;
  updateTableTemplate: (id: string, updates: Partial<TableTemplate>) => void;
  deleteTableTemplate: (id: string) => void;
  
  measureStart: MeasurePoint | null;
  measureEnd: MeasurePoint | null;
  setMeasurePoints: (start: MeasurePoint | null, end: MeasurePoint | null) => void;
  
  projectName: string;
  setProjectName: (name: string) => void;
  
  getStatistics: () => Statistics;
  
  clearCanvas: () => void;
  centerView: () => void;
  zoomToFit: () => void;
  loadProject: (project: Project) => void;
  exportProject: () => Project;
}