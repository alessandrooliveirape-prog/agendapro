import { Router } from 'express';
import bcrypt from 'bcryptjs';
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

    // Mock mode: aceita senha direta ou bcrypt
    const isMock = !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('seu-projeto');
    let validPassword = false;

    if (isMock) {
      // Mock: compara senha direta
      validPassword = password === user.password_hash;
    } else {
      // Produção: bcrypt compare
      validPassword = await bcrypt.compare(password, user.password_hash);
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

export { router as authRoutes };
