import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../store/editorStore';
import { ToolType, TableTemplate } from '../types';
import {
  SelectIcon,
  WallIcon,
  DoorIcon,
  WindowIcon,
  LineIcon,
  TextIcon,
  ColumnIcon,
  MeasureIcon,
  PanIcon,
  PlusIcon,
  Angle90Icon,
  Angle45Icon,
  AngleFreeIcon,
  EditIcon,
  TrashIcon,
  LayersIcon
} from './Icons';

const tools: { type: ToolType; icon: React.FC; label: string }[] = [
  { type: 'select', icon: SelectIcon, label: 'Selectare' },
  { type: 'pan', icon: PanIcon, label: 'Pan' },
  { type: 'wall', icon: WallIcon, label: 'Perete' },
  { type: 'door', icon: DoorIcon, label: 'Ușă' },
  { type: 'window', icon: WindowIcon, label: 'Fereastră' },
  { type: 'line', icon: LineIcon, label: 'Linie' },
  { type: 'column', icon: ColumnIcon, label: 'Coloană' },
  { type: 'measure', icon: MeasureIcon, label: 'Metru' },
];

interface SidebarProps {
  onDragStart: (template: TableTemplate) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onDragStart }) => {
  const navigate = useNavigate();
  const { 
    activeTool, 
    setActiveTool, 
    angleMode, 
    setAngleMode,
    tableTemplates,
    floorPlans,
    activeFloorPlanId,
    addFloorPlan,
    removeFloorPlan,
    renameFloorPlan,
    setActiveFloorPlan,
    scale
  } = useEditorStore();

  const handleAddFloorPlan = () => {
    const name = prompt('Nume pentru noul plan:');
    if (name?.trim()) {
      addFloorPlan(name.trim());
    }
  };

  const handleRenameFloorPlan = (id: string, currentName: string) => {
    const name = prompt('Nume nou:', currentName);
    if (name?.trim()) {
      renameFloorPlan(id, name.trim());
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>✏️ Floor Plan Editor</h1>
        <p>Editor profesional pentru restaurante</p>
      </div>

      {/* Tools */}
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

        {/* Angle Mode */}
        {['wall', 'line'].includes(activeTool) && (
          <div className="angle-mode">
            <button 
              className={`angle-btn ${angleMode === 'free' ? 'active' : ''}`}
              onClick={() => setAngleMode('free')}
              title="Unghi liber"
            >
              <AngleFreeIcon /> Liber
            </button>
            <button 
              className={`angle-btn ${angleMode === '90' ? 'active' : ''}`}
              onClick={() => setAngleMode('90')}
              title="90°"
            >
              <Angle90Icon /> 90°
            </button>
            <button 
              className={`angle-btn ${angleMode === '45' ? 'active' : ''}`}
              onClick={() => setAngleMode('45')}
              title="45°"
            >
              <Angle45Icon /> 45°
            </button>
          </div>
        )}
      </div>

      {/* Floor Plans */}
      <div className="sidebar-section">
        <h3><LayersIcon /> Planuri ({floorPlans.length})</h3>
      </div>
      <div className="floor-plans-list">
        {floorPlans.map((plan) => (
          <div
            key={plan.id}
            className={`floor-plan-item ${activeFloorPlanId === plan.id ? 'active' : ''}`}
            onClick={() => setActiveFloorPlan(plan.id)}
          >
            <span className="floor-plan-name">{plan.name}</span>
            <div className="floor-plan-actions">
              <button 
                onClick={(e) => { e.stopPropagation(); handleRenameFloorPlan(plan.id, plan.name); }}
                title="Redenumește"
              >
                <EditIcon />
              </button>
              {floorPlans.length > 1 && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if(confirm(`Ștergi planul "${plan.name}"?`)) removeFloorPlan(plan.id); 
                  }}
                  title="Șterge"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          </div>
        ))}
        <button className="add-floor-btn" onClick={handleAddFloorPlan}>
          <PlusIcon /> Adaugă plan nou
        </button>
      </div>

      {/* Table Library */}
      <div className="sidebar-section">
        <h3>Bibliotecă Mese</h3>
      </div>
      <div className="table-library">
        {tableTemplates.map((template) => (
          <div
            key={template.id}
            className="table-item"
            draggable
            onDragStart={() => onDragStart(template)}
            title={`Trage pe canvas | ${template.widthM}m x ${template.heightM}m`}
          >
            <div
              className={`table-preview ${template.shape}`}
            >
              {template.capacity}
            </div>
            <div className="table-info">
              <h4>{template.name}</h4>
              <p>{template.widthM}m x {template.heightM}m {template.canCombine ? '• Combinabilă' : ''}</p>
            </div>
          </div>
        ))}
        <button
          className="add-table-btn"
          onClick={() => navigate('/table-designer')}
        >
          <PlusIcon /> Gestionează mese
        </button>
      </div>
    </div>
  );
};

export default Sidebar;