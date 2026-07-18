import json
import urllib.request

data = json.dumps({
    "number": "558198372170",
    "text": "Teste AgendaPro - WhatsApp funcionando!"
}).encode('utf-8')

req = urllib.request.Request(
    'http://localhost:8443/message/sendText/agendapro',
    data=data,
    headers={
        'Content-Type': 'application/json',
        'apikey': 'agendapro2026'
    }
)
response = urllib.request.urlopen(req)
result = json.loads(response.read())
print(json.dumps(result, indent=2))
