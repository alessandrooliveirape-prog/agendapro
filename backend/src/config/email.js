import nodemailer from 'nodemailer';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to, subject, html) {
  if (!process.env.SMTP_USER) {
    console.log('⚠️ Email não configurado.');
    console.log(`📧 Para: ${to}`);
    console.log(`📝 Assunto: ${subject}`);
    return { sent: false, reason: 'not_configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"AgendaPro" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erro ao enviar email:', error.message);
    return { sent: false, error: error.message };
  }
}

export function passwordResetEmail(email, resetUrl) {
  return {
    to: email,
    subject: 'AgendaPro — Redefinir sua senha',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Redefinir Senha</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Olá,</p>
          <p>Você solicitou a redefinição da sua senha no AgendaPro.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #6366f1, #a855f7); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Redefinir Minha Senha
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Se você não solicitou esta redefinição, ignore este email.</p>
          <p style="color: #6b7280; font-size: 14px;">Este link expira em 1 hora.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>AgendaPro — Sistema de Agendamento</p>
        </div>
      </div>
    `,
  };
}

export function appointmentReminderEmail(appointment) {
  const { client_name, client_email, service_name, date, time, business_name } = appointment;
  return {
    to: client_email,
    subject: `Lembrete: Seu agendamento amanhã - ${escapeHtml(business_name)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Lembrete de Agendamento</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Olá <strong>${escapeHtml(client_name)}</strong>,</p>
          <p>Você tem um agendamento amanhã:</p>
          <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #6366f1;">
            <p style="margin: 5px 0;"><strong>Serviço:</strong> ${escapeHtml(service_name)}</p>
            <p style="margin: 5px 0;"><strong>Data:</strong> ${escapeHtml(date)}</p>
            <p style="margin: 5px 0;"><strong>Horário:</strong> ${escapeHtml(time)}</p>
            <p style="margin: 5px 0;"><strong>Local:</strong> ${escapeHtml(business_name)}</p>
          </div>
          <p style="margin-top: 20px;">Para cancelar ou reagendar, entre em contato conosco.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>AgendaPro — Sistema de Agendamento</p>
        </div>
      </div>
    `,
  };
}
