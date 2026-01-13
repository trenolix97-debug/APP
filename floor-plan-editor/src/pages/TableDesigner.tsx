import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../store/editorStore';
import { TableShape } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { TrashIcon, EditIcon } from '../components/Icons';

const TableDesigner: React.FC = () => {
  const navigate = useNavigate();
  const { addTableTemplate, tableTemplates, deleteTableTemplate, updateTableTemplate } = useEditorStore();
  
  const [name, setName] = useState('');
  const [shape, setShape] = useState<TableShape>('square');
  const [capacity, setCapacity] = useState(4);
  const [widthM, setWidthM] = useState(0.9);
  const [heightM, setHeightM] = useState(0.9);
  const [canCombine, setCanCombine] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setShape('square');
    setCapacity(4);
    setWidthM(0.9);
    setHeightM(0.9);
    setCanCombine(true);
    setEditingId(null);
  };

  const handleEdit = (template: typeof tableTemplates[0]) => {
    setName(template.name);
    setShape(template.shape);
    setCapacity(template.capacity);
    setWidthM(template.widthM);
    setHeightM(template.heightM);
    setCanCombine(template.canCombine);
    setEditingId(template.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Introdu un nume pentru masă!');
      return;
    }

    const templateData = {
      name: name.trim(),
      shape,
      capacity,
      widthM: shape === 'round' ? Math.max(widthM, heightM) : widthM,
      heightM: shape === 'round' ? Math.max(widthM, heightM) : heightM,
      canCombine
    };

    if (editingId) {
      updateTableTemplate(editingId, templateData);
    } else {
      addTableTemplate({
        id: uuidv4(),
        ...templateData
      });
    }

    resetForm();
    setShowForm(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      padding: '40px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
              Designer Mese
            </h1>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Creează și gestionează template-uri de mese
            </p>
          </div>
          
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/')}
          >
            ← Înapoi la Editor
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr 360px' : '1fr', gap: '24px' }}>
          {/* Existing Templates */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: 500 }}>
                Template-uri ({tableTemplates.length})
              </h2>
              
              {!showForm && (
                <button
                  className="btn btn-primary"
                  onClick={() => { resetForm(); setShowForm(true); }}
                >
                  + Adaugă Template
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {tableTemplates.map((template) => (
                <div
                  key={template.id}
                  style={{
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      width: template.shape === 'rectangle' || template.shape === 'oval' ? '60px' : '48px',
                      height: template.shape === 'rectangle' || template.shape === 'oval' ? '36px' : '48px',
                      border: '1.5px solid #333',
                      borderRadius: template.shape === 'round' ? '50%' : template.shape === 'oval' ? '50%' : '4px',
                      margin: '0 auto 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 600,
                      background: 'white'
                    }}
                  >
                    {template.capacity}
                  </div>
                  
                  <h3 style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                    {template.name}
                  </h3>
                  
                  <p style={{ color: '#888', fontSize: '11px', marginBottom: '8px' }}>
                    {template.widthM}m x {template.heightM}m
                  </p>
                  
                  {template.canCombine && (
                    <span style={{ 
                      fontSize: '10px', 
                      background: '#e8f5e9', 
                      color: '#2e7d32',
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}>
                      Combinabilă
                    </span>
                  )}

                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleEdit(template)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        background: '#f5f5f5',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <EditIcon /> Editează
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Ștergi "${template.name}"?`)) {
                          deleteTableTemplate(template.id);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        background: '#fff5f5',
                        border: '1px solid #ffcdd2',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#c62828'
                      }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create/Edit Form */}
          {showForm && (
            <div style={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '24px',
              height: 'fit-content'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '20px' }}>
                {editingId ? 'Editează Template' : 'Template Nou'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nume</label>
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
                    {(['square', 'round', 'rectangle', 'oval'] as TableShape[]).map((s) => (
                      <div
                        key={s}
                        className={`shape-option ${shape === s ? 'selected' : ''}`}
                        onClick={() => setShape(s)}
                      >
                        <div className={`shape-preview ${s}`} />
                        <span>
                          {s === 'square' ? 'Pătrat' : s === 'round' ? 'Rotund' : s === 'rectangle' ? 'Drept.' : 'Oval'}
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

                <div className="form-row">
                  <div className="form-group">
                    <label>{shape === 'round' ? 'Diametru (m)' : 'Lățime (m)'}</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.3"
                      max="5"
                      value={widthM}
                      onChange={(e) => setWidthM(Number(e.target.value))}
                    />
                  </div>
                  
                  {shape !== 'round' && (
                    <div className="form-group">
                      <label>Adâncime (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.3"
                        max="5"
                        value={heightM}
                        onChange={(e) => setHeightM(Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>

                <div className="checkbox-row" style={{ marginBottom: '20px' }}>
                  <input
                    type="checkbox"
                    id="canCombine"
                    checked={canCombine}
                    onChange={(e) => setCanCombine(e.target.checked)}
                  />
                  <label htmlFor="canCombine">Poate fi combinată cu alte mese</label>
                </div>

                {/* Preview */}
                <div style={{
                  background: '#fafafa',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  marginBottom: '20px'
                }}>
                  <p style={{ fontSize: '11px', color: '#888', marginBottom: '12px' }}>Preview</p>
                  <div
                    style={{
                      width: shape === 'rectangle' || shape === 'oval' ? '70px' : '50px',
                      height: shape === 'rectangle' || shape === 'oval' ? '40px' : '50px',
                      border: '1.5px solid #333',
                      borderRadius: shape === 'round' || shape === 'oval' ? '50%' : '4px',
                      margin: '0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 600,
                      background: 'white'
                    }}
                  >
                    {capacity}
                  </div>
                  <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
                    {widthM}m x {shape === 'round' ? widthM : heightM}m
                  </p>
                </div>

                <div className="modal-actions" style={{ justifyContent: 'stretch' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    style={{ flex: 1 }}
                  >
                    Anulează
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    {editingId ? 'Salvează' : 'Creează'}
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