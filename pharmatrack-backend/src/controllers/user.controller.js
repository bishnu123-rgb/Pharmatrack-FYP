const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.getProfile = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT user_id, username, full_name, email, phone, avatar_url, status, last_login, created_at, role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = $1`,
            [req.user.user_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { full_name, email, phone } = req.body;

        if (!full_name || !email) {
            return res.status(400).json({ error: "Name and Email are required." });
        }

        await pool.query(
            `UPDATE users 
             SET full_name = $1, email = $2, phone = $3
             WHERE user_id = $4`,
            [full_name, email, phone, req.user.user_id]
        );
        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image file provided." });
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        await pool.query(
            "UPDATE users SET avatar_url = $1 WHERE user_id = $2",
            [avatarUrl, req.user.user_id]
        );

        res.json({ message: "Avatar updated successfully", avatar_url: avatarUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Ensure password_history table exists (lazy init)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS password_history (
                history_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Get current hash
        const userResult = await pool.query(
            "SELECT password_hash FROM users WHERE user_id = $1",
            [req.user.user_id]
        );

        const currentHash = userResult.rows[0].password_hash;

        // 1. Verify current password
        const isMatch = await bcrypt.compare(currentPassword, currentHash);
        if (!isMatch) {
            return res.status(400).json({ error: "Current password does not match." });
        }

        // 2. Check if new password matches current password
        const isSameAsCurrent = await bcrypt.compare(newPassword, currentHash);
        if (isSameAsCurrent) {
            return res.status(400).json({ error: "Your new password matches your current one. Please choose a different password." });
        }

        // 3. Check against historical passwords (last 10)
        const historyResult = await pool.query(
            "SELECT password_hash FROM password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10",
            [req.user.user_id]
        );

        console.log(`Checking new password against ${historyResult.rows.length} previous hashes...`);
        for (const record of historyResult.rows) {
            const isOldMatch = await bcrypt.compare(newPassword, record.password_hash);
            if (isOldMatch) {
                console.log("CRITICAL: Password reuse detected in history!");
                return res.status(400).json({ error: "You have used this password recently. For security, please choose a different one." });
            }
        }

        console.log("No security violations found. Proceeding with credential rotation.");

        // 4. Update password
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        // Store old password in history before updating
        await pool.query(
            "INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)",
            [req.user.user_id, currentHash]
        );

        await pool.query(
            "UPDATE users SET password_hash = $1 WHERE user_id = $2",
            [newHash, req.user.user_id]
        );

        res.json({ message: "Password changed successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.user_id, u.username, u.full_name, u.email, u.status, r.role_name, u.last_login
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       ORDER BY u.user_id DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, role_id } = req.body;

        const updates = [];
        const params = [];
        let index = 1;

        if (status !== undefined) {
            updates.push(`status = $${index++}`);
            params.push(status);
        }

        if (role_id !== undefined) {
            updates.push(`role_id = $${index++}`);
            params.push(role_id);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }

        params.push(id);
        const query = `
            UPDATE users 
            SET ${updates.join(", ")} 
            WHERE user_id = $${index} 
            RETURNING user_id, username, full_name, email, status, role_id, last_login
        `;

        const result = await pool.query(query, params);
        res.json({ message: "User updated successfully", user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Verify we aren't deleting ourself
        if (Number(id) === req.user.user_id) {
            return res.status(400).json({ error: "You cannot delete your own account." });
        }
        await pool.query("DELETE FROM users WHERE user_id = $1", [id]);
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        // Handle Foreign Key Constraint Violation (e.g., user created sales/purchases/batches)
        if (err.code === '23503') {
            return res.status(400).json({
                error: "This user has recorded operational transactions (Sales, Purchases, etc.). Permanent deletion is blocked to preserve accounting integrity. Please deactivate their access role instead."
            });
        }
        res.status(500).json({ error: err.message });
    }
};
