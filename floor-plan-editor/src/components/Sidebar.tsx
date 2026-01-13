import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../store/editorStore';
import { ToolType, TableTemplate } from '../types';
import {
  SelectIcon,
  WallIcon,
  DoorIcon,
  WindowIcon,
  RectangleIcon,
  LineIcon,
  TextIcon,
  ColumnIcon,
  PanIcon,
  PlusIcon
} from './Icons';

const tools: { type: ToolType; icon: React.FC; label: string }[] = [
  { type: 'select', icon: SelectIcon, label: 'Selectare' },
  { type: 'pan', icon: PanIcon, label: 'Pan' },
  { type: 'wall', icon: WallIcon, label: 'Perete' },
  { type: 'door', icon: DoorIcon, label: 'Ușă' },
  { type: 'window', icon: WindowIcon, label: 'Fereastră' },
  { type: 'rectangle', icon: RectangleIcon, label: 'Dreptunghi' },
  { type: 'line', icon: LineIcon, label: 'Linie' },
  { type: 'column', icon: ColumnIcon, label: 'Coloană' },
  { type: 'text', icon: TextIcon, label: 'Text' },
];

interface SidebarProps {
  onDragStart: (template: TableTemplate) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onDragStart }) => {
  const navigate = useNavigate();
  const { activeTool, setActiveTool, tableTemplates } = useEditorStore();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>🍽️ Floor Plan Editor</h1>
        <p>Editor profesional pentru restaurante</p>
      </div>

      <div className="sidebar-section">
        <h3>Instrumente</h3>
        <div className="tools-grid">
          {tools.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              className={`tool-btn ${activeTool === type ? 'active' : ''}`}
              onClick={() => setActiveTool(type)}
              title={label}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Bibliotecă Mese</h3>
      </div>

      <div className="table-library">
        {tableTemplates.length === 0 ? (
          <div className="empty-state">
            <p>Nu ai nicio masă creată</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/table-designer')}
            >
              Creează Prima Masă
            </button>
          </div>
        ) : (
          <>
            {tableTemplates.map((template) => (
              <div
                key={template.id}
                className="table-item"
                draggable
                onDragStart={() => onDragStart(template)}
              >
                <div
                  className={`table-preview ${template.shape === 'round' ? 'round' : ''}`}
                  style={{ backgroundColor: template.color }}
                >
                  {template.capacity}
                </div>
                <div className="table-info">
                  <h4>{template.name}</h4>
                  <p>{template.capacity} persoane • {template.shape}</p>
                </div>
              </div>
            ))}

            <button
              className="add-table-btn"
              onClick={() => navigate('/table-designer')}
            >
              <PlusIcon /> Adaugă tip de masă
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;