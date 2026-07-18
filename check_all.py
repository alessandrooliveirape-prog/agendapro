import json
import urllib.request

BACKEND = "https://agendapro-backend-w1fp.onrender.com"

# 1. Health
print("1. Health:")
try:
    r = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/health'))
    print(f"   OK: {json.loads(r.read())}")
except Exception as e:
    print(f"   ERRO: {e}")

# 2. Login
print("\n2. Login:")
login = json.dumps({"email": "ze@barbearia.com", "password": "123456"}).encode()
try:
    r = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/auth/login', login, {'Content-Type': 'application/json'}))
    res = json.loads(r.read())
    token = res['token']
    print(f"   OK: {res['user']['name']}")
except urllib.error.HTTPError as e:
    print(f"   ERRO {e.code}: {e.read().decode()}")
    token = None

# 3. Services
if token:
    print("\n3. Serviços:")
    try:
        r = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/services', headers={'Authorization': f'Bearer {token}'}))
        svcs = json.loads(r.read())
        print(f"   OK: {len(svcs)} serviços")
        for s in svcs:
            print(f"   - {s['name']} (id: {s['id']})")
    except urllib.error.HTTPError as e:
        print(f"   ERRO {e.code}: {e.read().decode()}")

    # 4. Criar agendamento
    print("\n4. Criar agendamento:")
    if svcs:
        apt = json.dumps({
            "service_id": svcs[0]['id'],
            "client_name": "Teste Observação",
            "client_phone": "558198372170",
            "date": "2026-07-20",
            "time": "10:00",
            "notes": "Teste de observação - cliente quer corte específico"
        }).encode()
        try:
            r = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/appointments', apt, {'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}))
            res2 = json.loads(r.read())
            print(f"   OK: Agendamento criado - {res2.get('client_name', 'N/A')}")
            print(f"   Notes: {res2.get('notes', 'N/A')}")
        except urllib.error.HTTPError as e:
            print(f"   ERRO {e.code}: {e.read().decode()}")
