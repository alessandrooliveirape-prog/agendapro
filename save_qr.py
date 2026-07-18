import json
import base64
import urllib.request

req = urllib.request.Request(
    'http://localhost:8443/instance/connect/agendapro',
    headers={'apikey': 'agendapro2026'}
)
response = urllib.request.urlopen(req)
data = json.loads(response.read())
img_data = base64.b64decode(data['base64'].split(',')[1])
with open('/tmp/qrcode.png', 'wb') as f:
    f.write(img_data)
print('QR Code saved to /tmp/qrcode.png')
