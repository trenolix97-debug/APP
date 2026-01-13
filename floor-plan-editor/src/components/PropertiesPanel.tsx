import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { TrashIcon, CopyIcon, RotateIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from './Icons';

const PropertiesPanel: React.FC = () => {
  const {
    selectedElementId,
    getElements,
    updateElement,
    deleteElement,
    duplicateElement,
    alignElements,
    tableTemplates,
    scale
  } = useEditorStore();

  const elements = getElements();
  const selectedElement = elements.find(el => el.id === selectedElementId);
  const tables = elements.filter(el => el.type === 'table');

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

        {tables.length >= 2 && (
          <div className="panel-section">
            <h4>Aliniere Mese ({tables.length})</h4>
            <div className="align-buttons">
              <button onClick={() => alignElements('left')} title="Aliniere stânga">
                <AlignLeftIcon />
              </button>
              <button onClick={() => alignElements('center')} title="Aliniere centru">
                <AlignCenterIcon />
              </button>
              <button onClick={() => alignElements('right')} title="Aliniere dreapta">
                <AlignRightIcon />
              </button>
            </div>
            <div className="align-buttons" style={{marginTop: '6px'}}>
              <button onClick={() => alignElements('top')} title="Aliniere sus">
                <span style={{transform: 'rotate(-90deg)', display: 'inline-block'}}><AlignLeftIcon /></span>
              </button>
              <button onClick={() => alignElements('middle')} title="Aliniere mijloc">
                <span style={{transform: 'rotate(-90deg)', display: 'inline-block'}}><AlignCenterIcon /></span>
              </button>
              <button onClick={() => alignElements('bottom')} title="Aliniere jos">
                <span style={{transform: 'rotate(-90deg)', display: 'inline-block'}}><AlignRightIcon /></span>
              </button>
            </div>
          </div>
        )}

        <div className="panel-section">
          <h4>Legendă</h4>
          <div className="legend-list">
            <div className="legend-item">
              <div className="legend-line wall"></div>
              <span>Perete</span>
            </div>
            <div className="legend-item">
              <div className="legend-line door"></div>
              <span>Ușă</span>
            </div>
            <div className="legend-item">
              <div className="legend-line window"></div>
              <span>Fereastră</span>
            </div>
            <div className="legend-item">
              <div className="legend-box"></div>
              <span>Masă</span>
            </div>
            <div className="legend-item">
              <div className="legend-circle"></div>
              <span>Coloană</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="panel-header">
        <span>{getTypeName()}</span>
        <span className="panel-header-id">#{selectedElement.id.slice(0, 6)}</span>
      </div>

      <div className="panel-section">
        <h4>Acțiuni</h4>
        <div className="panel-actions">
          <button className="panel-btn" onClick={() => duplicateElement(selectedElement.id)} title="Ctrl+D">
            <CopyIcon /> Duplică
          </button>
          <button 
            className="panel-btn" 
            onClick={() => updateElement(selectedElement.id, { rotation: (selectedElement.rotation + 45) % 360 })}
            title="R"
          >
            <RotateIcon /> Rotește
          </button>
          <button className="panel-btn danger" onClick={() => deleteElement(selectedElement.id)} title="Delete">
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
                  if (currentLength > 0) {
                    const ratio = mToPx(newLengthM) / currentLength;
                    updateElement(selectedElement.id, {
                      widthM: newLengthM,
                      x2: selectedElement.x + dx * ratio,
                      y2: selectedElement.y + dy * ratio
                    });
                  }
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
              <label>{selectedElement.shape === 'round' ? 'Diametru' : 'Lățime'}</label>
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
              <label htmlFor="canCombine">Poate fi combinată</label>
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
        <h4>Poziție</h4>
        <div className="property-row">
          <label>X</label>
          <input
            type="number"
            value={Math.round(selectedElement.x)}
            onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
          />
          <span className="unit">px</span>
        </div>
        <div className="property-row">
          <label>Y</label>
          <input
            type="number"
            value={Math.round(selectedElement.y)}
            onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
          />
          <span className="unit">px</span>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;