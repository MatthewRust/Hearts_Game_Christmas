import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { GameProvider } from './context/GameContext';
import { SpitGameProvider } from './context/SpitGameContext';

import Layout from './layout/Layout';
import Home from './other Pages/Home';
import WaitingRoom from './other Pages/WaitingRoom';
import Leaderboard from './other Pages/Leaderboard';
import GamePage from './Hearts Pages/GamePage';
import SpitGame from './Spit Game/SpitGame';
import SpitWaitingRoom from './Spit Game/SpitWaitingRoom';

function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <GameProvider>
          <SpitGameProvider>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/waiting-room" element={<WaitingRoom />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/game" element={<GamePage />} />
                  <Route path="/spit-waiting-room" element={<SpitWaitingRoom />} />
                  <Route path="/spit-game" element={<SpitGame />} />
                </Routes>
              </Layout>
            </Router>
          </SpitGameProvider>
        </GameProvider>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
