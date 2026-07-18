import json
import urllib.request

SUPABASE_URL = "https://tezwamjdetiigwigvayt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlendhbWpkZXRpaWd3aWd2YXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTYxMDIsImV4cCI6MjA5OTUzMjEwMn0.AJ_xFlk4MmEiC1ECoNLz9-3PkoKqOmJvb2dS2zBYWDE"

# Buscar todos os usuários
import urllib.parse
params = urllib.parse.urlencode({'select': 'id,email,name,business_id'})
req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/users?{params}', headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'})
resp = urllib.request.urlopen(req)
users = json.loads(resp.read())

print("=== Usuários ===")
for u in users:
    print(f"  {u['email']} ({u['name']}) - business: {u['business_id']}")

# Buscar todos os negócios
params2 = urllib.parse.urlencode({'select': 'id,name,slug'})
req2 = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/businesses?{params2}', headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'})
resp2 = urllib.request.urlopen(req2)
biz = json.loads(resp2.read())

print("\n=== Negócios ===")
for b in biz:
    print(f"  {b['name']} (id: {b['id']})")

# Buscar serviços por negócio
print("\n=== Serviços por negócio ===")
for b in biz:
    params3 = urllib.parse.urlencode({'select': 'id,name,business_id', 'business_id': f'eq.{b["id"]}'})
    req3 = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/services?{params3}', headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'})
    resp3 = urllib.request.urlopen(req3)
    svcs = json.loads(resp3.read())
    print(f"\n  {b['name']}: {len(svcs)} serviços")
    for s in svcs:
        print(f"    - {s['name']}")
