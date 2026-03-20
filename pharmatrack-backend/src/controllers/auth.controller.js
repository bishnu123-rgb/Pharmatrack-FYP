const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { logActivity } = require("../utils/logger");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../services/email.service");

// Temporary store for pending registrations

const pendingRegistrations = new Map();

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { user_id: user.user_id, role: user.role_name },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { user_id: user.user_id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  try {
    const { username, password, full_name, email, role_name } = req.body;

    if (!username || !password || !email || !full_name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Strict Gmail Validation
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      return res.status(403).json({ message: "Only @gmail.com addresses are permitted for registration." });
    }

    // Role restriction
    if (role_name === 'admin' || role_name === 'ADMIN') {
      return res.status(403).json({ message: "Admin registration is restricted" });
    }

    // Check if user exists in DB
    const userExist = await pool.query(
      "SELECT * FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: "Username or Email already exists" });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store pending data
    pendingRegistrations.set(email, {
      username,
      password,
      full_name,
      email,
      role_name: role_name || 'staff',
      code: verificationCode,
      expires: Date.now() + 600000 // 10 minutes
    });

    // Send Real Email if configured
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await sendVerificationEmail(email, verificationCode);
      }
    } catch (mailErr) {
      console.error("MAIL SEND ERROR:", mailErr);
      // Even if mail fails, we return success so user can see the dev console if needed
      // but in real app we'd error out.
    }

    res.status(200).json({
      message: "Verification code sent to your Gmail.",
      requiresVerification: true,
      debug_code: verificationCode // For FYP demo visibility
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const pending = pendingRegistrations.get(email);

    if (!pending) {
      return res.status(400).json({ message: "No pending registration found for this email." });
    }

    if (pending.code !== code) {
      return res.status(400).json({ message: "Invalid verification code." });
    }

    if (Date.now() > pending.expires) {
      pendingRegistrations.delete(email);
      return res.status(400).json({ message: "Verification code expired." });
    }

    // Code is valid! Create the user in DB
    const { username, password, full_name, role_name } = pending;

    // Get role_id
    const roleResult = await pool.query("SELECT role_id FROM roles WHERE role_name = $1", [role_name]);
    const roleId = roleResult.rows[0]?.role_id || 2; // Default to staff

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, email, role_id, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING user_id, username, full_name, email`,
      [username, passwordHash, full_name, email, roleId]
    );

    // Clear pending
    pendingRegistrations.delete(email);

    res.status(201).json({
      message: "Email verified and account created successfully",
      user: newUser.rows[0]
    });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    const pending = pendingRegistrations.get(email);

    if (!pending) {
      return res.status(400).json({ message: "No pending registration found for this email." });
    }

    // Generate new code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    pending.code = newCode;
    pending.expires = Date.now() + 600000; // Reset expiry

    // Resend Email
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await sendVerificationEmail(email, newCode);
      }
    } catch (mailErr) {
      console.error("RESEND MAIL ERROR:", mailErr);
    }

    res.status(200).json({
      message: "New verification code sent.",
      debug_code: newCode
    });

  } catch (err) {
    console.error("RESEND ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const query = `
      SELECT 
        u.user_id, u.username, u.password_hash, u.full_name, u.email, u.status,
        r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE LOWER(u.username) = LOWER($1) OR LOWER(u.email) = LOWER($1)
    `;

    const result = await pool.query(query, [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({ message: "Account is inactive. Please contact admin." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Update last login and refresh token
    await pool.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP, refresh_token = $1 WHERE user_id = $2",
      [refreshToken, user.user_id]
    );

    await logActivity(user.user_id, "LOGIN", `User ${user.username} logged in`);

    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        role: user.role_name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    const result = await pool.query(
      `SELECT u.user_id, r.role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id 
       WHERE u.user_id = $1 AND u.refresh_token = $2`,
      [decoded.user_id, refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const user = result.rows[0];
    const tokens = generateTokens(user);

    await pool.query("UPDATE users SET refresh_token = $1 WHERE user_id = $2", [tokens.refreshToken, user.user_id]);

    res.status(200).json(tokens);

  } catch (err) {
    res.status(403).json({ message: "Token expired or invalid" });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const userResult = await pool.query("SELECT user_id, username FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (userResult.rows.length === 0) {
      // For security, don't reveal if email exists or not
      return res.status(200).json({ message: "If an account exists with this email, you will receive a reset link." });
    }

    const user = userResult.rows[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour from now

    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE user_id = $3",
      [resetToken, expiry, user.user_id]
    );

    await logActivity(user.user_id, "AUTH", `Password reset requested for ${user.username}`);

    // Send Reset Email
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        console.log(`📡 ATTEMPTING TO SEND RESET EMAIL TO: ${email}`);
        await sendPasswordResetEmail(email, resetToken);
        console.log(`✅ RESET EMAIL DISPATCHED TO: ${email}`);
      }
    } catch (mailErr) {
      console.error("RESET MAIL ERROR:", mailErr);
    }

    res.status(200).json({
      message: "If an account exists with this email, you will receive a reset link."
    });

  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    const userResult = await pool.query(
      "SELECT user_id, username FROM users WHERE reset_token = $1 AND reset_token_expiry > CURRENT_TIMESTAMP",
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const user = userResult.rows[0];

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update password and clear token
    await pool.query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = $2",
      [passwordHash, user.user_id]
    );

    await logActivity(user.user_id, "AUTH", `Password successfully reset for ${user.username}`);

    res.status(200).json({ message: "Password has been reset successfully. You can now login." });

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

