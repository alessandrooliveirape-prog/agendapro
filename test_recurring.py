import json
import urllib.request

BACKEND = "https://backend-five-gamma-27.vercel.app"

# Login
login = json.dumps({"email": "ze@barbearia.com", "password": "123456"}).encode()
r = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/auth/login', login, {'Content-Type': 'application/json'}))
token = json.loads(r.read())['token']
print("Login OK")

# Buscar serviço
r2 = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/services', headers={'Authorization': f'Bearer {token}'}))
svcs = json.loads(r2.read())
print(f"Serviços: {len(svcs)}")

# Criar recorrência
data = json.dumps({
    "service_id": svcs[0]['id'],
    "client_name": "Teste Recorrente",
    "client_phone": "558198372170",
    "start_date": "2026-07-25",
    "time": "10:00",
    "frequency": "weekly",
    "occurrences": 4,
    "notes": "Teste recorrência"
}).encode()

try:
    r3 = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/recurring', data, {'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}))
    print("OK:", json.loads(r3.read()))
except urllib.error.HTTPError as e:
    print(f"Erro {e.code}:", e.read().decode())
