import json
import urllib.request

SUPABASE_URL = "https://tezwamjdetiigwigvayt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlendhbWpkZXRpaWd3aWd2YXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTYxMDIsImV4cCI6MjA5OTUzMjEwMn0.AJ_xFlk4MmEiC1ECoNLz9-3PkoKqOmJvb2dS2zBYWDE"

# Adicionar coluna payment_settings
data = json.dumps({"query": 'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS payment_settings JSONB DEFAULT \'{}\'::jsonb'}).encode('utf-8')

req = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/rpc/exec_sql',
    data=data,
    headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
)

try:
    resp = urllib.request.urlopen(req)
    print("OK:", resp.read().decode())
except Exception as e:
    print("Erro:", e)
