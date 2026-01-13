import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { TrashIcon, CopyIcon, RotateIcon } from './Icons';
import { v4 as uuidv4 } from 'uuid';

const PropertiesPanel: React.FC = () => {
  const {
    selectedElementId,
    getElements,
    updateElement,
    deleteElement,
    addElement,
    tableTemplates,
    scale
  } = useEditorStore();

  const elements = getElements();
  const selectedElement = elements.find(el => el.id === selectedElementId);

  const pxToM = (px: number) => px / scale;
  const mToPx = (m: number) => m * scale;

  if (!selectedElement) {
    return (
      <div className="properties-panel">
        <div className="panel-header">Proprietăți</div>
        <div className="panel-section">
          <div className="empty-state">
            <p>Selectează un element pentru a vedea proprietățile</p>
          </div>
        </div>

        <div className="panel-section">
          <h4>Comenzi Rapide</h4>
          <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.8 }}>
            <div><kbd style={{background:'#f0f0f0',padding:'2px 6px',borderRadius:'3px'}}>Delete</kbd> - Șterge</div>
            <div><kbd style={{background:'#f0f0f0',padding:'2px 6px',borderRadius:'3px'}}>Scroll</kbd> - Zoom</div>
            <div><kbd style={{background:'#f0f0f0',padding:'2px 6px',borderRadius:'3px'}}>Click dreapta</kbd> - Pan</div>
            <div><kbd style={{background:'#f0f0f0',padding:'2px 6px',borderRadius:'3px'}}>Esc</kbd> - Anulează</div>
          </div>
        </div>

        <div className="panel-section">
          <h4>Legendă</h4>
          <div style={{ fontSize: '11px', color: '#666', lineHeight: 2 }}>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <div style={{width:'24px',height:'4px',background:'#1a1a1a'}}></div> Perete
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <div style={{width:'24px',height:'3px',background:'#666'}}></div> Ușă
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <div style={{width:'24px',height:'2px',background:'#999'}}></div> Fereastră
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <div style={{width:'16px',height:'16px',border:'1.5px solid #333',borderRadius:'2px'}}></div> Masă
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleDuplicate = () => {
    const newElement = {
      ...selectedElement,
      id: uuidv4(),
      x: selectedElement.x + 20,
      y: selectedElement.y + 20,
      tableNumber: selectedElement.type === 'table' 
        ? Math.max(...elements.filter(e => e.type === 'table').map(e => e.tableNumber || 0)) + 1 
        : undefined
    };
    addElement(newElement);
  };

  const handleRotate = () => {
    updateElement(selectedElement.id, {
      rotation: (selectedElement.rotation + 45) % 360
    });
  };

  const getTypeName = () => {
    switch(selectedElement.type) {
      case 'wall': return 'Perete';
      case 'door': return 'Ușă';
      case 'window': return 'Fereastră';
      case 'table': return 'Masă';
      case 'column': return 'Coloană';
      case 'line': return 'Linie';
      default: return 'Element';
    }
  };

  return (
    <div className="properties-panel">
      <div className="panel-header">{getTypeName()}</div>

      <div className="panel-section">
        <h4>Acțiuni</h4>
        <div className="panel-actions">
          <button className="panel-btn" onClick={handleDuplicate}>
            <CopyIcon /> Duplică
          </button>
          <button className="panel-btn" onClick={handleRotate}>
            <RotateIcon /> Rotește
          </button>
          <button className="panel-btn danger" onClick={() => deleteElement(selectedElement.id)}>
            <TrashIcon /> Șterge
          </button>
        </div>
      </div>

      {/* Dimensions for walls, doors, windows */}
      {['wall', 'door', 'window', 'line'].includes(selectedElement.type) && (
        <div className="panel-section">
          <h4>Dimensiuni</h4>
          <div className="property-row">
            <label>Lungime</label>
            <input
              type="number"
              step="0.01"
              value={selectedElement.widthM?.toFixed(2) || '0'}
              onChange={(e) => {
                const newLengthM = Number(e.target.value);
                if (selectedElement.x2 !== undefined && selectedElement.y2 !== undefined) {
                  const dx = selectedElement.x2 - selectedElement.x;
                  const dy = selectedElement.y2 - selectedElement.y;
                  const currentLength = Math.sqrt(dx*dx + dy*dy);
                  const ratio = mToPx(newLengthM) / currentLength;
                  updateElement(selectedElement.id, {
                    widthM: newLengthM,
                    x2: selectedElement.x + dx * ratio,
                    y2: selectedElement.y + dy * ratio
                  });
                }
              }}
            />
            <span className="unit">m</span>
          </div>
        </div>
      )}

      {/* Table properties */}
      {selectedElement.type === 'table' && (
        <>
          <div className="panel-section">
            <h4>Dimensiuni</h4>
            <div className="property-row">
              <label>Lățime</label>
              <input
                type="number"
                step="0.1"
                value={selectedElement.widthM?.toFixed(1) || '0.9'}
                onChange={(e) => updateElement(selectedElement.id, { widthM: Number(e.target.value) })}
              />
              <span className="unit">m</span>
            </div>
            {selectedElement.shape !== 'round' && (
              <div className="property-row">
                <label>Adâncime</label>
                <input
                  type="number"
                  step="0.1"
                  value={selectedElement.heightM?.toFixed(1) || '0.9'}
                  onChange={(e) => updateElement(selectedElement.id, { heightM: Number(e.target.value) })}
                />
                <span className="unit">m</span>
              </div>
            )}
          </div>

          <div className="panel-section">
            <h4>Detalii Masă</h4>
            <div className="property-row">
              <label>Număr</label>
              <input
                type="number"
                min="1"
                value={selectedElement.tableNumber || 1}
                onChange={(e) => updateElement(selectedElement.id, { tableNumber: Number(e.target.value) })}
              />
            </div>
            <div className="property-row">
              <label>Capacitate</label>
              <input
                type="number"
                min="1"
                max="20"
                value={selectedElement.capacity || 4}
                onChange={(e) => updateElement(selectedElement.id, { capacity: Number(e.target.value) })}
              />
              <span className="unit">pers</span>
            </div>
            <div className="property-row">
              <label>Rotație</label>
              <input
                type="number"
                step="15"
                value={selectedElement.rotation || 0}
                onChange={(e) => updateElement(selectedElement.id, { rotation: Number(e.target.value) % 360 })}
              />
              <span className="unit">°</span>
            </div>
            <div className="checkbox-row" style={{marginTop: '12px'}}>
              <input
                type="checkbox"
                id="canCombine"
                checked={selectedElement.canCombine || false}
                onChange={(e) => updateElement(selectedElement.id, { canCombine: e.target.checked })}
              />
              <label htmlFor="canCombine">Poate fi combinată cu alte mese</label>
            </div>
          </div>
        </>
      )}

      {/* Column properties */}
      {selectedElement.type === 'column' && (
        <div className="panel-section">
          <h4>Dimensiuni</h4>
          <div className="property-row">
            <label>Diametru</label>
            <input
              type="number"
              step="0.05"
              value={selectedElement.widthM?.toFixed(2) || '0.3'}
              onChange={(e) => updateElement(selectedElement.id, { widthM: Number(e.target.value), heightM: Number(e.target.value) })}
            />
            <span className="unit">m</span>
          </div>
        </div>
      )}

      {/* Position */}
      <div className="panel-section">
        <h4>Poziție (pixeli)</h4>
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
      </div>
    </div>
  );
};

export default PropertiesPanel;