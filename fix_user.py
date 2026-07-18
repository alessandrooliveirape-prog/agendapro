import json
import urllib.request
import urllib.parse

SUPABASE_URL = "https://tezwamjdetiigwigvayt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlendhbWpkZXRpaWd3aWd2YXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTYxMDIsImV4cCI6MjA5OTUzMjEwMn0.AJ_xFlk4MmEiC1ECoNLz9-3PkoKqOmJvb2dS2zBYWDE"

# Buscar usuário
params = urllib.parse.urlencode({'select': 'id,email,password_hash', 'email': 'eq.ze@barbearia.com'})
req = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/users?{params}',
    headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}
)
resp = urllib.request.urlopen(req)
users = json.loads(resp.read())
for u in users:
    print(f"Email: {u['email']}")
    print(f"Password hash: {u['password_hash']}")

# Atualizar senha para texto plano
print("\nAtualizando senha para '123456'...")
update_data = json.dumps({"password_hash": "123456"}).encode('utf-8')
req2 = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/users?email=eq.ze@barbearia.com',
    data=update_data,
    headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    },
    method='PATCH'
)
try:
    resp2 = urllib.request.urlopen(req2)
    print("✅ Senha atualizada!")
except Exception as e:
    print(f"❌ Erro: {e}")

# Verificar novamente
req3 = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/users?{params}',
    headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}
)
resp3 = urllib.request.urlopen(req3)
users2 = json.loads(resp3.read())
for u in users2:
    print(f"\nNovo hash: {u['password_hash']}")
