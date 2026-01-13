import React from 'react';
import { useEditorStore } from '../store/editorStore';
import {
  ZoomInIcon,
  ZoomOutIcon,
  GridIcon,
  SaveIcon,
  ExportIcon,
  TrashIcon,
  MagnetIcon,
  LoadIcon
} from './Icons';

interface ToolbarProps {
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onSave, onLoad, onExport }) => {
  const {
    zoom,
    setZoom,
    showGrid,
    toggleGrid,
    snapToGrid,
    toggleSnapToGrid,
    snapToCorners,
    toggleSnapToCorners,
    selectedElementId,
    deleteElement,
    clearCanvas,
    projectName,
    setProjectName,
    scale,
    setScale
  } = useEditorStore();

  const handleDelete = () => {
    if (selectedElementId) {
      deleteElement(selectedElementId);
    }
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
        
        <button className="toolbar-btn" onClick={onSave} title="Salvează (localStorage)">
          <SaveIcon /> Salvează
        </button>
        
        <button className="toolbar-btn" onClick={onLoad} title="Încarcă din localStorage">
          <LoadIcon /> Încarcă
        </button>
        
        <button className="toolbar-btn primary" onClick={onExport} title="Export JSON">
          <ExportIcon /> Export
        </button>

        <div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: '#666' }}>Scară:</label>
          <select 
            value={scale} 
            onChange={(e) => setScale(Number(e.target.value))}
            style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
          >
            <option value={25}>25px/m</option>
            <option value={50}>50px/m</option>
            <option value={100}>100px/m</option>
          </select>
        </div>
      </div>

      <div className="toolbar-center">
        <div className="zoom-controls">
          <button
            className="zoom-btn"
            onClick={() => setZoom(zoom - 0.1)}
            title="Zoom out"
          >
            <ZoomOutIcon />
          </button>
          <span className="zoom-value">{Math.round(zoom * 100)}%</span>
          <button
            className="zoom-btn"
            onClick={() => setZoom(zoom + 0.1)}
            title="Zoom in"
          >
            <ZoomInIcon />
          </button>
        </div>
      </div>

      <div className="toolbar-right">
        <button
          className={`toolbar-btn ${showGrid ? 'active' : ''}`}
          onClick={toggleGrid}
          title="Afișează Grid"
        >
          <GridIcon /> Grid
        </button>
        
        <button
          className={`toolbar-btn ${snapToGrid ? 'active' : ''}`}
          onClick={toggleSnapToGrid}
          title="Snap la grid"
        >
          Snap
        </button>

        <button
          className={`toolbar-btn ${snapToCorners ? 'active' : ''}`}
          onClick={toggleSnapToCorners}
          title="Magnet la colțuri"
        >
          <MagnetIcon /> Magnet
        </button>

        <button
          className="toolbar-btn"
          onClick={handleDelete}
          disabled={!selectedElementId}
          style={{ opacity: selectedElementId ? 1 : 0.5 }}
          title="Șterge (Delete)"
        >
          <TrashIcon />
        </button>

        <button
          className="toolbar-btn"
          onClick={() => {
            if (confirm('Curăță tot canvas-ul pentru acest plan?')) {
              clearCanvas();
            }
          }}
          title="Curăță canvas"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default Toolbar;