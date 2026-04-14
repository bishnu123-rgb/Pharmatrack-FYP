const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { logActivity } = require("../utils/logger");
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require("../services/email.service");

// Temporary in-memory store for pending (unverified) registrations.
// Keyed by lowercase email. Cleared after successful verification or expiry.
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

    const lowerEmail = email.toLowerCase();
    const lowerUsername = username.toLowerCase();

    if (!lowerEmail.endsWith("@gmail.com")) {
      return res.status(403).json({ message: "Only @gmail.com addresses are permitted for registration." });
    }

    if (role_name === 'admin' || role_name === 'ADMIN') {
      return res.status(403).json({ message: "Admin registration is restricted" });
    }

    const userExist = await pool.query(
      "SELECT * FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2",
      [lowerUsername, lowerEmail]
    );

    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: "Username or Email already exists." });
    }

    const pending = pendingRegistrations.get(lowerEmail);
    if (pending && pending.expires > Date.now()) {
      return res.status(400).json({ message: "Registration already in progress. Please check your email for the code." });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // SECURITY: Hash password BEFORE storing in temporary memory
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    pendingRegistrations.set(lowerEmail, {
      username,
      passwordHash,
      full_name,
      email: lowerEmail,
      role_name: role_name || 'staff',
      code: verificationCode,
      expires: Date.now() + 600000, // 10-minute window
      isPending: role_name === 'pharmacist'
    });

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await sendVerificationEmail(lowerEmail, verificationCode);
      }
    } catch (mailErr) {
      console.error("MAIL SEND ERROR:", mailErr);
    }

    res.status(200).json({
      message: "Verification code sent to your Gmail.",
      requiresVerification: true
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const lowerEmail = email.toLowerCase();
    const pending = pendingRegistrations.get(lowerEmail);

    if (!pending) {
      return res.status(400).json({ message: "No pending registration found for this email." });
    }

    if (pending.code !== code) {
      return res.status(400).json({ message: "Invalid verification code." });
    }

    if (Date.now() > pending.expires) {
      pendingRegistrations.delete(lowerEmail);
      return res.status(400).json({ message: "Verification code expired." });
    }

    const { username, passwordHash, full_name, role_name, isPending } = pending;

    // Resolve role_id (default to staff if not found)
    const roleResult = await pool.query("SELECT role_id FROM roles WHERE role_name = $1", [role_name]);
    const roleId = roleResult.rows[0]?.role_id || 2;

    // Pharmacists require admin approval before they can log in
    const initialStatus = isPending ? 'pending' : 'active';

    const newUser = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, email, role_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, username, full_name, email`,
      [username, passwordHash, full_name, lowerEmail, roleId, initialStatus]
    );

    pendingRegistrations.delete(lowerEmail);

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await sendWelcomeEmail(lowerEmail, full_name);
      }
    } catch (mailErr) {
      console.error("WELCOME MAIL ERROR:", mailErr);
    }

    const isPendingApproval = initialStatus === 'pending';
    res.status(201).json({
      message: isPendingApproval
        ? "Account created. Your Pharmacist role is pending administrator approval before you can log in."
        : "Email verified and account created successfully.",
      requiresApproval: isPendingApproval,
      user: newUser.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    const lowerEmail = email.toLowerCase();
    const pending = pendingRegistrations.get(lowerEmail);

    if (!pending) {
      return res.status(400).json({ message: "No pending registration found for this email." });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    pending.code = newCode;
    pending.expires = Date.now() + 600000;

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await sendVerificationEmail(lowerEmail, newCode);
      }
    } catch (mailErr) {
      console.error("RESEND MAIL ERROR:", mailErr);
    }

    res.status(200).json({
      message: "New verification code sent."
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const result = await pool.query(
      `SELECT u.user_id, u.username, u.password_hash, u.full_name, u.email, u.status, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE LOWER(u.username) = LOWER($1) OR LOWER(u.email) = LOWER($1)`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    if (user.status === 'pending') {
      return res.status(403).json({ message: "Your account is pending administrator approval. Please check back later." });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: "Account is inactive. Please contact your system administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(user);

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

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await sendPasswordResetEmail(email, resetToken);
      }
    } catch (mailErr) {
      console.error("RESET MAIL ERROR:", mailErr);
    }

    res.status(200).json({
      message: "If an account exists with this email, you will receive a reset link."
    });

  } catch (err) {
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

    // 1. Check against historical passwords (last 10)
    const historyResult = await pool.query(
      "SELECT password_hash FROM password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10",
      [user.user_id]
    );

    for (const record of historyResult.rows) {
      const isOldMatch = await bcrypt.compare(password, record.password_hash);
      if (isOldMatch) {
        return res.status(400).json({ message: "You have used this password recently. For security, please choose a different one." });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Archive current password, then update and clear reset token
    const currentPassResult = await pool.query("SELECT password_hash FROM users WHERE user_id = $1", [user.user_id]);
    const currentHash = currentPassResult.rows[0].password_hash;

    await pool.query(
      "INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)",
      [user.user_id, currentHash]
    );

    await pool.query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = $2",
      [passwordHash, user.user_id]
    );

    await logActivity(user.user_id, "AUTH", `Password successfully reset for ${user.username}`);

    res.status(200).json({ message: "Password has been reset successfully. You can now login." });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

