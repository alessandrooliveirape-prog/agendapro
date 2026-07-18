import json
import base64
import urllib.request
import time

# Connect to instance
req = urllib.request.Request(
    'http://localhost:8443/instance/connect/agendapro',
    headers={'apikey': 'agendapro2026'}
)
response = urllib.request.urlopen(req)
data = json.loads(response.read())

# Save QR code as image
if 'base64' in data:
    img_data = base64.b64decode(data['base64'].split(',')[1])
    with open('/tmp/qrcode.png', 'wb') as f:
        f.write(img_data)
    print('QR Code saved to /tmp/qrcode.png')
    print('Scan this QR code with your WhatsApp!')
else:
    print('No QR code in response')
    print(json.dumps(data, indent=2))
