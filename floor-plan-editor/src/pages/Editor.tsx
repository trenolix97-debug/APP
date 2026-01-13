import React, { useState, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Toolbar from '../components/Toolbar';
import Canvas from '../components/Canvas';
import PropertiesPanel from '../components/PropertiesPanel';
import { useEditorStore } from '../store/editorStore';
import { TableTemplate, Project } from '../types';
import { StatsIcon, KeyboardIcon } from '../components/Icons';

const Editor: React.FC = () => {
  const [draggedTemplate, setDraggedTemplate] = useState<TableTemplate | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const canvasRef = useRef<any>(null);
  
  const { exportProject, loadProject, getStatistics, undo, redo } = useEditorStore();

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    const project = exportProject();
    localStorage.setItem('floorplan-project', JSON.stringify(project));
    showToast('✅ Proiect salvat!');
  };

  const handleLoad = () => {
    const saved = localStorage.getItem('floorplan-project');
    if (saved) {
      try {
        const project: Project = JSON.parse(saved);
        loadProject(project);
        showToast('✅ Proiect încărcat!');
      } catch (e) {
        showToast('❌ Eroare la încărcare');
      }
    } else {
      showToast('⚠️ Nu există proiect salvat');
    }
  };

  const handleExport = () => {
    const project = exportProject();
    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-floorplan.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('✅ JSON exportat!');
  };

  const handleExportImage = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.exportImage();
      showToast('✅ Imagine PNG exportată!');
    }
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
        }
      }
      if (e.key === '?') {
        setShowShortcuts(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const stats = getStatistics();

  return (
    <div className="app-container">
      <Sidebar onDragStart={(template) => setDraggedTemplate(template)} />
      
      <div className="main-area">
        <Toolbar
          onSave={handleSave}
          onLoad={handleLoad}
          onExport={handleExport}
          onExportImage={handleExportImage}
        />
        
        <Canvas
          ref={canvasRef}
          draggedTemplate={draggedTemplate}
          onDropComplete={() => setDraggedTemplate(null)}
        />
        
        {/* Bottom bar with stats */}
        <div className="bottom-bar">
          <button 
            className={`bottom-bar-btn ${showStats ? 'active' : ''}`}
            onClick={() => setShowStats(!showStats)}
          >
            <StatsIcon /> Statistici
          </button>
          <button 
            className="bottom-bar-btn"
            onClick={() => setShowShortcuts(true)}
          >
            <KeyboardIcon /> Comenzi (?)
          </button>
          
          {showStats && (
            <div className="stats-panel">
              <div className="stat-item">
                <span className="stat-value">{stats.totalTables}</span>
                <span className="stat-label">Mese</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.totalCapacity}</span>
                <span className="stat-label">Locuri</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.totalWalls}</span>
                <span className="stat-label">Pereți</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.totalWallLength}m</span>
                <span className="stat-label">Lungime pereți</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">~{stats.approximateArea}m²</span>
                <span className="stat-label">Suprafață</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <PropertiesPanel />

      {toast && <div className="toast">{toast}</div>}
      
      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="modal-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="modal shortcuts-modal" onClick={e => e.stopPropagation()}>
            <h2>Comenzi Rapide</h2>
            <p>Scurtături pentru productivitate</p>
            
            <div className="shortcuts-grid">
              <div className="shortcut-category">
                <h4>General</h4>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>S</kbd>
                  <span>Salvează</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>Z</kbd>
                  <span>Undo</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>Y</kbd>
                  <span>Redo</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Delete</kbd>
                  <span>Șterge element</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Esc</kbd>
                  <span>Anulează / Deselectează</span>
                </div>
              </div>
              
              <div className="shortcut-category">
                <h4>Navigare</h4>
                <div className="shortcut-item">
                  <kbd>Scroll</kbd>
                  <span>Zoom in/out</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Click dreapta</kbd> + <kbd>Drag</kbd>
                  <span>Pan canvas</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Space</kbd> + <kbd>Drag</kbd>
                  <span>Pan canvas</span>
                </div>
              </div>
              
              <div className="shortcut-category">
                <h4>Editare</h4>
                <div className="shortcut-item">
                  <kbd>R</kbd>
                  <span>Rotește 45°</span>
                </div>
                <div className="shortcut-item">
                  <kbd>D</kbd>
                  <span>Duplică element</span>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setShowShortcuts(false)}>
                Am înțeles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;