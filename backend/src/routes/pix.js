import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Gerar QR Code PIX
router.post('/qrcode', async (req, res) => {
  try {
    const { amount, description } = z.object({
      amount: z.number().positive(),
      description: z.string().optional(),
    }).parse(req.body);

    // Buscar chave PIX do negócio autenticado
    const { data: business } = await supabase
      .from('businesses')
      .select('payment_settings')
      .eq('id', req.businessId)
      .single();

    const pixKey = business?.payment_settings?.pix_key;

    if (!pixKey) {
      return res.status(400).json({ error: 'Chave PIX não configurada. Configure em Configurações > Pagamentos.' });
    }

    const pixPayload = {
      key: pixKey,
      amount,
      description: description || 'AgendaPro',
      merchant_name: 'AgendaPro',
      merchant_city: 'Sao Paulo',
    };

    res.json({
      success: true,
      pix_key: pixKey,
      amount,
      description: description || 'AgendaPro',
      payload: pixPayload,
      message: `Chave PIX: ${pixKey}\nValor: R$${amount}\nDescrição: ${description || 'AgendaPro'}`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Gerar imagem QR Code
router.get('/qrcode-image', async (req, res) => {
  try {
    const { amount, description } = req.query;

    const { data: business } = await supabase
      .from('businesses')
      .select('payment_settings')
      .eq('id', req.businessId)
      .single();

    const pixKey = business?.payment_settings?.pix_key;

    if (!pixKey) {
      return res.status(400).json({ error: 'Chave PIX não configurada.' });
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=pix:${pixKey}?amount=${amount || 0}`;

    res.json({
      success: true,
      qr_code_url: qrUrl,
      pix_key: pixKey,
      amount: parseFloat(amount) || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as pixRoutes };
