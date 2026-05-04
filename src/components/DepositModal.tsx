import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface DepositModalProps {
  onClose: () => void;
}

type Step = 'amount' | 'requisites';

const AMOUNTS = [100, 300, 500, 1000, 3000, 5000];
const PHONE = '79629031556';
const OPERATOR = 'Билайн';

export default function DepositModal({ onClose }: DepositModalProps) {
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [custom, setCustom] = useState('');
  const [copied, setCopied] = useState(false);

  const finalAmount = amount || custom;

  function handleCopy() {
    navigator.clipboard.writeText(PHONE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (step === 'requisites') {
    return (
      <Overlay onClose={onClose}>
        <div className="text-center">
          <div className="text-4xl mb-3">💳</div>
          <h2 className="text-xl font-bold text-white mb-1">Переведите {finalAmount} ₽</h2>
          <p className="text-neutral-400 text-sm mb-6">По номеру телефона ({OPERATOR})</p>

          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 mb-4">
            <p className="text-neutral-500 text-xs uppercase tracking-wide mb-2">Номер телефона</p>
            <p className="text-white text-2xl font-bold tracking-widest mb-3">+7 962 903-15-56</p>
            <p className="text-neutral-400 text-sm mb-4">Оператор: <span className="text-white font-bold">{OPERATOR}</span></p>
            <button
              onClick={handleCopy}
              className="w-full bg-neutral-700 hover:bg-neutral-600 text-white text-sm py-2 rounded transition-colors font-bold"
            >
              {copied ? '✅ Скопировано!' : '📋 Скопировать номер'}
            </button>
          </div>

          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 mb-6 text-left">
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-wide mb-1">Важно</p>
            <p className="text-neutral-300 text-sm">После перевода напишите нам — баланс будет пополнен в течение нескольких минут.</p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-yellow-400 text-black font-bold py-3 uppercase tracking-wide hover:bg-yellow-300 transition-colors"
          >
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
        <p className="text-neutral-400 text-sm mb-5">Выберите или введите сумму</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {AMOUNTS.map(a => (
            <button
              key={a}
              onClick={() => { setAmount(String(a)); setCustom(''); }}
              className={`py-3 text-sm font-bold rounded transition-all
                ${amount === String(a) ? 'bg-yellow-400 text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
            >
              {a} ₽
            </button>
          ))}
        </div>

        <div className="mb-6">
          <label className="text-neutral-400 text-xs uppercase tracking-wide block mb-1">Другая сумма</label>
          <input
            type="number"
            min={50}
            value={custom}
            onChange={e => { setCustom(e.target.value); setAmount(''); }}
            placeholder="Введите сумму в ₽"
            className="w-full bg-neutral-800 border border-neutral-700 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400 transition-colors"
          />
        </div>

        <button
          onClick={() => setStep('requisites')}
          disabled={!finalAmount || Number(finalAmount) < 50}
          className="w-full bg-yellow-400 text-black font-bold py-3 uppercase tracking-wide hover:bg-yellow-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded"
        >
          Далее →
        </button>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4" onClick={onClose}>
      <div
        className="bg-neutral-900 border border-neutral-800 p-8 w-full max-w-md relative rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors">
          <Icon name="X" size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
