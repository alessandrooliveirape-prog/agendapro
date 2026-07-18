import json
import urllib.request

SUPABASE_URL = "https://tezwamjdetiigwigvayt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlendhbWpkZXRpaWd3aWd2YXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTYxMDIsImV4cCI6MjA5OTUzMjEwMn0.AJ_xFlk4MmEiC1ECoNLz9-3PkoKqOmJvb2dS2zBYWDE"

req = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/users?select=id,email,password_hash&email=ze@barbearia.com',
    headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}
)
resp = urllib.request.urlopen(req)
users = json.loads(resp.read())
for u in users:
    print(f"Email: {u['email']}")
    print(f"Password hash: {u['password_hash']}")
    print(f"Hash starts with $2a: {u['password_hash'].startswith('$2a')}")
    print(f"Hash starts with $2b: {u['password_hash'].startswith('$2b')}")
