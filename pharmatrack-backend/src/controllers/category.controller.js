const pool = require("../config/db");

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name required" });
    }

    await pool.query(
      "INSERT INTO categories (category_name) VALUES ($1)",
      [name]
    );

    res.status(201).json({ message: "Category created successfully" });

  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT category_id, category_name as name FROM categories WHERE is_active = TRUE ORDER BY category_id DESC"
    );

    res.status(200).json(result.rows);

  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name required" });
    }

    await pool.query(
      "UPDATE categories SET category_name = $1, is_active = COALESCE($2, is_active) WHERE category_id = $3",
      [name, is_active, id]
    );

    res.status(200).json({ message: "Category updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    // Soft Delete Implementation
    await pool.query("UPDATE categories SET is_active = FALSE WHERE category_id = $1", [id]);
    res.status(200).json({ message: "Category archived successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};
