import json
import urllib.request

BACKEND = "https://agendapro-backend-w1fp.onrender.com"

print("=== DEBUG API ===\n")

# 1. Health check
print("1. Health Check:")
try:
    req = urllib.request.Request(f'{BACKEND}/api/health')
    resp = urllib.request.urlopen(req)
    print(f"   ✅ {json.loads(resp.read())}")
except Exception as e:
    print(f"   ❌ {e}")

# 2. Test login
print("\n2. Teste Login:")
login_data = json.dumps({"email": "ze@barbearia.com", "password": "123456"}).encode('utf-8')
try:
    req = urllib.request.Request(f'{BACKEND}/api/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
    resp = urllib.request.urlopen(req)
    print(f"   ✅ {json.loads(resp.read())}")
except urllib.error.HTTPError as e:
    print(f"   ❌ {e.code}: {e.read().decode()}")
except Exception as e:
    print(f"   ❌ {e}")

# 3. Test register
print("\n3. Teste Registro:")
import time
reg_data = json.dumps({
    "business_name": "Teste Biz",
    "slug": f"teste-{int(time.time())}",
    "name": "Teste User",
    "email": f"teste{int(time.time())}@test.com",
    "password": "123456"
}).encode('utf-8')
try:
    req = urllib.request.Request(f'{BACKEND}/api/auth/register', data=reg_data, headers={'Content-Type': 'application/json'})
    resp = urllib.request.urlopen(req)
    print(f"   ✅ {json.loads(resp.read())}")
except urllib.error.HTTPError as e:
    print(f"   ❌ {e.code}: {e.read().decode()}")
except Exception as e:
    print(f"   ❌ {e}")

# 4. Check user in Supabase
print("\n4. Usuários no Supabase:")
SUPABASE_URL = "https://tezwamjdetiigwigvayt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlendhbWpkZXRpaWd3aWd2YXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTYxMDIsImV4cCI6MjA5OTUzMjEwMn0.AJ_xFlk4MmEiC1ECoNLz9-3PkoKqOmJvb2dS2zBYWDE"
try:
    req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/users?select=id,email,name,role', headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'})
    resp = urllib.request.urlopen(req)
    users = json.loads(resp.read())
    for u in users:
        print(f"   - {u['email']} ({u['name']}) - {u['role']}")
except Exception as e:
    print(f"   ❌ {e}")

# 5. Check businesses
print("\n5. Negócios no Supabase:")
try:
    req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/businesses?select=id,name,slug', headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'})
    resp = urllib.request.urlopen(req)
    biz = json.loads(resp.read())
    for b in biz:
        print(f"   - {b['name']} (/{b['slug']})")
except Exception as e:
    print(f"   ❌ {e}")
