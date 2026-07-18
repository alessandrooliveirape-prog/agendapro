import json
import urllib.request
import urllib.parse

SUPABASE_URL = "https://tezwamjdetiigwigvayt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlendhbWpkZXRpaWd3aWd2YXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTYxMDIsImV4cCI6MjA5OTUzMjEwMn0.AJ_xFlk4MmEiC1ECoNLz9-3PkoKqOmJvb2dS2zBYWDE"

params = urllib.parse.urlencode({
    'select': 'id,email,password_hash',
    'email': 'eq.ze@barbearia.com'
})

req = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/users?{params}',
    headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}'
    }
)

resp = urllib.request.urlopen(req)
users = json.loads(resp.read())

print("=== Status do Usuário ===")
for u in users:
    print(f"Email: {u['email']}")
    print(f"Password hash: '{u['password_hash']}'")
    print(f"Tamanho: {len(u['password_hash'])}")
    print(f"É '123456'? {u['password_hash'] == '123456'}")
    print(f"Começa com $2a (bcrypt)? {u['password_hash'].startswith('$2a')}")
