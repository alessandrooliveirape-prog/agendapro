import json
import urllib.request
from datetime import datetime, timedelta

# Calcular data de amanhã
amanha = datetime.now() + timedelta(days=1)
data = amanha.strftime('%Y-%m-%d')

print(f"Criando agendamento de teste...")
print(f"Data: {data}")
print(f"Horário: 14:00")
print(f"Cliente: Maria Silva")
print(f"Telefone: 558198372170")

# Criar agendamento diretamente no banco via backend
agendamento_data = json.dumps({
    "business_id": "demo-business-id",
    "client_name": "Maria Silva",
    "client_phone": "558198372170",
    "service_name": "Corte masculino",
    "date": data,
    "time": "14:00",
    "end_time": "14:30",
    "price": 45,
    "status": "confirmed"
}).encode('utf-8')

# Tentar criar via API pública (booking)
booking_data = json.dumps({
    "service_id": "corte-masculino",
    "client_name": "Maria Silva",
    "client_phone": "558198372170",
    "date": data,
    "time": "14:00"
}).encode('utf-8')

req = urllib.request.Request(
    'https://agendapro-backend-w1fp.onrender.com/api/public/barbearia-do-ze/book',
    data=booking_data,
    headers={
        'Content-Type': 'application/json'
    }
)

try:
    response = urllib.request.urlopen(req)
    result = json.loads(response.read())
    print("\n✅ Agendamento criado com sucesso!")
    print(json.dumps(result, indent=2, ensure_ascii=False))
except urllib.error.HTTPError as e:
    error_body = e.read().decode()
    print(f"\n❌ Erro: {e.code}")
    print(error_body)
