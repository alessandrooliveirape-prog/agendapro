import json
import urllib.request
from datetime import datetime, timedelta

# Buscar serviços do Supabase diretamente
SUPABASE_URL = "https://tezwamjdetiigwigvayt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlendhbWpkZXRpaWd3aWd2YXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTYxMDIsImV4cCI6MjA5OTUzMjEwMn0.AJ_xFlk4MmEiC1ECoNLz9-3PkoKqOmJvb2dS2zBYWDE"

# Buscar serviços
req = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/services?select=*',
    headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}'
    }
)
response = urllib.request.urlopen(req)
services = json.loads(response.read())
print("Serviços encontrados:")
for s in services:
    print(f"  ID: {s['id']}")
    print(f"  Nome: {s['name']}")
    print(f"  Preço: R${s['price']}")
    print()

# Buscar business_id
req2 = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/businesses?select=id,name,slug',
    headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}'
    }
)
response2 = urllib.request.urlopen(req2)
businesses = json.loads(response2.read())
print("Negócios encontrados:")
for b in businesses:
    print(f"  ID: {b['id']}")
    print(f"  Nome: {b['name']}")
    print(f"  Slug: {b['slug']}")
    print()

if services and businesses:
    # Criar agendamento
    service = services[0]
    business = businesses[0]
    amanha = datetime.now() + timedelta(days=1)
    data = amanha.strftime('%Y-%m-%d')

    agendamento = {
        "business_id": business['id'],
        "service_id": service['id'],
        "client_name": "Maria Silva",
        "client_phone": "558198372170",
        "client_email": "maria@teste.com",
        "service_name": service['name'],
        "date": data,
        "time": "14:00",
        "end_time": "14:30",
        "price": service['price'],
        "status": "confirmed"
    }

    print("Criando agendamento...")
    print(f"  Negócio: {business['name']}")
    print(f"  Serviço: {service['name']}")
    print(f"  Data: {data}")
    print(f"  Horário: 14:00")
    print(f"  Cliente: Maria Silva")
    print()

    # Inserir no Supabase
    data_bytes = json.dumps(agendamento).encode('utf-8')
    req3 = urllib.request.Request(
        f'{SUPABASE_URL}/rest/v1/appointments',
        data=data_bytes,
        headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    )
    response3 = urllib.request.urlopen(req3)
    result = json.loads(response3.read())
    print("✅ Agendamento criado com sucesso!")
    print(json.dumps(result, indent=2, ensure_ascii=False))

    # Enviar lembrete via WhatsApp
    print("\nEnviando lembrete via WhatsApp...")
    msg = f"Olá {agendamento['client_name']}! Lembrete: Você tem um agendamento amanhã.\n\n📋 {agendamento['service_name']}\n📅 {agendamento['date']}\n🕐 {agendamento['time']}\n\nAté lá! 😊"

    msg_data = json.dumps({
        "number": agendamento['client_phone'],
        "text": msg
    }).encode('utf-8')

    req4 = urllib.request.Request(
        'http://localhost:8443/message/sendText/agendapro',
        data=msg_data,
        headers={
            'Content-Type': 'application/json',
            'apikey': 'agendapro2026'
        }
    )
    response4 = urllib.request.urlopen(req4)
    result4 = json.loads(response4.read())
    print("✅ Mensagem WhatsApp enviada!")
    print(json.dumps(result4, indent=2))
