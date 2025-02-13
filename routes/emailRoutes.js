// src/routes/emailRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');
const { sendEmail } = require('../utils/emailUtil');

// Middleware para autenticação, se necessário
// const authenticate = require('../middlewares/authenticate');

router.post('/send-invoice-email', /* authenticate, */ async (req, res) => {
  const { email, pdfPath } = req.body;

  if (!email || !pdfPath) {
    return res.status(400).json({ message: 'Email e pdfPath são obrigatórios.' });
  }

  try {
    const fullPdfPath = path.join(__dirname, '..', 'public', pdfPath); // Ajuste o caminho conforme necessário

    // Verifique se o arquivo existe
    const fs = require('fs');
    if (!fs.existsSync(fullPdfPath)) {
      return res.status(404).json({ message: 'Arquivo PDF não encontrado.' });
    }

    // Enviar email
    await sendEmail(
      email,
      'Finalização da Mesa',
      'Segue em anexo a finalização da sua mesa.',
      `<p>Olá,</p><p>Segue em anexo a finalização da sua mesa.</p>`,
      [
        {
          filename: path.basename(fullPdfPath),
          path: fullPdfPath,
          contentType: 'application/pdf',
        },
      ]
    );

    res.status(200).json({ message: 'Email enviado com sucesso.' });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500).json({ message: 'Erro ao enviar email.' });
  }
});

module.exports = router;
