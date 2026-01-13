import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { TrashIcon, CopyIcon, RotateIcon } from './Icons';
import { v4 as uuidv4 } from 'uuid';

const PropertiesPanel: React.FC = () => {
  const {
    selectedElementId,
    elements,
    updateElement,
    deleteElement,
    addElement,
    tableTemplates
  } = useEditorStore();

  const selectedElement = elements.find(el => el.id === selectedElementId);

  if (!selectedElement) {
    return (
      <div className="properties-panel">
        <div className="panel-header">Proprietăți</div>
        <div className="panel-section">
          <div className="empty-state">
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              Selectează un element pentru a vedea proprietățile
            </p>
          </div>
        </div>

        <div className="panel-section">
          <h4>Comenzi Rapide</h4>
          <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.8 }}>
            <div><kbd>Delete</kbd> - Șterge element</div>
            <div><kbd>Ctrl+D</kbd> - Duplică</div>
            <div><kbd>R</kbd> - Rotește 45°</div>
            <div><kbd>Scroll</kbd> - Zoom</div>
            <div><kbd>Space+Drag</kbd> - Pan</div>
          </div>
        </div>
      </div>
    );
  }

  const template = selectedElement.tableTemplateId
    ? tableTemplates.find(t => t.id === selectedElement.tableTemplateId)
    : null;

  const handleDuplicate = () => {
    addElement({
      ...selectedElement,
      id: uuidv4(),
      x: selectedElement.x + 20,
      y: selectedElement.y + 20,
      tableNumber: selectedElement.type === 'table' 
        ? Math.max(...elements.filter(e => e.type === 'table').map(e => e.tableNumber || 0)) + 1 
        : undefined
    });
  };

  const handleRotate = () => {
    updateElement(selectedElement.id, {
      rotation: (selectedElement.rotation + 45) % 360
    });
  };

  return (
    <div className="properties-panel">
      <div className="panel-header">
        {selectedElement.type === 'table' ? 'Masă' : 
         selectedElement.type === 'wall' ? 'Perete' :
         selectedElement.type === 'door' ? 'Ușă' :
         selectedElement.type === 'window' ? 'Fereastră' :
         selectedElement.type === 'column' ? 'Coloană' :
         selectedElement.type === 'text' ? 'Text' :
         'Element'}
      </div>

      <div className="panel-section">
        <h4>Acțiuni</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="toolbar-btn"
            onClick={handleDuplicate}
            style={{ flex: 1 }}
          >
            <CopyIcon /> Duplică
          </button>
          <button
            className="toolbar-btn"
            onClick={handleRotate}
            style={{ flex: 1 }}
          >
            <RotateIcon /> Rotește
          </button>
        </div>
        <button
          className="toolbar-btn"
          onClick={() => deleteElement(selectedElement.id)}
          style={{ width: '100%', marginTop: '8px', color: '#ef4444' }}
        >
          <TrashIcon /> Șterge
        </button>
      </div>

      <div className="panel-section">
        <h4>Poziție</h4>
        <div className="property-row">
          <label>X</label>
          <input
            type="number"
            value={Math.round(selectedElement.x)}
            onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
          />
        </div>
        <div className="property-row">
          <label>Y</label>
          <input
            type="number"
            value={Math.round(selectedElement.y)}
            onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
          />
        </div>
        <div className="property-row">
          <label>Rotație</label>
          <input
            type="number"
            value={selectedElement.rotation}
            onChange={(e) => updateElement(selectedElement.id, { rotation: Number(e.target.value) })}
          />
        </div>
      </div>

      {selectedElement.width !== undefined && (
        <div className="panel-section">
          <h4>Dimensiuni</h4>
          <div className="property-row">
            <label>Lățime</label>
            <input
              type="number"
              value={Math.round(selectedElement.width || 0)}
              onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
            />
          </div>
          <div className="property-row">
            <label>Înălțime</label>
            <input
              type="number"
              value={Math.round(selectedElement.height || 0)}
              onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
            />
          </div>
        </div>
      )}

      {selectedElement.type === 'table' && (
        <div className="panel-section">
          <h4>Detalii Masă</h4>
          <div className="property-row">
            <label>Număr</label>
            <input
              type="number"
              value={selectedElement.tableNumber || 1}
              onChange={(e) => updateElement(selectedElement.id, { tableNumber: Number(e.target.value) })}
            />
          </div>
          <div className="property-row">
            <label>Capacitate</label>
            <input
              type="number"
              value={selectedElement.capacity || 4}
              onChange={(e) => updateElement(selectedElement.id, { capacity: Number(e.target.value) })}
            />
          </div>
          {template && (
            <div style={{ marginTop: '12px', padding: '12px', background: '#f1f5f9', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Template: {template.name}</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{template.capacity} persoane</div>
            </div>
          )}
        </div>
      )}

      {selectedElement.type === 'text' && (
        <div className="panel-section">
          <h4>Text</h4>
          <div className="property-row">
            <label>Conținut</label>
            <input
              type="text"
              value={selectedElement.text || ''}
              onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
            />
          </div>
          <div className="property-row">
            <label>Mărime</label>
            <input
              type="number"
              value={selectedElement.fontSize || 16}
              onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;