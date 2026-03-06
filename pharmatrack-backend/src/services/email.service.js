const nodemailer = require("nodemailer");

/**
 * Professional Email Service for PharmaTrack
 * Configured for Gmail SMTP with App Passwords.
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ MAIL SERVER ERROR:", error.message);
  } else {
    console.log("✅ MAIL SERVER READY (Gmail SMTP)");
  }
});


exports.sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: `"PharmaTrack Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your PharmaTrack Account",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 24px;">
        <h2 style="color: #4f46e5; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Welcome to PharmaTrack</h2>
        <p style="color: #475569; font-size: 16px;">Please use the verification code below to complete your registration:</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 10px; color: #1e293b;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 12px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
          <p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">PharmaTrack — Pharmacy Management Portal</p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

exports.sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;

  const mailOptions = {
    from: `"PharmaTrack Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your PharmaTrack Password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 24px;">
        <h2 style="color: #4f46e5; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 16px;">We received a request to reset your password. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #4f46e5; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password Now</a>
        </div>
        <p style="color: #64748b; font-size: 12px;">This link will expire in 1 hour. If you did not request this, your password will remain unchanged.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
          <p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">PharmaTrack — Clinical Data Protection</p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
