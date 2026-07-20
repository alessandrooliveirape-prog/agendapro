import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import QRCode from 'qrcode';

const router = Router();
router.use(authenticate);

// CRC16 CCITT for PIX BRCode
function crc16Ccitt(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function generatePixBRCode(key, amount, merchantName, merchantCity, txid) {
  const pad = (id, value) => `${id}${String(value.length).padStart(2, '0')}${value}`;

  const payload = [
    pad('00', '01'),
    pad('26', [
      pad('00', 'br.gov.bcb.pix'),
      pad('01', key),
      pad('02', txid || '***'),
    ].join('')),
    pad('52', '0000'),
    pad('53', '986'),
    amount > 0 ? pad('54', amount.toFixed(2)) : '',
    pad('58', 'BR'),
    pad('59', merchantName.substring(0, 25)),
    pad('60', merchantCity.substring(0, 15)),
    pad('62', pad('05', '***')),
  ].filter(Boolean).join('');

  const withoutCrc = payload + '6304';
  const crc = crc16Ccitt(withoutCrc);
  return withoutCrc + crc;
}

// Gerar QR Code PIX
router.post('/qrcode', async (req, res) => {
  try {
    const { amount, description } = z.object({
      amount: z.number().positive(),
      description: z.string().optional(),
    }).parse(req.body);

    // Buscar configurações do negócio
    const { data: business } = await supabase
      .from('businesses')
      .select('payment_settings, name')
      .eq('id', req.businessId)
      .single();

    const pixKey = business?.payment_settings?.pix_key;
    const pixMerchantName = business?.payment_settings?.pix_merchant_name || business?.name || 'AgendaPro';
    const pixMerchantCity = business?.payment_settings?.pix_merchant_city || 'Sao Paulo';

    if (!pixKey) {
      return res.status(400).json({ error: 'Chave PIX não configurada. Configure em Configurações > Pagamentos.' });
    }

    const txid = crypto.randomUUID().substring(0, 32);
    const brCode = generatePixBRCode(pixKey, amount, pixMerchantName, pixMerchantCity, txid);

    res.json({
      success: true,
      pix_key: pixKey,
      amount,
      description: description || 'AgendaPro',
      br_code: brCode,
      txid,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Gerar imagem QR Code (local)
router.get('/qrcode-image', async (req, res) => {
  try {
    const { amount, description } = req.query;

    const { data: business } = await supabase
      .from('businesses')
      .select('payment_settings, name')
      .eq('id', req.businessId)
      .single();

    const pixKey = business?.payment_settings?.pix_key;
    const pixMerchantName = business?.payment_settings?.pix_merchant_name || business?.name || 'AgendaPro';
    const pixMerchantCity = business?.payment_settings?.pix_merchant_city || 'Sao Paulo';

    if (!pixKey) {
      return res.status(400).json({ error: 'Chave PIX não configurada.' });
    }

    const txid = crypto.randomUUID().substring(0, 32);
    const brCode = generatePixBRCode(pixKey, parseFloat(amount) || 0, pixMerchantName, pixMerchantCity, txid);

    const qrDataUrl = await QRCode.toDataURL(brCode, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    res.json({
      success: true,
      qr_code_url: qrDataUrl,
      br_code: brCode,
      pix_key: pixKey,
      amount: parseFloat(amount) || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as pixRoutes };
