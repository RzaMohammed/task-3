import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PipelinePage } from './pages/PipelinePage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PipelinePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
