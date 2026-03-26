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

exports.sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: `"PharmaTrack Welcome" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to PharmaTrack — Account Verified!",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #4f46e5; width: 64px; height: 64px; line-height: 64px; border-radius: 20px; display: inline-block; color: white; font-size: 32px; font-weight: bold;">P</div>
        </div>
        <h1 style="color: #0f172a; font-size: 28px; font-weight: 800; text-align: center; margin-bottom: 10px; tracking-tight">Welcome to the Team, ${name}!</h1>
        <p style="color: #475569; font-size: 16px; text-align: center; line-height: 1.6; margin-bottom: 30px;">Your PharmaTrack account has been successfully verified. You now have full access to our clinical inventory management suite.</p>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 24px; margin-bottom: 30px;">
          <h3 style="color: #1e293b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">Next Steps</h3>
          <ul style="color: #475569; font-size: 14px; padding-left: 20px; line-height: 2;">
            <li>Explore the <b>Live Inventory</b> dashboard</li>
            <li>Configure your <b>Batch Alerts</b> for low stock</li>
            <li>Review the <b>Audit Logs</b> for transparency</li>
          </ul>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #4f46e5; color: white; padding: 16px 32px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); display: inline-block;">Launch Dashboard</a>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">&copy; 2024 PharmaTrack POS Inc.</p>
            <p style="font-size: 10px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Clinical Inventory Precision</p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
