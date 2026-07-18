import json
import urllib.request

BACKEND = "https://backend-five-gamma-27.vercel.app"

# Login
login = json.dumps({"email": "ze@barbearia.com", "password": "123456"}).encode()
r = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/auth/login', login, {'Content-Type': 'application/json'}))
token = json.loads(r.read())['token']
print("Login OK")

# Testar checkout
checkout = json.dumps({"plan": "pro"}).encode()
try:
    r2 = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/subscriptions/checkout', checkout, {'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}))
    result = json.loads(r2.read())
    print("Checkout:")
    print(json.dumps(result, indent=2, ensure_ascii=False))
except urllib.error.HTTPError as e:
    print(f"Erro: {e.code}: {e.read().decode()}")
