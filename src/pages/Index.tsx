import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Featured from '@/components/Featured';
import Promo from '@/components/Promo';
import Footer from '@/components/Footer';
import WithdrawModal from '@/components/WithdrawModal';
import { getMe, guestRegister, logout } from '@/lib/api';

interface User {
  id?: number;
  name?: string;
  nickname?: string;
  email?: string;
  avatar?: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('session');
    if (session) {
      getMe().then(res => {
        if (res.ok) setUser(res.user);
        else localStorage.removeItem('session');
      });
    }
  }, []);

  async function handlePlay() {
    if (localStorage.getItem('session')) {
      navigate('/game');
      return;
    }
    setRegistering(true);
    const res = await guestRegister();
    setRegistering(false);
    if (res.ok) {
      setUser({ nickname: res.user.nickname });
      navigate('/game');
    }
  }

  function handleLogout() {
    logout();
    setUser(null);
  }

  return (
    <main className="min-h-screen">
      <Header
        user={user}
        onLoginClick={handlePlay}
        onLogout={handleLogout}
        onWithdrawClick={() => setShowWithdraw(true)}
        onPlayClick={() => navigate('/game')}
      />
      <Hero onPlayClick={handlePlay} registering={registering} />
      <Featured onBonusClick={handlePlay} />
      <Promo />
      <Footer />

      {showWithdraw && (
        <WithdrawModal
          onClose={() => setShowWithdraw(false)}
          isLoggedIn={!!user}
          onNeedLogin={handlePlay}
        />
      )}
    </main>
  );
};

export default Index;
