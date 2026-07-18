import json
import urllib.request

BACKEND = "https://backend-five-gamma-27.vercel.app"

# Login
login = json.dumps({"email": "ze@barbearia.com", "password": "123456"}).encode()
r = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/auth/login', login, {'Content-Type': 'application/json'}))
result = json.loads(r.read())
token = result['token']
print(f"Login OK: {result['user']['name']}")
print(f"Business ID: {result.get('business', {}).get('id', 'N/A')}")

# Testar subscription
try:
    r2 = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/subscriptions/current', headers={'Authorization': f'Bearer {token}'}))
    print(f"Subscription: {json.loads(r2.read())}")
except urllib.error.HTTPError as e:
    print(f"Erro: {e.code}: {e.read().decode()}")
