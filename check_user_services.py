import json
import urllib.request

BACKEND = "https://backend-five-gamma-27.vercel.app"

# Login
login = json.dumps({"email": "alessandroalves@outlook.com", "password": "123456"}).encode()
r = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/auth/login', login, {'Content-Type': 'application/json'}))
result = json.loads(r.read())
token = result['token']
print(f"Login: {result['user']['name']}")
print(f"Business: {result.get('business', {}).get('name', 'N/A')} (id: {result.get('business', {}).get('id', 'N/A')})")

# Buscar serviços
r2 = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/services', headers={'Authorization': f'Bearer {token}'}))
svcs = json.loads(r2.read())
print(f"\nServiços: {len(svcs)}")
for s in svcs:
    print(f"  {s['name']} - R${s['price']}")
