import json
import urllib.request

BACKEND = "https://agendapro-backend-w1fp.onrender.com"

# Login com alessandro
login_data = json.dumps({"email": "alessandroalves@outlook.com", "password": "123456"}).encode('utf-8')
req = urllib.request.Request(f'{BACKEND}/api/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
try:
    resp = urllib.request.urlopen(req)
    result = json.loads(resp.read())
    token = result['token']
    business = result.get('business', {})
    print(f"Login OK: {result['user']['name']}")
    print(f"Negócio: {business.get('name', 'N/A')} (id: {business.get('id', 'N/A')})")

    # Buscar serviços
    req2 = urllib.request.Request(f'{BACKEND}/api/services', headers={'Authorization': f'Bearer {token}'})
    resp2 = urllib.request.urlopen(req2)
    services = json.loads(resp2.read())
    print(f"\nServiços: {len(services)} encontrados")
    for s in services:
        print(f"  {s['name']} - R${s['price']}")
except urllib.error.HTTPError as e:
    print(f"Erro: {e.code}: {e.read().decode()}")

# Login com ze
print("\n---")
login_data2 = json.dumps({"email": "ze@barbearia.com", "password": "123456"}).encode('utf-8')
req3 = urllib.request.Request(f'{BACKEND}/api/auth/login', data=login_data2, headers={'Content-Type': 'application/json'})
try:
    resp3 = urllib.request.urlopen(req3)
    result3 = json.loads(resp3.read())
    token3 = result3['token']
    print(f"Login OK: {result3['user']['name']}")
    print(f"Negócio: {result3.get('business', {}).get('name', 'N/A')}")

    req4 = urllib.request.Request(f'{BACKEND}/api/services', headers={'Authorization': f'Bearer {token3}'})
    resp4 = urllib.request.urlopen(req4)
    services3 = json.loads(resp4.read())
    print(f"Serviços: {len(services3)} encontrados")
    for s in services3:
        print(f"  {s['name']} - R${s['price']}")
except urllib.error.HTTPError as e:
    print(f"Erro: {e.code}: {e.read().decode()}")
