interface User {
  name?: string;
  nickname?: string;
  email?: string;
  avatar?: string;
}

interface HeaderProps {
  className?: string;
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onWithdrawClick: () => void;
  onPlayClick?: () => void;
}

export default function Header({ className, user, onLoginClick, onLogout, onWithdrawClick, onPlayClick }: HeaderProps) {
  const displayName = user?.nickname || user?.name || '';

  return (
    <header className={`absolute top-0 left-0 right-0 z-10 p-6 ${className ?? ''}`}>
      <div className="flex justify-between items-center">
        <div className="text-yellow-400 text-sm uppercase tracking-widest font-bold">🎰 LuckySlots</div>
        <nav className="flex gap-4 items-center">
          <a href="#slots" className="text-white hover:text-yellow-400 transition-colors duration-300 uppercase text-sm hidden md:block">
            Слоты
          </a>
          <a href="#bonuses" className="text-white hover:text-yellow-400 transition-colors duration-300 uppercase text-sm hidden md:block">
            Бонусы
          </a>

          {user ? (
            <div className="flex items-center gap-3">
              <button onClick={onPlayClick}
                className="bg-yellow-400 text-black hover:bg-yellow-300 transition-colors duration-300 uppercase text-xs px-3 py-2 font-bold">
                Играть
              </button>
              <button onClick={onWithdrawClick}
                className="bg-neutral-800 text-yellow-400 border border-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors duration-300 uppercase text-xs px-3 py-2 font-bold">
                Вывести
              </button>
              <div className="flex items-center gap-2">
                {user.avatar && (
                  <img src={user.avatar} alt={displayName} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                )}
                <span className="text-white text-sm hidden md:block">{displayName}</span>
              </div>
              <button onClick={onLogout} className="text-neutral-500 hover:text-white transition-colors text-xs uppercase">
                Выйти
              </button>
            </div>
          ) : (
            <button onClick={onLoginClick}
              className="bg-yellow-400 text-black hover:bg-yellow-300 transition-colors duration-300 uppercase text-sm px-4 py-2 font-bold">
              Регистрация
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}