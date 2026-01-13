export type ToolType = 
  | 'select' 
  | 'wall' 
  | 'door' 
  | 'window' 
  | 'rectangle' 
  | 'line'
  | 'text'
  | 'column'
  | 'table'
  | 'pan';

export type TableShape = 'square' | 'round' | 'rectangle';

export interface TableTemplate {
  id: string;
  name: string;
  shape: TableShape;
  capacity: number;
  width: number;
  height: number;
  color: string;
}

export interface FloorElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'rectangle' | 'column' | 'table' | 'text' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;
  points?: number[]; // for lines/walls
  text?: string; // for text elements
  fontSize?: number;
  // Table specific
  tableTemplateId?: string;
  capacity?: number;
  shape?: TableShape;
  tableNumber?: number;
  color?: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  canvasWidth: number;
  canvasHeight: number;
  elements: FloorElement[];
  tableTemplates: TableTemplate[];
}

export interface EditorState {
  // Current tool
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  
  // Canvas state
  zoom: number;
  setZoom: (zoom: number) => void;
  panOffset: { x: number; y: number };
  setPanOffset: (offset: { x: number; y: number }) => void;
  
  // Grid
  showGrid: boolean;
  toggleGrid: () => void;
  snapToGrid: boolean;
  toggleSnapToGrid: () => void;
  gridSize: number;
  
  // Selection
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  
  // Elements
  elements: FloorElement[];
  addElement: (element: FloorElement) => void;
  updateElement: (id: string, updates: Partial<FloorElement>) => void;
  deleteElement: (id: string) => void;
  
  // Table Templates
  tableTemplates: TableTemplate[];
  addTableTemplate: (template: TableTemplate) => void;
  updateTableTemplate: (id: string, updates: Partial<TableTemplate>) => void;
  deleteTableTemplate: (id: string) => void;
  
  // Project
  projectName: string;
  setProjectName: (name: string) => void;
  
  // Actions
  clearCanvas: () => void;
  loadProject: (project: Project) => void;
  exportProject: () => Project;
}