import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface DepositModalProps {
  onClose: () => void;
}

const PHONE = '79629031556';
const PHONE_FORMATTED = '+7 962 903-15-56';
const OPERATOR = 'Билайн';

export default function DepositModal({ onClose }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'amount' | 'pay'>('amount');
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(PHONE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (step === 'pay') {
    return (
      <Overlay onClose={onClose}>
        <div className="text-center">
          <div className="text-5xl mb-3">💳</div>
          <h2 className="text-2xl font-bold text-white mb-1">Переведите <span className="text-yellow-400">{amount} ₽</span></h2>
          <p className="text-neutral-400 text-sm mb-6">По номеру телефона ({OPERATOR})</p>

          <div className="bg-neutral-800 border border-yellow-400/40 rounded-xl p-5 mb-5">
            <p className="text-neutral-400 text-xs uppercase tracking-widest mb-2">Номер телефона</p>
            <p className="text-white text-3xl font-bold tracking-widest mb-1">{PHONE_FORMATTED}</p>
            <p className="text-neutral-500 text-sm mb-4">Оператор: <span className="text-white font-semibold">{OPERATOR}</span></p>
            <button
              onClick={handleCopy}
              className="w-full bg-neutral-700 hover:bg-neutral-600 text-white text-sm py-2.5 rounded-lg transition-colors font-bold"
            >
              {copied ? '✅ Скопировано!' : '📋 Скопировать номер'}
            </button>
          </div>

          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 mb-6 text-left">
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-wide mb-1">После перевода</p>
            <p className="text-neutral-300 text-sm">Баланс будет пополнен вручную в течение нескольких минут.</p>
          </div>

          <button onClick={onClose}
            className="w-full bg-yellow-400 text-black font-bold py-3 uppercase tracking-wide hover:bg-yellow-300 transition-colors rounded-lg">
            Я перевёл — закрыть
          </button>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Пополнение баланса</h2>
        <p className="text-neutral-400 text-sm mb-5">Укажите сумму пополнения</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[100, 300, 500, 1000, 3000, 5000].map(a => (
            <button key={a} onClick={() => setAmount(String(a))}
              className={`py-3 text-sm font-bold rounded-lg transition-all
                ${amount === String(a) ? 'bg-yellow-400 text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}>
              {a} ₽
            </button>
          ))}
        </div>

        <div className="mb-6">
          <label className="text-neutral-400 text-xs uppercase tracking-wide block mb-1">Другая сумма</label>
          <input
            type="number" min={50}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Введите сумму в ₽"
            className="w-full bg-neutral-800 border border-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-yellow-400 transition-colors"
          />
        </div>

        <button
          onClick={() => setStep('pay')}
          disabled={!amount || Number(amount) < 50}
          className="w-full bg-yellow-400 text-black font-bold py-3 uppercase tracking-wide hover:bg-yellow-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-lg">
          Далее →
        </button>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4" onClick={onClose}>
      <div className="bg-neutral-900 border border-neutral-800 p-8 w-full max-w-md relative rounded-2xl"
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors">
          <Icon name="X" size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
