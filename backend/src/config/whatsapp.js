const whatsappConfig = {
  apiUrl: process.env.WHATSAPP_API_URL,
  instanceId: process.env.WHATSAPP_INSTANCE_ID,
  token: process.env.WHATSAPP_TOKEN,
};

export async function sendWhatsAppMessage(phone, message) {
  if (!whatsappConfig.apiUrl || !whatsappConfig.token) {
    console.log('⚠️ WhatsApp não configurado. Mensagem não enviada.');
    console.log(`📱 Para: ${phone}`);
    console.log(`💬 Mensagem: ${message}`);
    return { sent: false, reason: 'not_configured' };
  }

  try {
    const response = await fetch(
      `${whatsappConfig.apiUrl}/instance/${whatsappConfig.instanceId}/send-text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${whatsappConfig.token}`,
        },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ''),
          message,
        }),
      }
    );

    const data = await response.json();
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
