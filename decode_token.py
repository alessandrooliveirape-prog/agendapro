import json
import base64
import urllib.request

BACKEND = "https://backend-five-gamma-27.vercel.app"

login = json.dumps({"email": "ze@barbearia.com", "password": "123456"}).encode()
r = urllib.request.urlopen(urllib.request.Request(f'{BACKEND}/api/auth/login', login, {'Content-Type': 'application/json'}))
token = json.loads(r.read())['token']

# Decodificar JWT
parts = token.split('.')
payload = json.loads(base64.urlsafe_b64decode(parts[1] + '=='))
print("Token payload:")
print(json.dumps(payload, indent=2))
