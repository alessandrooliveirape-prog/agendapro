import json
import urllib.request
import urllib.parse
import subprocess
import sys

# Gerar hash bcrypt da senha 123456
result = subprocess.run(
    ['node', '-e', "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('123456', 10))"],
    capture_output=True, text=True,
    cwd='/tmp'
)

# Instalar bcryptjs no /tmp se necessário
subprocess.run(['npm', 'init', '-y'], cwd='/tmp', capture_output=True)
subprocess.run(['npm', 'install', 'bcryptjs'], cwd='/tmp', capture_output=True)

result = subprocess.run(
    ['node', '-e', "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('123456', 10))"],
    capture_output=True, text=True,
    cwd='/tmp'
)

password_hash = result.stdout.strip()
print(f"Hash gerado: {password_hash}")

# Atualizar no Supabase
SUPABASE_URL = "https://tezwamjdetiigwigvayt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlendhbWpkZXRpaWd3aWd2YXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTYxMDIsImV4cCI6MjA5OTUzMjEwMn0.AJ_xFlk4MmEiC1ECoNLz9-3PkoKqOmJvb2dS2zBYWDE"

update_data = json.dumps({"password_hash": password_hash}).encode('utf-8')
req = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/users?email=eq.ze@barbearia.com',
    data=update_data,
    headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    },
    method='PATCH'
)

try:
    resp = urllib.request.urlopen(req)
    print("✅ Senha atualizada com hash bcrypt!")
    print(resp.read().decode())
except Exception as e:
    print(f"❌ Erro: {e}")

# Testar login no Render
BACKEND = "https://agendapro-backend-w1fp.onrender.com"
login_data = json.dumps({"email": "ze@barbearia.com", "password": "123456"}).encode('utf-8')
req2 = urllib.request.Request(
    f'{BACKEND}/api/auth/login',
    data=login_data,
    headers={'Content-Type': 'application/json'}
)

try:
    resp2 = urllib.request.urlopen(req2)
    result2 = json.loads(resp2.read())
    print("\n✅ LOGIN FUNCIONANDO NO RENDER!")
    print(f"User: {result2.get('user', {}).get('name', 'N/A')}")
    print(f"Business: {result2.get('business', {}).get('name', 'N/A')}")
except urllib.error.HTTPError as e:
    print(f"\n❌ Login falhou: {e.code}")
    print(e.read().decode())
