import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Toolbar from '../components/Toolbar';
import Canvas from '../components/Canvas';
import PropertiesPanel from '../components/PropertiesPanel';
import { useEditorStore } from '../store/editorStore';
import { TableTemplate, Project } from '../types';

const Editor: React.FC = () => {
  const navigate = useNavigate();
  const [draggedTemplate, setDraggedTemplate] = useState<TableTemplate | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { exportProject, loadProject, tableTemplates } = useEditorStore();

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    const project = exportProject();
    localStorage.setItem('floorplan-project', JSON.stringify(project));
    showToast('✅ Proiect salvat cu succes!');
  };

  const handleLoad = () => {
    const saved = localStorage.getItem('floorplan-project');
    if (saved) {
      try {
        const project: Project = JSON.parse(saved);
        loadProject(project);
        showToast('✅ Proiect încărcat!');
      } catch (e) {
        showToast('❌ Eroare la încărcarea proiectului');
      }
    } else {
      showToast('⚠️ Nu există niciun proiect salvat');
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

  // Check if user has table templates
  React.useEffect(() => {
    if (tableTemplates.length === 0) {
      // Don't force redirect, templates are pre-populated now
    }
  }, [tableTemplates, navigate]);

  return (
    <div className="app-container">
      <Sidebar onDragStart={(template) => setDraggedTemplate(template)} />
      
      <div className="main-area">
        <Toolbar
          onSave={handleSave}
          onLoad={handleLoad}
          onExport={handleExport}
        />
        
        <Canvas
          draggedTemplate={draggedTemplate}
          onDropComplete={() => setDraggedTemplate(null)}
        />
      </div>
      
      <PropertiesPanel />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default Editor;