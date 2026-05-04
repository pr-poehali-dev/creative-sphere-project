import { useState, useEffect } from 'react';
import { getBalance, submitWithdraw } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface WithdrawModalProps {
  onClose: () => void;
  isLoggedIn: boolean;
  onNeedLogin: () => void;
}

const BANKS = ['Сбербанк', 'Тинькофф', 'ВТБ', 'Альфа-Банк', 'Райффайзен', 'Другой'];

type Step = 'amount' | 'details' | 'success' | 'no_funds' | 'loading';

export default function WithdrawModal({ onClose, isLoggedIn, onNeedLogin }: WithdrawModalProps) {
  const [step, setStep] = useState<Step>('loading');
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    getBalance().then(res => {
      if (res.ok) {
        setBalance(res.balance);
        setStep(res.balance >= 200 ? 'amount' : 'no_funds');
      }
    });
  }, [isLoggedIn]);

  async function handleSubmit() {
    setError('');
    const amt = parseFloat(amount);
    if (!bank) { setError('Выберите банк'); return; }
    if (!phone.trim()) { setError('Укажите номер телефона для СБП'); return; }

    setSubmitting(true);
    const res = await submitWithdraw(amt, bank, phone);
    setSubmitting(false);

    if (res.ok) {
      setStep('success');
    } else {
      setError(res.error || 'Ошибка. Попробуйте позже.');
    }
  }

  if (!isLoggedIn) {
    return (
      <Overlay onClose={onClose}>
        <div className="text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-xl font-bold text-white mb-2">Необходима авторизация</h2>
          <p className="text-neutral-400 mb-6 text-sm">Войдите, чтобы вывести средства</p>
          <button onClick={() => { onClose(); onNeedLogin(); }}
            className="w-full bg-yellow-400 text-black font-bold py-3 uppercase tracking-wide hover:bg-yellow-300 transition-colors rounded-lg">
            Войти
          </button>
        </div>
      </Overlay>
    );
  }

  if (step === 'loading') {
    return (
      <Overlay onClose={onClose}>
        <div className="text-center py-6">
          <div className="text-4xl mb-4 animate-pulse">⏳</div>
          <p className="text-neutral-400">Проверяем баланс...</p>
        </div>
      </Overlay>
    );
  }

  if (step === 'no_funds') {
    return (
      <Overlay onClose={onClose}>
        <div className="text-center">
          <div className="text-5xl mb-4">💰</div>
          <h2 className="text-xl font-bold text-white mb-2">Недостаточно средств</h2>
          <p className="text-neutral-400 mb-1 text-sm">Ваш баланс: <span className="text-yellow-400 font-bold">{balance.toFixed(0)} ₽</span></p>
          <p className="text-neutral-500 text-sm mb-6">Минимальная сумма вывода — <span className="text-white font-bold">200 ₽</span></p>
          <button onClick={onClose}
            className="w-full bg-neutral-800 text-white font-bold py-3 uppercase hover:bg-neutral-700 transition-colors rounded-lg">
            Закрыть
          </button>
        </div>
      </Overlay>
    );
  }

  if (step === 'success') {
    return (
      <Overlay onClose={onClose}>
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-white mb-2">Вывод в обработке!</h2>
          <p className="text-neutral-400 text-sm mb-1">
            Заявка на <span className="text-yellow-400 font-bold">{parseFloat(amount).toFixed(0)} ₽</span> принята.
          </p>
          <p className="text-neutral-500 text-sm mb-6">
            Сумма поступит на <span className="text-white font-bold">{phone}</span> ({bank}) в течение нескольких часов.
          </p>
          <button onClick={onClose}
            className="w-full bg-yellow-400 text-black font-bold py-3 uppercase tracking-wide hover:bg-yellow-300 transition-colors rounded-lg">
            Отлично!
          </button>
        </div>
      </Overlay>
    );
  }

  if (step === 'amount') {
    const amt = parseFloat(amount);
    const valid = amt >= 200 && amt <= balance;
    return (
      <Overlay onClose={onClose}>
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Вывод средств</h2>
          <p className="text-neutral-400 text-sm mb-5">
            Баланс: <span className="text-yellow-400 font-bold">{balance.toFixed(0)} ₽</span>
            <span className="text-neutral-600 ml-2 text-xs">· мин. 200 ₽</span>
          </p>

          <label className="text-neutral-400 text-xs uppercase tracking-wide block mb-1">Сумма вывода (₽)</label>
          <input
            type="number" min={200} max={balance}
            value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="Введите сумму"
            className="w-full bg-neutral-800 border border-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-yellow-400 transition-colors mb-6"
          />

          <button onClick={() => { setError(''); setStep('details'); }}
            disabled={!valid}
            className="w-full bg-yellow-400 text-black font-bold py-3 uppercase tracking-wide hover:bg-yellow-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-lg">
            Далее →
          </button>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <div>
        <button onClick={() => setStep('amount')} className="flex items-center gap-1 text-neutral-400 hover:text-white text-sm mb-4 transition-colors">
          <Icon name="ArrowLeft" size={14} /> Назад
        </button>
        <h2 className="text-xl font-bold text-white mb-1">Куда вывести?</h2>
        <p className="text-neutral-400 text-sm mb-5">
          Сумма: <span className="text-yellow-400 font-bold">{parseFloat(amount).toFixed(0)} ₽</span>
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-neutral-400 text-xs uppercase tracking-wide block mb-1">Банк</label>
            <select value={bank} onChange={e => setBank(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-yellow-400 transition-colors">
              <option value="">Выберите банк</option>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="text-neutral-400 text-xs uppercase tracking-wide block mb-1">Номер телефона (СБП)</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+7 900 000 00 00"
              className="w-full bg-neutral-800 border border-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full mt-6 bg-yellow-400 text-black font-bold py-3 uppercase tracking-wide hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg">
          {submitting ? '⏳ Отправляем...' : 'Вывести'}
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
