import { useState, useEffect, useRef } from 'react';
import { getGameState, spin } from '@/lib/api';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import DepositModal from '@/components/DepositModal';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '🔔', '💎', '7️⃣'];
const BETS = [5, 10, 25, 50, 100];

const PAYOUTS: Record<string, number> = {
  '🍒': 2, '🍋': 3, '🍊': 4, '🍇': 5,
  '⭐': 8, '🔔': 10, '💎': 20, '7️⃣': 50,
};

function Reel({ symbol, spinning }: { symbol: string; spinning: boolean }) {
  const [display, setDisplay] = useState(symbol);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (spinning) {
      interval.current = setInterval(() => {
        setDisplay(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      }, 80);
    } else {
      if (interval.current) clearInterval(interval.current);
      setDisplay(symbol);
    }
    return () => { if (interval.current) clearInterval(interval.current); };
  }, [spinning, symbol]);

  return (
    <div className={`w-24 h-24 md:w-32 md:h-32 flex items-center justify-center text-5xl md:text-6xl rounded-lg border-2 transition-all duration-200 select-none
      ${spinning ? 'border-yellow-400 bg-neutral-800 animate-pulse' : 'border-neutral-700 bg-neutral-800'}`}>
      {display}
    </div>
  );
}

export default function SlotGame() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [balance, setBalance] = useState(0);
  const [reels, setReels] = useState(['🎰', '🎰', '🎰']);
  const [spinning, setSpinning] = useState(false);
  const [bet, setBet] = useState(10);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('session');
    if (!session) { navigate('/'); return; }
    getGameState().then(res => {
      if (res.ok) {
        setNickname(res.nickname);
        setBalance(res.balance);
      } else {
        navigate('/');
      }
      setLoading(false);
    });
  }, [navigate]);

  async function handleSpin() {
    if (spinning || balance < bet) return;
    setSpinning(true);
    setLastWin(null);
    setMessage('');

    const res = await spin(bet);
    await new Promise(r => setTimeout(r, 1200));
    setSpinning(false);

    if (res.ok) {
      setReels(res.reels);
      setBalance(res.balance);
      if (res.win > 0) {
        setLastWin(res.win);
        setMessage(`🎉 Выигрыш ${res.win.toFixed(0)} ₽!`);
      } else {
        setMessage('Попробуй ещё раз!');
      }
    } else {
      setMessage(res.error || 'Ошибка. Попробуй ещё раз.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-yellow-400 text-2xl animate-pulse">Загрузка...</div>
      </div>
    );
  }

  const isWin = lastWin && lastWin > 0;
  const allSame = reels[0] === reels[1] && reels[1] === reels[2] && reels[0] !== '🎰';

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <button onClick={() => navigate('/')} className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 text-sm">
          <Icon name="ArrowLeft" size={16} />
          На главную
        </button>
        <div className="text-yellow-400 font-bold text-sm uppercase tracking-widest">🎰 LuckySlots</div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-neutral-400">{nickname}</div>
            <div className="text-yellow-400 font-bold">{balance.toFixed(0)} ₽</div>
          </div>
          <button
            onClick={() => setShowDeposit(true)}
            className="bg-yellow-400 text-black text-xs font-bold uppercase px-3 py-2 hover:bg-yellow-300 transition-colors"
          >
            + Пополнить
          </button>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8">

        {/* Machine */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-yellow-400 uppercase tracking-widest">Lucky Slot</h1>
            <p className="text-neutral-500 text-xs mt-1">Ставка: {bet} ₽</p>
          </div>

          {/* Reels */}
          <div className={`flex gap-3 justify-center mb-6 p-4 rounded-xl ${allSame ? 'bg-yellow-400/10 border border-yellow-400' : 'bg-neutral-950 border border-neutral-800'}`}>
            {reels.map((sym, i) => (
              <Reel key={i} symbol={sym} spinning={spinning} />
            ))}
          </div>

          {/* Message */}
          <div className="h-10 flex items-center justify-center">
            {message && (
              <p className={`text-lg font-bold text-center ${isWin ? 'text-yellow-400' : 'text-neutral-400'}`}>
                {message}
              </p>
            )}
          </div>

          {/* Spin button */}
          <button
            onClick={handleSpin}
            disabled={spinning || balance < bet}
            className={`w-full py-5 text-lg font-bold uppercase tracking-widest rounded-xl transition-all duration-200 mt-2
              ${spinning ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed' :
                balance < bet ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' :
                'bg-yellow-400 text-black hover:bg-yellow-300 active:scale-95 cursor-pointer shadow-lg shadow-yellow-400/20'}`}
          >
            {spinning ? '⏳ Крутим...' : balance < bet ? 'Недостаточно средств' : '🎰 КРУТИТЬ'}
          </button>

          {balance < bet && !spinning && (
            <button
              onClick={() => setShowDeposit(true)}
              className="w-full py-3 text-sm font-bold uppercase tracking-wide rounded-xl bg-neutral-800 border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-200 cursor-pointer mt-2"
            >
              💳 Пополнить баланс
            </button>
          )}
        </div>

        {/* Bet selector */}
        <div className="w-full max-w-md">
          <p className="text-neutral-500 text-xs uppercase tracking-wide mb-2 text-center">Размер ставки</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {BETS.map(b => (
              <button
                key={b}
                onClick={() => setBet(b)}
                disabled={spinning}
                className={`px-4 py-2 text-sm font-bold rounded transition-all duration-150
                  ${bet === b ? 'bg-yellow-400 text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
              >
                {b} ₽
              </button>
            ))}
          </div>
        </div>

        {/* Paytable */}
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-neutral-500 text-xs uppercase tracking-wide mb-3 text-center">Таблица выплат (3 одинаковых)</p>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(PAYOUTS).map(([sym, mult]) => (
              <div key={sym} className="flex flex-col items-center gap-1 bg-neutral-800 rounded p-2">
                <span className="text-2xl">{sym}</span>
                <span className="text-yellow-400 text-xs font-bold">×{mult}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
    </div>
  );
}