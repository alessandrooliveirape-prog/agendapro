import json
import urllib.request
import urllib.parse

SUPABASE_URL = "https://tezwamjdetiigwigvayt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlendhbWpkZXRpaWd3aWd2YXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTYxMDIsImV4cCI6MjA5OTUzMjEwMn0.AJ_xFlk4MmEiC1ECoNLz9-3PkoKqOmJvb2dS2zBYWDE"

# Buscar por ID específico
biz_id = "4ebe46b8-723a-48d9-bb19-9b0796e397a0"
params = urllib.parse.urlencode({'select': 'id,name,slug', 'id': f'eq.{biz_id}'})
req = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/businesses?{params}',
    headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}
)
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
print(f"Buscando ID: {biz_id}")
print(f"Resultado: {data}")

# Listar todos com IDs
params2 = urllib.parse.urlencode({'select': 'id,name'})
req2 = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/businesses?{params2}',
    headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}
)
resp2 = urllib.request.urlopen(req2)
all_biz = json.loads(resp2.read())
print("\nTodos os negócios:")
for b in all_biz:
    print(f"  {b['id']} - {b['name']}")
