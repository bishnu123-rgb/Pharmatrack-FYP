const jwt = require("jsonwebtoken");
const pool = require("../config/db");

async function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if account is still active in database
    const userResult = await pool.query("SELECT status FROM users WHERE user_id = $1", [decoded.user_id]);

    if (userResult.rows.length === 0 || userResult.rows[0].status !== 'active') {
      return res.status(403).json({ message: "Account locked or deactivated. Please contact administrator." });
    }

    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/**
 * Middleware to restrict access based on roles
 * @param {string[]} roles
 */
function authorize(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    next();
  };
}

module.exports = { auth, authorize };
