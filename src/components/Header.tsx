interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  return (
    <header className={`absolute top-0 left-0 right-0 z-10 p-6 ${className ?? ""}`}>
      <div className="flex justify-between items-center">
        <div className="text-yellow-400 text-sm uppercase tracking-widest font-bold">🎰 LuckySlots</div>
        <nav className="flex gap-8">
          <a
            href="#slots"
            className="text-white hover:text-yellow-400 transition-colors duration-300 uppercase text-sm"
          >
            Слоты
          </a>
          <a
            href="#bonuses"
            className="text-white hover:text-yellow-400 transition-colors duration-300 uppercase text-sm"
          >
            Бонусы
          </a>
          <a
            href="#contact"
            className="bg-yellow-400 text-black hover:bg-yellow-300 transition-colors duration-300 uppercase text-sm px-4 py-2 font-bold"
          >
            Войти
          </a>
        </nav>
      </div>
    </header>
  );
}