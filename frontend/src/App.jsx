import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { GameProvider } from './context/GameContext';

import Layout from './layout/Layout';
import Home from './other Pages/Home';
import WaitingRoom from './other Pages/WaitingRoom';
import GamePage from './Hearts Pages/GamePage';
import SpitGame from './Spit Game/SpitGame';

function App() {
  return (
    <ThemeProvider>
      <GameProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/waiting-room" element={<WaitingRoom />} />
              <Route path="/game" element={<GamePage />} />
              <Route path="/spit" element={<SpitGame />} />
            </Routes>
          </Layout>
        </Router>
      </GameProvider>
    </ThemeProvider>
  );
}

export default App;
