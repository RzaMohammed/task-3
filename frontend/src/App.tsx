import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PipelinePage } from './pages/PipelinePage';
import { NetworkStatus } from './components/NetworkStatus';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <NetworkStatus />
      <Routes>
        <Route path="/" element={<PipelinePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
