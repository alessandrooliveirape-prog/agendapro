import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabase } from '../config/database.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  business_name: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Registro
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    // Verificar se slug já existe
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', data.slug)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Esse link já está em uso' });
    }

    // Criar negócio
    const businessId = crypto.randomUUID();
    const { error: businessError } = await supabase
      .from('businesses')
      .insert({
        id: businessId,
        name: data.business_name,
        slug: data.slug,
        owner_email: data.email,
        phone: data.phone,
      });

    if (businessError) throw businessError;

    // Criar usuário
    const passwordHash = await bcrypt.hash(data.password, 10);
    const userId = crypto.randomUUID();
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        business_id: businessId,
        name: data.name,
        email: data.email,
        password_hash: passwordHash,
        role: 'owner',
      });

    if (userError) throw userError;

    const token = generateToken(userId, businessId);

    res.status(201).json({
      message: 'Conta criada com sucesso!',
      token,
      business: { id: businessId, name: data.business_name, slug: data.slug },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const { data: user, error } = await supabase
      .from('users')
      .select('*, businesses(id, name, slug, subscription_plan)')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Verificar senha (bcrypt ou texto plano)
    let validPassword = false;

    try {
      // Tentar bcrypt primeiro
      validPassword = await bcrypt.compare(password, user.password_hash);
    } catch (e) {
      // Se não for bcrypt, comparar como texto plano
      validPassword = password === user.password_hash;
    }

    // Fallback: comparar como texto plano
    if (!validPassword) {
      validPassword = password === user.password_hash;
    }

    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const token = generateToken(user.id, user.business_id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      business: user.businesses,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Verificar token
router.get('/me', authenticate, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, businesses(id, name, slug, subscription_plan)')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ user: { ...user, business: user.businesses } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Solicitar redefinição de senha
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Verificar se o email existe
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (!user) {
      // Por segurança, sempre retorna sucesso
      return res.json({ message: 'Se o email existir, instruções foram enviadas.' });
    }

    // Gerar token de redefinição (válido por 1 hora)
    const resetToken = jwt.sign(
      { userId: user.id, type: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Gerar link de redefinição
    const frontendUrl = process.env.FRONTEND_URL || 'https://frontend-one-beta-vnz0jybrfj.vercel.app';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Enviar email
    const { sendEmail, passwordResetEmail } = await import('../config/email.js');
    const emailContent = passwordResetEmail(email, resetUrl);
    await sendEmail(email, emailContent.subject, emailContent.html);

    console.log(`Email de redefinição enviado para ${email}`);
    console.log(`Link: ${resetUrl}`);

    res.json({ message: 'Se o email existir, instruções foram enviadas.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Redefinir senha com token
router.post('/reset-password/confirm', async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'reset') {
      return res.status(400).json({ error: 'Token inválido' });
    }

    // Hash da nova senha
    const passwordHash = await bcrypt.hash(new_password, 10);

    // Atualizar senha
    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', decoded.userId);

    if (error) throw error;

    res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Token expirado. Solicite uma nova redefinição.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Alterar senha (usuário logado)
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    // Buscar usuário
    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.userId)
      .single();

    // Verificar senha atual
    const validPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Hash da nova senha
    const passwordHash = await bcrypt.hash(new_password, 10);

    // Atualizar senha
    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', req.userId);

    if (error) throw error;

    res.json({ message: 'Senha alterada com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as authRoutes };
