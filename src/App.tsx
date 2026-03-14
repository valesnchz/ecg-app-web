import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import WelcomeScreen from './components/WelcomeScreen';
import DashboardHome from './components/DashboardHome';
import LearningCatalog from './components/LearningCatalog';
import QuizGame from './components/QuizGame';
import PredictionView from './components/PredictionView';

/**
 * Inner shell that gates the app behind the WelcomeScreen if no user name is set.
 */
const AppShell: React.FC = () => {
  const { userName } = useUser();
  if (!userName) return <WelcomeScreen />;
  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      <Route path="/learning" element={<LearningCatalog />} />
      <Route path="/prediction" element={<PredictionView />} />
      <Route path="/quiz" element={<QuizGame />} />
      {/* Fallback */}
      <Route path="*" element={<DashboardHome />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <UserProvider>
    <Router>
      <div className="app-container">
        <AppShell />
      </div>
    </Router>
  </UserProvider>
);

export default App;
