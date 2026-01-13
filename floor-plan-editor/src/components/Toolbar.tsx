import React from 'react';
import { useEditorStore } from '../store/editorStore';
import {
  ZoomInIcon,
  ZoomOutIcon,
  GridIcon,
  SaveIcon,
  ExportIcon,
  UndoIcon,
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
    selectedElementId,
    deleteElement,
    clearCanvas,
    projectName,
    setProjectName
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
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: '16px',
            fontWeight: 600,
            width: '200px'
          }}
        />
        
        <button className="toolbar-btn" onClick={onSave}>
          <SaveIcon /> Salvează
        </button>
        
        <button className="toolbar-btn" onClick={onLoad}>
          <LoadIcon /> Încarcă
        </button>
        
        <button className="toolbar-btn primary" onClick={onExport}>
          <ExportIcon /> Export JSON
        </button>
      </div>

      <div className="toolbar-center">
        <div className="zoom-controls">
          <button
            className="zoom-btn"
            onClick={() => setZoom(zoom - 0.1)}
          >
            <ZoomOutIcon />
          </button>
          <span className="zoom-value">{Math.round(zoom * 100)}%</span>
          <button
            className="zoom-btn"
            onClick={() => setZoom(zoom + 0.1)}
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
          title="Snap to Grid"
        >
          <MagnetIcon /> Snap
        </button>

        <button
          className="toolbar-btn"
          onClick={handleDelete}
          disabled={!selectedElementId}
          style={{ opacity: selectedElementId ? 1 : 0.5 }}
          title="Șterge elementul selectat (Delete)"
        >
          <TrashIcon /> Șterge
        </button>

        <button
          className="toolbar-btn"
          onClick={() => {
            if (confirm('Ești sigur că vrei să ștergi tot?')) {
              clearCanvas();
            }
          }}
          title="Curăță tot canvas-ul"
        >
          <UndoIcon /> Reset
        </button>
      </div>
    </div>
  );
};

export default Toolbar;