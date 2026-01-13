import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Editor from './pages/Editor';
import TableDesigner from './pages/TableDesigner';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Editor />} />
      <Route path="/table-designer" element={<TableDesigner />} />
    </Routes>
  );
}

export default App;