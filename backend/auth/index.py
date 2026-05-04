"""Авторизация через Google OAuth"""
import json
import os
import secrets
import psycopg2
from urllib.request import urlopen

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p55733046_creative_sphere_proj')

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def verify_google_token(token: str) -> dict:
    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
    with urlopen(url) as resp:
        return json.loads(resp.read())

def handler(event: dict, context) -> dict:
    headers = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS'}

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')

    if action == 'google_login':
        token = body.get('token')
        info = verify_google_token(token)

        google_id = info['sub']
        email = info['email']
        name = info.get('name', '')
        avatar = info.get('picture', '')

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (google_id, email, name, avatar) VALUES (%s, %s, %s, %s) ON CONFLICT (google_id) DO UPDATE SET name=EXCLUDED.name, avatar=EXCLUDED.avatar RETURNING id, email, name, avatar",
            (google_id, email, name, avatar)
        )
        user = cur.fetchone()
        user_id = user[0]

        session_id = secrets.token_hex(32)
        cur.execute(
            f"INSERT INTO {SCHEMA}.sessions (id, user_id) VALUES (%s, %s)",
            (session_id, user_id)
        )
        conn.commit()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {**headers, 'X-Set-Cookie': f'session={session_id}; Path=/; HttpOnly; Max-Age=2592000'},
            'body': json.dumps({'ok': True, 'user': {'id': user_id, 'email': user[1], 'name': user[2], 'avatar': user[3]}, 'session': session_id})
        }

    if action == 'me':
        cookie = event.get('headers', {}).get('X-Cookie', '')
        session_id = None
        for part in cookie.split(';'):
            part = part.strip()
            if part.startswith('session='):
                session_id = part[8:]
        
        token_header = event.get('headers', {}).get('X-Authorization', '')
        if not session_id and token_header.startswith('Bearer '):
            session_id = token_header[7:]

        if not session_id:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'ok': False})}

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"SELECT u.id, u.email, u.name, u.avatar FROM {SCHEMA}.users u JOIN {SCHEMA}.sessions s ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()",
            (session_id,)
        )
        row = cur.fetchone()
        conn.close()

        if not row:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'ok': False})}

        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True, 'user': {'id': row[0], 'email': row[1], 'name': row[2], 'avatar': row[3]}})}

    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'unknown action'})}
