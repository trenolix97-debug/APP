import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../store/editorStore';
import { TableShape } from '../types';
import { v4 as uuidv4 } from 'uuid';

const COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const TableDesigner: React.FC = () => {
  const navigate = useNavigate();
  const { addTableTemplate, tableTemplates, deleteTableTemplate } = useEditorStore();
  
  const [name, setName] = useState('');
  const [shape, setShape] = useState<TableShape>('square');
  const [capacity, setCapacity] = useState(4);
  const [width, setWidth] = useState(80);
  const [height, setHeight] = useState(80);
  const [color, setColor] = useState(COLORS[0]);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Te rog introdu un nume pentru masă!');
      return;
    }

    addTableTemplate({
      id: uuidv4(),
      name: name.trim(),
      shape,
      capacity,
      width: shape === 'round' ? Math.max(width, height) : width,
      height: shape === 'round' ? Math.max(width, height) : height,
      color
    });

    // Reset form
    setName('');
    setCapacity(4);
    setWidth(80);
    setHeight(80);
    setShowForm(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      padding: '40px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <div>
            <h1 style={{ 
              color: 'white', 
              fontSize: '32px', 
              fontWeight: 700,
              marginBottom: '8px'
            }}>
              🪑 Designer Mese
            </h1>
            <p style={{ color: '#94a3b8' }}>
              Creează template-uri de mese pentru floor plan-ul tău
            </p>
          </div>
          
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/')}
            style={{ background: 'white' }}
          >
            ← Înapoi la Editor
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
          {/* Existing Templates */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ color: 'white', fontSize: '20px' }}>
                Template-uri Existente ({tableTemplates.length})
              </h2>
              
              {!showForm && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  + Adaugă Template Nou
                </button>
              )}
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {tableTemplates.map((template) => (
                <div
                  key={template.id}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      background: template.color,
                      borderRadius: template.shape === 'round' ? '50%' : '8px',
                      margin: '0 auto 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '24px',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    {template.capacity}
                  </div>
                  
                  <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>
                    {template.name}
                  </h3>
                  
                  <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '12px' }}>
                    {template.capacity} persoane • {template.shape}
                  </p>
                  
                  <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '16px' }}>
                    {template.width} x {template.height} px
                  </p>

                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      if (confirm(`Ștergi template-ul "${template.name}"?`)) {
                        deleteTableTemplate(template.id);
                      }
                    }}
                    style={{ fontSize: '12px', padding: '8px 16px' }}
                  >
                    Șterge
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Create Form */}
          {showForm && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              height: 'fit-content'
            }}>
              <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>
                Creează Template Nou
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nume Template</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Masă 4 persoane"
                  />
                </div>

                <div className="form-group">
                  <label>Formă</label>
                  <div className="shape-selector">
                    {(['square', 'round', 'rectangle'] as TableShape[]).map((s) => (
                      <div
                        key={s}
                        className={`shape-option ${shape === s ? 'selected' : ''}`}
                        onClick={() => setShape(s)}
                      >
                        <div
                          style={{
                            width: '48px',
                            height: s === 'rectangle' ? '32px' : '48px',
                            background: color,
                            borderRadius: s === 'round' ? '50%' : '4px',
                            margin: '0 auto 8px'
                          }}
                        />
                        <span style={{ fontSize: '12px' }}>
                          {s === 'square' ? 'Pătrat' : s === 'round' ? 'Rotund' : 'Dreptunghi'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Capacitate (persoane)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Lățime (px)</label>
                    <input
                      type="number"
                      min="40"
                      max="300"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Înălțime (px)</label>
                    <input
                      type="number"
                      min="40"
                      max="300"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      disabled={shape === 'round'}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Culoare</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {COLORS.map((c) => (
                      <div
                        key={c}
                        onClick={() => setColor(c)}
                        style={{
                          width: '32px',
                          height: '32px',
                          background: c,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: color === c ? '3px solid #1e293b' : '3px solid transparent',
                          transition: 'all 0.2s'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  marginBottom: '24px'
                }}>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Preview</p>
                  <div
                    style={{
                      width: `${Math.min(width, 100)}px`,
                      height: `${Math.min(shape === 'round' ? width : height, 100)}px`,
                      background: color,
                      borderRadius: shape === 'round' ? '50%' : '8px',
                      margin: '0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    {capacity}
                  </div>
                </div>

                <div className="modal-actions" style={{ justifyContent: 'stretch' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowForm(false)}
                    style={{ flex: 1 }}
                  >
                    Anulează
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Salvează Template
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableDesigner;