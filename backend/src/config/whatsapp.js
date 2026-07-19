const whatsappConfig = {
  apiUrl: process.env.WHATSAPP_API_URL,
  instanceId: process.env.WHATSAPP_INSTANCE_ID,
  apiKey: process.env.WHATSAPP_API_KEY,
};

export async function sendWhatsAppMessage(phone, message) {
  if (!whatsappConfig.apiUrl || !whatsappConfig.apiKey) {
    console.log('WhatsApp não configurado. Mensagem nao enviada.');
    console.log(`Para: ${phone}`);
    console.log(`Mensagem: ${message}`);
    return { sent: false, reason: 'not_configured' };
  }

  try {
    const phoneClean = phone.replace(/\D/g, '');

    const response = await fetch(
      `${whatsappConfig.apiUrl}/message/sendText/${whatsappConfig.instanceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': whatsappConfig.apiKey,
        },
        body: JSON.stringify({
          number: phoneClean,
          text: message,
        }),
      }
    );

    const data = await response.json();
    console.log(`WhatsApp enviado para ${phone}: ${data.key?.id || 'ok'}`);
    return { sent: true, data };
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error.message);
    return { sent: false, error: error.message };
  }
}

export function formatAppointmentReminder(appointment) {
  const { client_name, service_name, date, time } = appointment;
  return `Olá ${client_name}! 👋\n\nLembrete: Você tem um agendamento amanhã.\n\n📋 *${service_name}*\n📅 ${date}\n🕐 ${time}\n\nPara cancelar ou reagendar, acesse seu link de agendamento.`;
}

export function formatConfirmation(appointment) {
  const { client_name, service_name, date, time, business_name } = appointment;
  return `✅ *Agendamento Confirmado!*\n\nOlá ${client_name}!\n\nSeu agendamento no *${business_name}* foi confirmado:\n\n📋 ${service_name}\n📅 ${date}\n🕐 ${time}\n\nAmanhã temos você! 😊`;
}
