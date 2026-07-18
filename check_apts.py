import json
import urllib.request

BACKEND = "https://backend-five-gamma-27.vercel.app"

login = json.dumps({"email": "alessandroalves@outlook.com", "password": "123456"}).encode()
r = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/auth/login', login, {'Content-Type': 'application/json'}))
token = json.loads(r.read())['token']

r2 = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/appointments?date=2026-07-20', headers={'Authorization': f'Bearer {token}'}))
apts = json.loads(r2.read())
print(f"Agendamentos em 20/07: {len(apts)}")
for a in apts:
    print(f"  {a['time']} - {a['client_name']} ({a['service_name']})")
