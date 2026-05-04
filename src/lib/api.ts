const URLS = {
  auth: 'https://functions.poehali.dev/7ab9d7e6-eaf9-4eb7-a35f-32c797bed762',
  withdraw: 'https://functions.poehali.dev/9c1f3d4f-995f-4003-bc0d-6daa40bc1a2d',
  game: 'https://functions.poehali.dev/95b2922c-73a1-4505-821e-747e46bf371f',
};

function getSession() {
  return localStorage.getItem('session') || '';
}

async function post(url: string, body: object) {
  const session = getSession();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function googleLogin(token: string) {
  const data = await post(URLS.auth, { action: 'google_login', token });
  if (data.ok && data.session) {
    localStorage.setItem('session', data.session);
  }
  return data;
}

export async function getMe() {
  return post(URLS.auth, { action: 'me' });
}

export async function getBalance() {
  return post(URLS.withdraw, { action: 'get_balance' });
}

export async function submitWithdraw(amount: number, bank: string, phone: string) {
  return post(URLS.withdraw, { action: 'withdraw', amount, bank, phone });
}

export function logout() {
  localStorage.removeItem('session');
}

export async function guestRegister() {
  const data = await post(URLS.game, { action: 'guest_register' });
  if (data.ok && data.session) {
    localStorage.setItem('session', data.session);
  }
  return data;
}

export async function getGameState() {
  return post(URLS.game, { action: 'get_state' });
}

export async function spin(bet: number) {
  return post(URLS.game, { action: 'spin', bet });
}