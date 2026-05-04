"""Гостевая регистрация и игровой слот"""
import json
import os
import secrets
import random
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p55733046_creative_sphere_proj')
GUEST_START_BALANCE = 1000.0

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '🔔', '💎', '7️⃣']
PAYOUTS = {
    '🍒': 2, '🍋': 3, '🍊': 4, '🍇': 5,
    '⭐': 8, '🔔': 10, '💎': 20, '7️⃣': 50
}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_session_id(event):
    auth = event.get('headers', {}).get('X-Authorization', '')
    if auth.startswith('Bearer '):
        return auth[7:]
    cookie = event.get('headers', {}).get('X-Cookie', '')
    for part in cookie.split(';'):
        p = part.strip()
        if p.startswith('session='):
            return p[8:]
    return None

def get_user_by_session(cur, session_id):
    cur.execute(
        f"SELECT u.id, u.nickname, u.balance FROM {SCHEMA}.users u "
        f"JOIN {SCHEMA}.sessions s ON s.user_id = u.id "
        f"WHERE s.id = %s AND s.expires_at > NOW()",
        (session_id,)
    )
    return cur.fetchone()

def spin_reels():
    return [random.choice(SYMBOLS) for _ in range(3)]

def calc_win(reels, bet):
    if reels[0] == reels[1] == reels[2]:
        return bet * PAYOUTS[reels[0]]
    if reels[0] == reels[1] or reels[1] == reels[2]:
        sym = reels[1]
        return int(bet * PAYOUTS[sym] * 0.3)
    return 0

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')
    conn = get_db()
    cur = conn.cursor()

    if action == 'guest_register':
        guest_id = secrets.token_hex(16)
        nickname_num = random.randint(1000, 9999)
        nickname = f'Игрок{nickname_num}'
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (guest_id, nickname, balance, google_id, email) "
            f"VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (guest_id, nickname, GUEST_START_BALANCE, guest_id, f'{guest_id}@guest.local')
        )
        user_id = cur.fetchone()[0]
        session_id = secrets.token_hex(32)
        cur.execute(
            f"INSERT INTO {SCHEMA}.sessions (id, user_id) VALUES (%s, %s)",
            (session_id, user_id)
        )
        conn.commit()
        conn.close()
        return {
            'statusCode': 200, 'headers': CORS,
            'body': json.dumps({'ok': True, 'session': session_id, 'user': {'nickname': nickname, 'balance': GUEST_START_BALANCE}})
        }

    session_id = get_session_id(event)
    if not session_id:
        conn.close()
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'ok': False, 'error': 'Не авторизован'})}

    user = get_user_by_session(cur, session_id)
    if not user:
        conn.close()
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'ok': False, 'error': 'Сессия истекла'})}

    user_id, nickname, balance = user

    if action == 'get_state':
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'nickname': nickname, 'balance': float(balance)})}

    if action == 'spin':
        bet = float(body.get('bet', 10))
        if bet < 1:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'ok': False, 'error': 'Минимальная ставка 1 ₽'})}
        if float(balance) < bet:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'ok': False, 'error': 'Недостаточно средств'})}

        reels = spin_reels()
        win = calc_win(reels, bet)
        new_balance = float(balance) - bet + win

        cur.execute(
            f"UPDATE {SCHEMA}.users SET balance = %s WHERE id = %s",
            (new_balance, user_id)
        )
        conn.commit()
        conn.close()

        return {
            'statusCode': 200, 'headers': CORS,
            'body': json.dumps({'ok': True, 'reels': reels, 'win': win, 'bet': bet, 'balance': new_balance})
        }

    conn.close()
    return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'ok': False, 'error': 'Неизвестное действие'})}
