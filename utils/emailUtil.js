// utils/emailUtil.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envia um email.
 * @param {string} to - Endereço do destinatário.
 * @param {string} subject - Assunto do email.
 * @param {string} text - Texto simples do email.
 * @param {string} [html] - Conteúdo em HTML do email.
 * @param {Array} [attachments] - Array de anexos, cada objeto contendo { filename, path, contentType }.
 */
exports.sendEmail = async (to, subject, text, html = null, attachments = []) => {
  try {
    const mailOptions = {
      from: `"Seu Restaurante" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments, // Anexos opcionais
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email enviado para ${to} com assunto "${subject}"`);
  } catch (error) {
    console.error(`Erro ao enviar email para ${to}:`, error);
    throw error;
  }
};
