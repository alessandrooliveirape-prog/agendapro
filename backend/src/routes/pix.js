import { Router } from 'express';
import { supabase } from '../config/database.js';

const router = Router();

// Gerar QR Code PIX
router.post('/qrcode', async (req, res) => {
  try {
    const { amount, description, business_id } = req.body;

    // Buscar chave PIX do negócio
    let pixKey = '03330821418'; // Chave padrão

    if (business_id) {
      const { data: business } = await supabase
        .from('businesses')
        .select('payment_settings')
        .eq('id', business_id)
        .single();

      if (business?.payment_settings?.pix_key) {
        pixKey = business.payment_settings.pix_key;
      }
    }

    // Gerar payload PIX (simplificado)
    // Em produção, use uma lib como 'pix-qrcode' ou API do banco
    const pixPayload = {
      key: pixKey,
      amount: amount || 0,
      description: description || 'AgendaPro',
      merchant_name: 'AgendaPro',
      merchant_city: 'Sao Paulo',
    };

    // URL de pagamento PIX (formato copia e cola)
    const pixUrl = `pix:${pixKey}?amount=${amount || 0}&description=${encodeURIComponent(description || 'AgendaPro')}`;

    res.json({
      success: true,
      pix_key: pixKey,
      pix_type: 'cpf',
      amount: amount || 0,
      description: description || 'AgendaPro',
      payload: pixPayload,
      message: `Chave PIX: ${pixKey}\nValor: R$${amount || 0}\nDescrição: ${description || 'AgendaPro'}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gerar imagem QR Code (via API pública)
router.get('/qrcode-image', async (req, res) => {
  try {
    const { amount, description, business_id } = req.query;

    let pixKey = '03330821418';

    if (business_id) {
      const { data: business } = await supabase
        .from('businesses')
        .select('payment_settings')
        .eq('id', business_id)
        .single();

      if (business?.payment_settings?.pix_key) {
        pixKey = business.payment_settings.pix_key;
      }
    }

    // Gerar QR Code usando API pública
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=pix:${pixKey}?amount=${amount || 0}`;

    res.json({
      success: true,
      qr_code_url: qrUrl,
      pix_key: pixKey,
      amount: amount || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as pixRoutes };
