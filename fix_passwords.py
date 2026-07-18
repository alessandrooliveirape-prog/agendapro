import json
import urllib.request
import subprocess

# Gerar hash bcrypt
subprocess.run(['npm', 'init', '-y'], cwd='/tmp', capture_output=True)
subprocess.run(['npm', 'install', 'bcryptjs'], cwd='/tmp', capture_output=True)
result = subprocess.run(
    ['node', '-e', "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('123456', 10))"],
    capture_output=True, text=True, cwd='/tmp'
)
password_hash = result.stdout.strip()

# Atualizar senha no Supabase
SUPABASE_URL = "https://tezwamjdetiigwigvayt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlendhbWpkZXRpaWd3aWd2YXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTYxMDIsImV4cCI6MjA5OTUzMjEwMn0.AJ_xFlk4MmEiC1ECoNLz9-3PkoKqOmJvb2dS2zBYWDE"

import urllib.parse
params = urllib.parse.urlencode({'select': 'id,email', 'email': 'eq.alessandroalves@outlook.com'})
req = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/users?{params}',
    headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}
)
resp = urllib.request.urlopen(req)
users = json.loads(resp.read())

if users:
    user_id = users[0]['id']
    update_data = json.dumps({"password_hash": password_hash}).encode('utf-8')
    req2 = urllib.request.Request(
        f'{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}',
        data=update_data,
        headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        method='PATCH'
    )
    urllib.request.urlopen(req2)
    print(f"✅ Senha de {users[0]['email']} atualizada para '123456'")

# Testar login
BACKEND = "https://agendapro-backend-w1fp.onrender.com"
login_data = json.dumps({"email": "alessandroalves@outlook.com", "password": "123456"}).encode('utf-8')
req3 = urllib.request.Request(f'{BACKEND}/api/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
try:
    resp3 = urllib.request.urlopen(req3)
    result = json.loads(resp3.read())
    print(f"\n✅ Login OK!")
    print(f"User: {result['user']['name']}")
    print(f"Business: {result.get('business', {}).get('name', 'N/A')}")
    
    # Ver serviços
    token = result['token']
    req4 = urllib.request.Request(f'{BACKEND}/api/services', headers={'Authorization': f'Bearer {token}'})
    resp4 = urllib.request.urlopen(req4)
    services = json.loads(resp4.read())
    print(f"\nServiços: {len(services)} encontrados")
    for s in services:
        print(f"  {s['name']} - R${s['price']}")
except urllib.error.HTTPError as e:
    print(f"❌ Login falhou: {e.code}: {e.read().decode()}")
