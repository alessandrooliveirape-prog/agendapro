import json
import urllib.request
import urllib.parse

SUPABASE_URL = "https://tezwamjdetiigwigvayt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlendhbWpkZXRpaWd3aWd2YXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTYxMDIsImV4cCI6MjA5OTUzMjEwMn0.AJ_xFlk4MmEiC1ECoNLz9-3PkoKqOmJvb2dS2zBYWDE"
BACKEND = "https://agendapro-backend-w1fp.onrender.com"

# 1. Verificar serviços no banco
print("=== Serviços no Supabase ===")
req = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/services?select=id,name,business_id,price',
    headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}
)
resp = urllib.request.urlopen(req)
services = json.loads(resp.read())
for s in services:
    print(f"  {s['name']} - R${s['price']} (business: {s['business_id']})")

# 2. Verificar negócios
print("\n=== Negócios ===")
req2 = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/businesses?select=id,name,slug',
    headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}
)
resp2 = urllib.request.urlopen(req2)
biz = json.loads(resp2.read())
for b in biz:
    print(f"  {b['name']} (id: {b['id']}, slug: {b['slug']})")

# 3. Verificar usuários
print("\n=== Usuários ===")
params = urllib.parse.urlencode({'select': 'id,email,business_id,role'})
req3 = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/users?{params}',
    headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}
)
resp3 = urllib.request.urlopen(req3)
users = json.loads(resp3.read())
for u in users:
    print(f"  {u['email']} (business: {u['business_id']}, role: {u['role']})")

# 4. Testar API de serviços com token
print("\n=== Teste API Serviços ===")
login_data = json.dumps({"email": "ze@barbearia.com", "password": "123456"}).encode('utf-8')
req4 = urllib.request.Request(f'{BACKEND}/api/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
resp4 = urllib.request.urlopen(req4)
token = json.loads(resp4.read())['token']

req5 = urllib.request.Request(
    f'{BACKEND}/api/services',
    headers={'Authorization': f'Bearer {token}'}
)
resp5 = urllib.request.urlopen(req5)
api_services = json.loads(resp5.read())
print(f"Serviços via API: {len(api_services)} encontrados")
for s in api_services:
    print(f"  {s['name']} - R${s['price']}")
