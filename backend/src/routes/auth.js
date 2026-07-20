import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabase } from '../config/database.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

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
router.post('/register', authLimiter, async (req, res) => {
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
router.post('/login', authLimiter, async (req, res) => {
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

    const validPassword = await bcrypt.compare(password, user.password_hash);

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

// Login com Google
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { credential, email, name, avatar_url } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Credencial do Google obrigatória' });
    }

    // Verificar token com Google
    let verifiedEmail, verifiedName;
    try {
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!googleRes.ok) {
        return res.status(401).json({ error: 'Credencial do Google inválida' });
      }
      const googleData = await googleRes.json();
      verifiedEmail = googleData.email;
      verifiedName = googleData.name || name;
      if (!verifiedEmail) {
        return res.status(401).json({ error: 'Email não verificado pelo Google' });
      }
    } catch {
      return res.status(401).json({ error: 'Falha ao verificar credencial com Google' });
    }

    const finalEmail = verifiedEmail;
    const finalName = verifiedName || name;

    // Verificar se o usuário já existe
    let { data: user } = await supabase
      .from('users')
      .select('*, businesses(id, name, slug, subscription_plan)')
      .eq('email', finalEmail)
      .single();

    if (!user) {
      // Criar novo usuário e negócio
      const businessId = crypto.randomUUID();
      const userId = crypto.randomUUID();
      const slug = finalEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');

      // Criar negócio
      await supabase
        .from('businesses')
        .insert({
          id: businessId,
          name: finalName || 'Meu Negócio',
          slug: slug + '-' + Date.now(),
          owner_email: finalEmail,
        });

      // Criar usuário
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          business_id: businessId,
          name: finalName,
          email: finalEmail,
          password_hash: 'google_oauth',
          role: 'owner',
          avatar_url: avatar_url,
        });

      if (userError) throw userError;

      // Buscar dados do negócio
      const { data: business } = await supabase
        .from('businesses')
        .select('id, name, slug, subscription_plan')
        .eq('id', businessId)
        .single();

      const token = generateToken(userId, businessId);

      return res.json({
        token,
        user: { id: userId, name: finalName, email: finalEmail, role: 'owner' },
        business,
        isNewUser: true,
      });
    }

    // Usuário já existe - fazer login
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
      isNewUser: false,
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
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (!user) {
      return res.json({ message: 'Se o email existir, instruções foram enviadas.' });
    }

    const resetToken = jwt.sign(
      { userId: user.id, type: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const frontendUrl = process.env.FRONTEND_URL || 'https://frontend-one-beta-vnz0jybrfj.vercel.app';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const { sendEmail, passwordResetEmail } = await import('../config/email.js');
    const emailContent = passwordResetEmail(email, resetUrl);
    await sendEmail(email, emailContent.subject, emailContent.html);

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

    const passwordHash = await bcrypt.hash(new_password, 10);

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
    const { current_password, new_password } = z.object({
      current_password: z.string().min(1),
      new_password: z.string().min(6),
    }).parse(req.body);

    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.userId)
      .single();

    const validPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    const passwordHash = await bcrypt.hash(new_password, 10);

    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', req.userId);

    if (error) throw error;

    res.json({ message: 'Senha alterada com sucesso!' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

export { router as authRoutes };
