import json
import urllib.request

# Testar login
login_data = json.dumps({
    "email": "ze@barbearia.com",
    "password": "123456"
}).encode('utf-8')

req = urllib.request.Request(
    'https://agendapro-backend-w1fp.onrender.com/api/auth/login',
    data=login_data,
    headers={'Content-Type': 'application/json'}
)

try:
    response = urllib.request.urlopen(req)
    result = json.loads(response.read())
    print("✅ Login OK!")
    print(f"Token: {result.get('token', 'N/A')[:50]}...")
except urllib.error.HTTPError as e:
    error = e.read().decode()
    print(f"❌ Login falhou: {e.code}")
    print(error)

# Testar registro
register_data = json.dumps({
    "business_name": "Barbearia Teste",
    "slug": "barbearia-teste-" + str(int(__import__('time').time())),
    "name": "Teste User",
    "email": "teste@teste.com",
    "password": "123456"
}).encode('utf-8')

req2 = urllib.request.Request(
    'https://agendapro-backend-w1fp.onrender.com/api/auth/register',
    data=register_data,
    headers={'Content-Type': 'application/json'}
)

try:
    response2 = urllib.request.urlopen(req2)
    result2 = json.loads(response2.read())
    print("\n✅ Registro OK!")
    print(f"Business: {result2.get('business', {}).get('name', 'N/A')}")
except urllib.error.HTTPError as e:
    error = e.read().decode()
    print(f"\n❌ Registro falhou: {e.code}")
    print(error)
