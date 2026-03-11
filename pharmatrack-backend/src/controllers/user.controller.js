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
        const { full_name, email, phone, avatar_url } = req.body;
        await pool.query(
            `UPDATE users 
       SET full_name = $1, email = $2, phone = $3, avatar_url = $4
       WHERE user_id = $5`,
            [full_name, email, phone, avatar_url, req.user.user_id]
        );
        res.json({ message: "Profile updated successfully" });
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
        const query = `UPDATE users SET ${updates.join(", ")} WHERE user_id = $${index} RETURNING *`;

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
        res.status(500).json({ error: err.message });
    }
};
