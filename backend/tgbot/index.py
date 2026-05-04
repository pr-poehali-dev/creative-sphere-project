"""Telegram-бот для управления балансом игроков"""
import json
import os
import urllib.request
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p55733046_creative_sphere_proj')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def tg_send(token: str, chat_id, text: str, parse_mode='HTML'):
    data = json.dumps({'chat_id': chat_id, 'text': text, 'parse_mode': parse_mode}).encode()
    req = urllib.request.Request(
        f'https://api.telegram.org/bot{token}/sendMessage',
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    try:
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass

def is_admin(chat_id: int) -> bool:
    admin_id = os.environ.get('TELEGRAM_CHAT_ID', '')
    return str(chat_id) == str(admin_id)

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    body = json.loads(event.get('body') or '{}')
    message = body.get('message', {})

    if not message:
        return {'statusCode': 200, 'headers': CORS, 'body': 'ok'}

    chat_id = message.get('chat', {}).get('id')
    text = message.get('text', '').strip()

    if not chat_id or not text:
        return {'statusCode': 200, 'headers': CORS, 'body': 'ok'}

    if not is_admin(chat_id):
        tg_send(token, chat_id, '⛔ Нет доступа.')
        return {'statusCode': 200, 'headers': CORS, 'body': 'ok'}

    conn = get_db()
    cur = conn.cursor()

    # /start — приветствие
    if text == '/start':
        tg_send(token, chat_id,
            '🎰 <b>LuckySlots Admin Bot</b>\n\n'
            'Команды:\n'
            '/players — список всех игроков\n'
            '/add [id] [сумма] — начислить баланс\n'
            '/balance [id] — баланс игрока\n'
            '/withdrawals — заявки на вывод\n\n'
            'Пример: /add 1 500'
        )
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': 'ok'}

    # /players — список игроков
    if text == '/players':
        cur.execute(
            f"SELECT id, nickname, balance FROM {SCHEMA}.users ORDER BY id DESC LIMIT 20"
        )
        rows = cur.fetchall()
        conn.close()
        if not rows:
            tg_send(token, chat_id, 'Игроков пока нет.')
            return {'statusCode': 200, 'headers': CORS, 'body': 'ok'}
        lines = ['👥 <b>Игроки:</b>\n']
        for row in rows:
            lines.append(f'ID {row[0]} | {row[1] or "—"} | <b>{float(row[2]):.0f} ₽</b>')
        tg_send(token, chat_id, '\n'.join(lines))
        return {'statusCode': 200, 'headers': CORS, 'body': 'ok'}

    # /balance [id]
    if text.startswith('/balance'):
        parts = text.split()
        if len(parts) != 2 or not parts[1].isdigit():
            tg_send(token, chat_id, 'Использование: /balance [id]\nПример: /balance 1')
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': 'ok'}
        user_id = int(parts[1])
        cur.execute(f"SELECT id, nickname, balance FROM {SCHEMA}.users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        conn.close()
        if not row:
            tg_send(token, chat_id, f'❌ Игрок с ID {user_id} не найден.')
        else:
            tg_send(token, chat_id, f'👤 <b>{row[1] or "Без имени"}</b> (ID {row[0]})\n💰 Баланс: <b>{float(row[2]):.0f} ₽</b>')
        return {'statusCode': 200, 'headers': CORS, 'body': 'ok'}

    # /add [id] [сумма]
    if text.startswith('/add'):
        parts = text.split()
        if len(parts) != 3:
            tg_send(token, chat_id, 'Использование: /add [id] [сумма]\nПример: /add 1 500')
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': 'ok'}
        try:
            user_id = int(parts[1])
            amount = float(parts[2])
            if amount <= 0:
                raise ValueError()
        except ValueError:
            tg_send(token, chat_id, '❌ Неверный формат. Пример: /add 1 500')
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': 'ok'}

        cur.execute(f"SELECT id, nickname, balance FROM {SCHEMA}.users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        if not row:
            tg_send(token, chat_id, f'❌ Игрок с ID {user_id} не найден.')
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': 'ok'}

        cur.execute(
            f"UPDATE {SCHEMA}.users SET balance = balance + %s WHERE id = %s RETURNING balance",
            (amount, user_id)
        )
        new_balance = float(cur.fetchone()[0])
        conn.commit()
        conn.close()

        tg_send(token, chat_id,
            f'✅ <b>Начислено {amount:.0f} ₽</b>\n'
            f'👤 Игрок: {row[1] or "Без имени"} (ID {user_id})\n'
            f'💰 Новый баланс: <b>{new_balance:.0f} ₽</b>'
        )
        return {'statusCode': 200, 'headers': CORS, 'body': 'ok'}

    # /withdrawals — заявки на вывод
    if text == '/withdrawals':
        cur.execute(
            f"SELECT w.id, u.nickname, w.amount, w.bank, w.phone, w.status, w.created_at "
            f"FROM {SCHEMA}.withdrawal_requests w "
            f"JOIN {SCHEMA}.users u ON u.id = w.user_id "
            f"ORDER BY w.created_at DESC LIMIT 10"
        )
        rows = cur.fetchall()
        conn.close()
        if not rows:
            tg_send(token, chat_id, 'Заявок на вывод нет.')
            return {'statusCode': 200, 'headers': CORS, 'body': 'ok'}
        lines = ['📋 <b>Заявки на вывод:</b>\n']
        for row in rows:
            status_icon = '✅' if row[5] == 'done' else '⏳'
            lines.append(
                f'{status_icon} #{row[0]} | {row[1] or "—"} | <b>{float(row[2]):.0f} ₽</b> | {row[3]} | {row[4]}'
            )
        tg_send(token, chat_id, '\n'.join(lines))
        return {'statusCode': 200, 'headers': CORS, 'body': 'ok'}

    tg_send(token, chat_id, 'Неизвестная команда. Напишите /start для списка команд.')
    conn.close()
    return {'statusCode': 200, 'headers': CORS, 'body': 'ok'}
