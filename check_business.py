import json
import urllib.request
import urllib.parse

SUPABASE_URL = "https://tezwamjdetiigwigvayt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlendhbWpkZXRpaWd3aWd2YXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTYxMDIsImV4cCI6MjA5OTUzMjEwMn0.AJ_xFlk4MmEiC1ECoNLz9-3PkoKqOmJvb2dS2zBYWDE"

params = urllib.parse.urlencode({'select': '*', 'slug': 'eq.bearbearia-do-ze'})
req = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/businesses?{params}',
    headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}
)
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())

if data:
    biz = data[0]
    print(f"Negócio: {biz.get('name')}")
    print(f"Colunas: {list(biz.keys())}")
    print(f"subscription_plan: {biz.get('subscription_plan', 'NÃO EXISTE')}")
    print(f"created_at: {biz.get('created_at')}")
else:
    print("Negócio não encontrado")

# Listar todos os negócios
params2 = urllib.parse.urlencode({'select': 'id,name,slug,subscription_plan'})
req2 = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/businesses?{params2}',
    headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}
)
resp2 = urllib.request.urlopen(req2)
biz_list = json.loads(resp2.read())
print("\nTodos os negócios:")
for b in biz_list:
    print(f"  {b['name']} (slug: {b['slug']}, plan: {b.get('subscription_plan', 'N/A')})")
