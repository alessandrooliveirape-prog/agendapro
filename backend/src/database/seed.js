import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database.js';

async function seed() {
  console.log('🌱 Populando banco com dados de teste...\n');

  const businessId = uuidv4();
  const userId = uuidv4();

  // Criar negócio
  const { error: businessError } = await supabase
    .from('businesses')
    .insert({
      id: businessId,
      name: 'Barbearia do Zé',
      slug: 'barbearia-do-ze',
      owner_email: 'ze@barbearia.com',
      phone: '(11) 99999-9999',
      address: 'Rua das Flores, 123 - São Paulo, SP',
      description: 'A melhor barbearia da região',
      subscription_plan: 'pro',
      whatsapp_enabled: true,
    });

  if (businessError) {
    console.log('⚠️ Negócio pode já existir:', businessError.message);
  } else {
    console.log('✅ Negócio criado: Barbearia do Zé');
  }

  // Criar usuário
  const passwordHash = await bcrypt.hash('123456', 10);
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: userId,
      business_id: businessId,
      name: 'José da Silva',
      email: 'ze@barbearia.com',
      password_hash: passwordHash,
      role: 'owner',
    });

  if (userError) {
    console.log('⚠️ Usuário pode já existir:', userError.message);
  } else {
    console.log('✅ Usuário criado: José da Silva');
  }

  // Criar serviços
  const services = [
    { name: 'Corte masculino', duration_minutes: 30, price: 45, color: '#6366f1' },
    { name: 'Barba', duration_minutes: 20, price: 30, color: '#8b5cf6' },
    { name: 'Corte + Barba', duration_minutes: 45, price: 65, color: '#a855f7' },
    { name: 'Degradê', duration_minutes: 40, price: 55, color: '#ec4899' },
    { name: 'Corte social', duration_minutes: 25, price: 40, color: '#14b8a6' },
  ];

  for (const service of services) {
    const { error } = await supabase
      .from('services')
      .insert({ business_id: businessId, ...service });
    if (error) console.log(`⚠️ Serviço ${service.name}:`, error.message);
  }
  console.log('✅ Serviços criados');

  // Criar profissional
  const { error: profError } = await supabase
    .from('professionals')
    .insert({
      business_id: businessId,
      user_id: userId,
      name: 'Zé',
      email: 'ze@barbearia.com',
      phone: '(11) 99999-9999',
    });

  if (profError) {
    console.log('⚠️ Profissional pode já existir:', profError.message);
  } else {
    console.log('✅ Profissional criado: Zé');
  }

  console.log('\n🎉 Dados de teste criados!');
  console.log('\n📋 Credenciais de login:');
  console.log('   Email: ze@barbearia.com');
  console.log('   Senha: 123456');
  console.log('\n🔗 Link público: http://localhost:3000/api/public/barbearia-do-ze');
}

seed();
