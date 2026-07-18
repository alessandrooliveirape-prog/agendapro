import json
import urllib.request

BACKEND = "https://backend-five-gamma-27.vercel.app"

users = [
    {"email": "ze@barbearia.com", "password": "123456"},
    {"email": "alessandroalves@outlook.com", "password": "123456"},
]

for u in users:
    print(f"\n=== {u['email']} ===")
    try:
        login = json.dumps(u).encode()
        r = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/auth/login', login, {'Content-Type': 'application/json'}))
        result = json.loads(r.read())
        token = result['token']
        print(f"Business: {result.get('business', {}).get('name', 'N/A')}")

        r2 = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/subscriptions/current', headers={'Authorization': f'Bearer {token}'}))
        sub = json.loads(r2.read())
        print(f"Plano: {sub.get('plan_name')} (trial: {sub.get('is_trial')}, dias: {sub.get('days_left')})")
    except urllib.error.HTTPError as e:
        print(f"Erro: {e.code}: {e.read().decode()}")
    except Exception as e:
        print(f"Erro: {e}")
