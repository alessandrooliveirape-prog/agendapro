import json
import urllib.request
import time

BACKEND = "https://agendapro-backend-w1fp.onrender.com"

reg_data = json.dumps({
    "business_name": "Barbearia Teste",
    "slug": f"barbearia-teste-{int(time.time())}",
    "name": "Usuario Teste",
    "email": f"teste{int(time.time())}@teste.com",
    "password": "123456"
}).encode('utf-8')

req = urllib.request.Request(
    f'{BACKEND}/api/auth/register',
    data=reg_data,
    headers={'Content-Type': 'application/json'}
)

try:
    resp = urllib.request.urlopen(req)
    result = json.loads(resp.read())
    print("✅ Registro OK!")
    print(json.dumps(result, indent=2, ensure_ascii=False))
except urllib.error.HTTPError as e:
    print(f"❌ Erro: {e.code}")
    print(e.read().decode())
