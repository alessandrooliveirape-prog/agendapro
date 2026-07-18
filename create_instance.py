import json
import urllib.request

data = json.dumps({"instanceName": "agendapro", "integration": "WHATSAPP-BAILEYS"}).encode('utf-8')
req = urllib.request.Request(
    'http://localhost:8443/instance/create',
    data=data,
    headers={
        'Content-Type': 'application/json',
        'apikey': 'agendapro2026'
    }
)
response = urllib.request.urlopen(req)
result = json.loads(response.read())
print(json.dumps(result, indent=2))
