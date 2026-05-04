import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Featured from '@/components/Featured';
import Promo from '@/components/Promo';
import Footer from '@/components/Footer';
import LoginModal from '@/components/LoginModal';
import WithdrawModal from '@/components/WithdrawModal';
import { getMe, logout } from '@/lib/api';

interface User {
  id?: number;
  name: string;
  email: string;
  avatar: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('session');
    if (session) {
      getMe().then(res => {
        if (res.ok) setUser(res.user);
        else localStorage.removeItem('session');
      });
    }
  }, []);

  function handleLogout() {
    logout();
    setUser(null);
  }

  return (
    <main className="min-h-screen">
      <Header
        user={user}
        onLoginClick={() => setShowLogin(true)}
        onLogout={handleLogout}
        onWithdrawClick={() => setShowWithdraw(true)}
      />
      <Hero onPlayClick={() => setShowLogin(true)} />
      <Featured onBonusClick={() => setShowLogin(true)} />
      <Promo />
      <Footer />

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={u => setUser(u)}
        />
      )}
      {showWithdraw && (
        <WithdrawModal
          onClose={() => setShowWithdraw(false)}
          isLoggedIn={!!user}
          onNeedLogin={() => setShowLogin(true)}
        />
      )}
    </main>
  );
};

export default Index;
