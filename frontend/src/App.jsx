import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import LoginCallback from './pages/LoginCallback';
import AuthModal from './components/AuthModal';
import { useAuth } from './contexts/AuthContext';
import Profile from './pages/Profile/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import MentorDetail from './pages/MentorDetail';
import NotificationsPage from './pages/Notifications';
import { MyMentorship } from './pages/MyMentorship';
import { Roadmap } from './pages/Roadmap';
import MySchedules from './pages/MySchedules';
import ChatPage from './pages/Chat/ChatPage';

export default function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginTab, setIsLoginTab] = useState(true);
  const { login, fetchUser } = useAuth();

  const handleOpenAuth = (isLogin = true) => {
    setIsLoginTab(isLogin);
    setShowAuthModal(true);
  };

  return (
    <>
      <Routes>
        <Route element={<MainLayout onOpenAuth={handleOpenAuth} />}>
          <Route path='/' element={<Home onOpenAuth={handleOpenAuth} />} />
          <Route path='/profile' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path='/mentor-detail/:id' element={<MentorDetail onOpenAuth={handleOpenAuth} />} />
          <Route path='/notifications' element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path='/my-mentorship' element={<ProtectedRoute><MyMentorship /></ProtectedRoute>} />
          <Route path='/my-mentorship/:id/roadmap' element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
          <Route path='/my-schedules' element={<ProtectedRoute><MySchedules /></ProtectedRoute>} />
          <Route path='/chat' element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

        </Route>
        <Route path='/login/callback' element={<LoginCallback />} />
      </Routes>

      <AuthModal
        show={showAuthModal}
        handleClose={() => setShowAuthModal(false)}
        isLoginInitial={isLoginTab}
        onLoginSuccess={fetchUser || login}
      />
    </>
  );
}