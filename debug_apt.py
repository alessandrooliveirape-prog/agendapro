import json
import urllib.request

BACKEND = "https://backend-five-gamma-27.vercel.app"

# Login
login = json.dumps({"email": "alessandroalves@outlook.com", "password": "123456"}).encode()
r = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/auth/login', login, {'Content-Type': 'application/json'}))
token = json.loads(r.read())['token']
print("Login OK")

# Tentar criar agendamento
apt = json.dumps({
    "service_id": "7c8808f5-bf95-4d24-af48-8367d6b30b28",
    "client_name": "Teste",
    "client_phone": "81999999999",
    "date": "2026-07-21",
    "time": "10:00",
    "notes": "teste"
}).encode()

try:
    r2 = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/appointments', apt, {'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}))
    print("OK:", json.loads(r2.read()))
except urllib.error.HTTPError as e:
    print(f"Erro {e.code}:", e.read().decode())
