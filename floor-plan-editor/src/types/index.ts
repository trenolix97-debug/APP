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
  widthM: number;  // width in meters
  heightM: number; // height in meters (or diameter for round)
  canCombine: boolean; // can be combined with other tables
}

export interface FloorElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'rectangle' | 'column' | 'table' | 'text' | 'line';
  x: number;
  y: number;
  x2?: number; // end point for lines/walls
  y2?: number;
  widthM?: number;  // width in meters
  heightM?: number; // height in meters
  rotation: number;
  text?: string;
  fontSize?: number;
  // Table specific
  tableTemplateId?: string;
  capacity?: number;
  shape?: TableShape;
  tableNumber?: number;
  canCombine?: boolean;
  combinedWith?: string[]; // IDs of connected tables
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
  scale: number; // pixels per meter
  floorPlans: FloorPlan[];
  activeFloorPlanId: string;
  tableTemplates: TableTemplate[];
}

export interface MeasurePoint {
  x: number;
  y: number;
}

export interface EditorState {
  // Current tool
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  
  // Angle mode
  angleMode: AngleMode;
  setAngleMode: (mode: AngleMode) => void;
  
  // Scale (pixels per meter)
  scale: number;
  setScale: (scale: number) => void;
  
  // Canvas state
  zoom: number;
  setZoom: (zoom: number) => void;
  panOffset: { x: number; y: number };
  setPanOffset: (offset: { x: number; y: number }) => void;
  
  // Grid & Snap
  showGrid: boolean;
  toggleGrid: () => void;
  snapToGrid: boolean;
  toggleSnapToGrid: () => void;
  snapToCorners: boolean;
  toggleSnapToCorners: () => void;
  gridSizeM: number; // grid size in meters
  
  // Selection
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  
  // Floor Plans
  floorPlans: FloorPlan[];
  activeFloorPlanId: string;
  addFloorPlan: (name: string) => void;
  removeFloorPlan: (id: string) => void;
  renameFloorPlan: (id: string, name: string) => void;
  setActiveFloorPlan: (id: string) => void;
  
  // Elements (for active floor plan)
  getElements: () => FloorElement[];
  addElement: (element: FloorElement) => void;
  updateElement: (id: string, updates: Partial<FloorElement>) => void;
  deleteElement: (id: string) => void;
  
  // Table Templates
  tableTemplates: TableTemplate[];
  addTableTemplate: (template: TableTemplate) => void;
  updateTableTemplate: (id: string, updates: Partial<TableTemplate>) => void;
  deleteTableTemplate: (id: string) => void;
  
  // Measure tool
  measureStart: MeasurePoint | null;
  measureEnd: MeasurePoint | null;
  setMeasurePoints: (start: MeasurePoint | null, end: MeasurePoint | null) => void;
  
  // Project
  projectName: string;
  setProjectName: (name: string) => void;
  
  // Actions
  clearCanvas: () => void;
  loadProject: (project: Project) => void;
  exportProject: () => Project;
}