import json
import urllib.request

# Testar no Vercel
VERCEL = "https://backend-five-gamma-27.vercel.app"

login_data = json.dumps({
    "email": "ze@barbearia.com",
    "password": "123456"
}).encode('utf-8')

req = urllib.request.Request(
    f'{VERCEL}/api/auth/login',
    data=login_data,
    headers={'Content-Type': 'application/json'}
)

try:
    resp = urllib.request.urlopen(req)
    result = json.loads(resp.read())
    print("✅ Login OK no Vercel!")
    print(f"User: {result.get('user', {}).get('name', 'N/A')}")
except urllib.error.HTTPError as e:
    error = e.read().decode()
    print(f"❌ Login falhou: {e.code}")
    print(error)
except Exception as e:
    print(f"❌ Erro: {e}")

# Testar no Render
RENDER = "https://agendapro-backend-w1fp.onrender.com"

req2 = urllib.request.Request(
    f'{RENDER}/api/auth/login',
    data=login_data,
    headers={'Content-Type': 'application/json'}
)

try:
    resp2 = urllib.request.urlopen(req2)
    result2 = json.loads(resp2.read())
    print("\n✅ Login OK no Render!")
except urllib.error.HTTPError as e:
    error2 = e.read().decode()
    print(f"\n❌ Login falhou no Render: {e.code}")
    print(error2)
