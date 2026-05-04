"""Заявки на вывод средств с уведомлением в Telegram"""
import json
import os
import urllib.request
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p55733046_creative_sphere_proj')
MIN_WITHDRAW = 200

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user_by_session(cur, session_id: str):
    cur.execute(
        f"SELECT u.id, u.email, u.name, u.balance FROM {SCHEMA}.users u "
        f"JOIN {SCHEMA}.sessions s ON s.user_id = u.id "
        f"WHERE s.id = %s AND s.expires_at > NOW()",
        (session_id,)
    )
    return cur.fetchone()

def send_telegram(message: str):
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
    if not token or not chat_id:
        return
    data = json.dumps({'chat_id': chat_id, 'text': message, 'parse_mode': 'HTML'}).encode()
    req = urllib.request.Request(
        f'https://api.telegram.org/bot{token}/sendMessage',
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    urllib.request.urlopen(req, timeout=5)

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')

    cookie = event.get('headers', {}).get('X-Cookie', '')
    session_id = None
    for part in cookie.split(';'):
        p = part.strip()
        if p.startswith('session='):
            session_id = p[8:]
    auth = event.get('headers', {}).get('X-Authorization', '')
    if not session_id and auth.startswith('Bearer '):
        session_id = auth[7:]

    conn = get_db()
    cur = conn.cursor()

    if action == 'get_balance':
        if not session_id:
            conn.close()
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'ok': False, 'error': 'Не авторизован'})}
        user = get_user_by_session(cur, session_id)
        conn.close()
        if not user:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'ok': False, 'error': 'Сессия истекла'})}
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'balance': float(user[3])})}

    if action == 'withdraw':
        if not session_id:
            conn.close()
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'ok': False, 'error': 'Не авторизован'})}

        user = get_user_by_session(cur, session_id)
        if not user:
            conn.close()
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'ok': False, 'error': 'Сессия истекла'})}

        user_id, email, name, balance = user
        amount = float(body.get('amount', 0))
        bank = body.get('bank', '').strip()
        phone = body.get('phone', '').strip()

        if amount < MIN_WITHDRAW:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'ok': False, 'error': f'Минимальная сумма вывода — {MIN_WITHDRAW} ₽'})}

        if float(balance) < amount:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'ok': False, 'error': 'Недостаточно средств на балансе'})}

        if not bank or not phone:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'ok': False, 'error': 'Укажите банк и номер телефона'})}

        cur.execute(
            f"UPDATE {SCHEMA}.users SET balance = balance - %s WHERE id = %s",
            (amount, user_id)
        )
        cur.execute(
            f"INSERT INTO {SCHEMA}.withdrawal_requests (user_id, amount, bank, phone) VALUES (%s, %s, %s, %s) RETURNING id",
            (user_id, amount, bank, phone)
        )
        request_id = cur.fetchone()[0]
        conn.commit()
        conn.close()

        msg = (
            f"💸 <b>Новая заявка на вывод #{request_id}</b>\n\n"
            f"👤 Пользователь: {name or 'Без имени'} ({email})\n"
            f"💰 Сумма: <b>{amount:.0f} ₽</b>\n"
            f"🏦 Банк: {bank}\n"
            f"📱 Номер СБП: {phone}\n\n"
            f"Переведите {amount:.0f} ₽ на номер {phone} ({bank})"
        )
        send_telegram(msg)

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'request_id': request_id})}

    conn.close()
    return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'ok': False, 'error': 'Неизвестное действие'})}
