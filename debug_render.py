import json
import urllib.request

# Testar se o Render consegue acessar o Supabase
BACKEND = "https://agendapro-backend-w1fp.onrender.com"

# Testar health
print("1. Health check:")
req = urllib.request.Request(f'{BACKEND}/api/health')
resp = urllib.request.urlopen(req)
print(f"   {json.loads(resp.read())}")

# Testar com dados incorretos para ver se o erro muda
print("\n2. Login com email inexistente:")
login1 = json.dumps({"email": "naoexiste@test.com", "password": "123456"}).encode()
req1 = urllib.request.Request(f'{BACKEND}/api/auth/login', data=login1, headers={'Content-Type': 'application/json'})
try:
    resp1 = urllib.request.urlopen(req1)
except urllib.error.HTTPError as e:
    print(f"   {e.read().decode()}")

# Testar com email correto
print("\n3. Login com email correto:")
login2 = json.dumps({"email": "ze@barbearia.com", "password": "123456"}).encode()
req2 = urllib.request.Request(f'{BACKEND}/api/auth/login', data=login2, headers={'Content-Type': 'application/json'})
try:
    resp2 = urllib.request.urlopen(req2)
    print(f"   ✅ {json.loads(resp2.read())}")
except urllib.error.HTTPError as e:
    print(f"   ❌ {e.code}: {e.read().decode()}")

# Testar com senha errada
print("\n4. Login com senha errada:")
login3 = json.dumps({"email": "ze@barbearia.com", "password": "errada"}).encode()
req3 = urllib.request.Request(f'{BACKEND}/api/auth/login', data=login3, headers={'Content-Type': 'application/json'})
try:
    resp3 = urllib.request.urlopen(req3)
except urllib.error.HTTPError as e:
    print(f"   {e.read().decode()}")
