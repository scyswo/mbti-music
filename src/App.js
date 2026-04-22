import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/global.css';

import Home from './pages/Home';

// Classic Mode (V1)
import ClassicQuiz    from './modules/classic-mode/Quiz';
import ClassicLoading from './modules/classic-mode/Loading';
import ClassicResult  from './modules/classic-mode/Result';
import ClassicShare   from './modules/classic-mode/Share';

// AI Engine (V2)
import MainQuiz      from './modules/ai-engine/MainQuiz';
import UnifiedResult from './modules/ai-engine/UnifiedResult';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/quiz"        element={<ClassicQuiz />} />
        <Route path="/loading"     element={<ClassicLoading />} />
        <Route path="/result"      element={<ClassicResult />} />
        <Route path="/share/:id"   element={<ClassicShare />} />
        <Route path="/v2"          element={<MainQuiz />} />
        <Route path="/v2/result"   element={<UnifiedResult />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
