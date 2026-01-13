import React, { useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import {
  ZoomInIcon,
  ZoomOutIcon,
  GridIcon,
  SaveIcon,
  ExportIcon,
  TrashIcon,
  MagnetIcon,
  LoadIcon,
  UndoIcon,
  RedoIcon,
  FitIcon,
  CenterIcon,
  RulerIcon,
  ImportIcon,
  ImageIcon
} from './Icons';
import { Project } from '../types';

interface ToolbarProps {
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
  onExportImage: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onSave, onLoad, onExport, onExportImage }) => {
  const importRef = useRef<HTMLInputElement>(null);
  
  const {
    zoom,
    setZoom,
    showGrid,
    toggleGrid,
    snapToGrid,
    toggleSnapToGrid,
    snapToCorners,
    toggleSnapToCorners,
    showRulers,
    toggleRulers,
    selectedElementId,
    deleteElement,
    clearCanvas,
    projectName,
    setProjectName,
    scale,
    setScale,
    undo,
    redo,
    canUndo,
    canRedo,
    centerView,
    zoomToFit,
    loadProject
  } = useEditorStore();

  const handleDelete = () => {
    if (selectedElementId) {
      deleteElement(selectedElementId);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const project: Project = JSON.parse(event.target?.result as string);
          loadProject(project);
        } catch (err) {
          alert('Eroare la importarea fișierului JSON');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="project-name-input"
          placeholder="Nume proiect"
        />
        
        <div className="toolbar-divider" />
        
        <button 
          className="toolbar-btn" 
          onClick={undo} 
          disabled={!canUndo()}
          title="Undo (Ctrl+Z)"
          style={{ opacity: canUndo() ? 1 : 0.4 }}
        >
          <UndoIcon />
        </button>
        
        <button 
          className="toolbar-btn" 
          onClick={redo} 
          disabled={!canRedo()}
          title="Redo (Ctrl+Y)"
          style={{ opacity: canRedo() ? 1 : 0.4 }}
        >
          <RedoIcon />
        </button>
        
        <div className="toolbar-divider" />
        
        <button className="toolbar-btn" onClick={onSave} title="Salvează local">
          <SaveIcon />
        </button>
        
        <button className="toolbar-btn" onClick={onLoad} title="Încarcă din local">
          <LoadIcon />
        </button>
        
        <button 
          className="toolbar-btn" 
          onClick={() => importRef.current?.click()} 
          title="Import JSON"
        >
          <ImportIcon />
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
        
        <div className="toolbar-divider" />
        
        <button className="toolbar-btn primary" onClick={onExport} title="Export JSON">
          <ExportIcon /> JSON
        </button>
        
        <button className="toolbar-btn" onClick={onExportImage} title="Export Imagine PNG">
          <ImageIcon /> PNG
        </button>
      </div>

      <div className="toolbar-center">
        <button className="toolbar-btn" onClick={zoomToFit} title="Zoom to Fit">
          <FitIcon />
        </button>
        <button className="toolbar-btn" onClick={centerView} title="Centrează">
          <CenterIcon />
        </button>
        
        <div className="zoom-controls">
          <button className="zoom-btn" onClick={() => setZoom(zoom - 0.1)} title="Zoom out">
            <ZoomOutIcon />
          </button>
          <span className="zoom-value">{Math.round(zoom * 100)}%</span>
          <button className="zoom-btn" onClick={() => setZoom(zoom + 0.1)} title="Zoom in">
            <ZoomInIcon />
          </button>
        </div>
        
        <select 
          value={scale} 
          onChange={(e) => setScale(Number(e.target.value))}
          className="scale-select"
          title="Scară"
        >
          <option value={25}>25px/m</option>
          <option value={50}>50px/m</option>
          <option value={75}>75px/m</option>
          <option value={100}>100px/m</option>
        </select>
      </div>

      <div className="toolbar-right">
        <button
          className={`toolbar-btn ${showRulers ? 'active' : ''}`}
          onClick={toggleRulers}
          title="Rigle"
        >
          <RulerIcon />
        </button>
        
        <button
          className={`toolbar-btn ${showGrid ? 'active' : ''}`}
          onClick={toggleGrid}
          title="Grid"
        >
          <GridIcon />
        </button>
        
        <button
          className={`toolbar-btn ${snapToGrid ? 'active' : ''}`}
          onClick={toggleSnapToGrid}
          title="Snap Grid"
        >
          Snap
        </button>

        <button
          className={`toolbar-btn ${snapToCorners ? 'active' : ''}`}
          onClick={toggleSnapToCorners}
          title="Magnet Colțuri"
        >
          <MagnetIcon />
        </button>

        <div className="toolbar-divider" />

        <button
          className="toolbar-btn"
          onClick={handleDelete}
          disabled={!selectedElementId}
          style={{ opacity: selectedElementId ? 1 : 0.4 }}
          title="Șterge (Delete)"
        >
          <TrashIcon />
        </button>

        <button
          className="toolbar-btn danger-text"
          onClick={() => {
            if (confirm('Curăță tot canvas-ul pentru acest plan?')) {
              clearCanvas();
            }
          }}
          title="Curăță tot"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default Toolbar;