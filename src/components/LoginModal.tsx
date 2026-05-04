import { useEffect } from 'react';
import { googleLogin } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: (user: { name: string; email: string; avatar: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = '780458451622-placeholder.apps.googleusercontent.com';

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  useEffect(() => {
    const scriptId = 'google-gsi-script';
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
    }

    const init = () => {
      const el = document.getElementById('google-btn');
      if (!el || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp: { credential: string }) => {
          const data = await googleLogin(resp.credential);
          if (data.ok) {
            onSuccess(data.user);
            onClose();
          }
        },
      });
      window.google.accounts.id.renderButton(el, {
        theme: 'filled_black',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 320,
      });
    };

    const interval = setInterval(() => {
      if (window.google) { clearInterval(interval); init(); }
    }, 300);
    return () => clearInterval(interval);
  }, [onClose, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4" onClick={onClose}>
      <div
        className="bg-neutral-900 border border-neutral-800 p-8 w-full max-w-sm relative text-center"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors">
          <Icon name="X" size={20} />
        </button>
        <div className="text-4xl mb-4">🎰</div>
        <h2 className="text-xl font-bold text-white mb-2">Войти в LuckySlots</h2>
        <p className="text-neutral-400 text-sm mb-6">Войдите через Google для доступа к балансу, бонусам и выводу средств</p>
        <div id="google-btn" className="flex justify-center" />
        <p className="text-neutral-600 text-xs mt-4">18+ | Играйте ответственно</p>
      </div>
    </div>
  );
}
