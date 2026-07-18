import json
import urllib.request

BACKEND = "https://agendapro-backend-w1fp.onrender.com"

# Testar login
login_data = json.dumps({
    "email": "ze@barbearia.com",
    "password": "123456"
}).encode('utf-8')

req = urllib.request.Request(
    f'{BACKEND}/api/auth/login',
    data=login_data,
    headers={'Content-Type': 'application/json'}
)

try:
    resp = urllib.request.urlopen(req)
    result = json.loads(resp.read())
    print("✅ LOGIN FUNCIONANDO!")
    print(f"Token: {result.get('token', 'N/A')[:50]}...")
    print(f"User: {result.get('user', {}).get('name', 'N/A')}")
    print(f"Business: {result.get('business', {}).get('name', 'N/A')}")
except urllib.error.HTTPError as e:
    error = e.read().decode()
    print(f"❌ Login falhou: {e.code}")
    print(error)
except Exception as e:
    print(f"❌ Erro: {e}")
