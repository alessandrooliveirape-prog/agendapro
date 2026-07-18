import json
import urllib.request
import urllib.parse

SUPABASE_URL = "https://tezwamjdetiigwigvayt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlendhbWpkZXRpaWd3aWd2YXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTYxMDIsImV4cCI6MjA5OTUzMjEwMn0.AJ_xFlk4MmEiC1ECoNLz9-3PkoKqOmJvb2dS2zBYWDE"

PIX_KEY = "03330821418"

# Atualizar payment_settings para todos os negócios
params = urllib.parse.urlencode({'select': 'id,name'})
req = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/businesses?{params}',
    headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}
)
resp = urllib.request.urlopen(req)
businesses = json.loads(resp.read())

for biz in businesses:
    update_data = json.dumps({
        "payment_settings": {
            "pix_key": PIX_KEY,
            "pix_type": "cpf"
        }
    }).encode('utf-8')

    req2 = urllib.request.Request(
        f'{SUPABASE_URL}/rest/v1/businesses?id=eq.{biz["id"]}',
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
        urllib.request.urlopen(req2)
        print(f"✅ {biz['name']}: PIX configurado ({PIX_KEY})")
    except Exception as e:
        print(f"❌ {biz['name']}: {e}")
