import json
import urllib.request
from datetime import datetime, timedelta

# Calcular data de amanhã
amanha = datetime.now() + timedelta(days=1)
data = amanha.strftime('%Y-%m-%d')

# Dados do agendamento
agendamento = {
    "service_id": "corte-masculino",  # Vamos buscar o ID correto
    "client_name": "Maria Silva",
    "client_phone": "558198372170",
    "date": data,
    "time": "14:00"
}

# Primeiro, buscar os serviços disponíveis
req = urllib.request.Request(
    'http://localhost:8443/instance/fetchInstances',
    headers={'apikey': 'agendapro2026'}
)
response = urllib.request.urlopen(req)
instances = json.loads(response.read())
print("Instâncias:", json.dumps([{'name': i['name'], 'status': i['connectionStatus']} for i in instances], indent=2))

# Buscar serviços no backend do Render
req2 = urllib.request.Request(
    'https://agendapro-backend-w1fp.onrender.com/api/public/barbearia-do-ze',
    headers={'Content-Type': 'application/json'}
)
try:
    response2 = urllib.request.urlopen(req2)
    business_data = json.loads(response2.read())
    print("\nServiços disponíveis:")
    for svc in business_data.get('services', []):
        print(f"  - {svc['id']}: {svc['name']} - R${svc['price']}")
except Exception as e:
    print(f"Erro ao buscar serviços: {e}")

print(f"\nData do agendamento: {data}")
print(f"Horário: 14:00")
print(f"Cliente: Maria Silva")
print(f"Telefone: 558198372170")
