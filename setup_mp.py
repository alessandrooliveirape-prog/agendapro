import json
import urllib.request
import urllib.parse

SUPABASE_URL = "https://tezwamjdetiigwigvayt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlendhbWpkZXRpaWd3aWd2YXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTYxMDIsImV4cCI6MjA5OTUzMjEwMn0.AJ_xFlk4MmEiC1ECoNLz9-3PkoKqOmJvb2dS2zBYWDE"

MP_TOKEN = "APP_USR-2577042149465603-071816-25d455b46352b70b18e92fe1991f5cd3-129037183"
MP_PUBLIC = "APP_USR-dfc29839-dc05-4e4b-9a23-102d816d497c"

# Buscar todos os negócios
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
            "pix_key": "03330821418",
            "pix_type": "cpf",
            "mercadopago_access_token": MP_TOKEN,
            "mercadopago_public_key": MP_PUBLIC
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
        print(f"✅ {biz['name']}: Mercado Pago + PIX configurados")
    except Exception as e:
        print(f"❌ {biz['name']}: {e}")
