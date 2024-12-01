// utils/emailUtil.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Ou o host do seu provedor de email
  port: 587,
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.EMAIL_USER, // Seu email
    pass: process.env.EMAIL_PASS, // Sua senha ou app password
  },
});

exports.sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: `"Seu Nome ou Empresa" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
};
