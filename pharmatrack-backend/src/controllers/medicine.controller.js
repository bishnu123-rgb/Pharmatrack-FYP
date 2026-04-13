const pool = require("../config/db");

exports.createMedicine = async (req, res) => {
  try {
    let {
      name, category_id, description, dosage_form,
      strength, manufacturer, image_url, indications, side_effects,
      requires_prescription
    } = req.body;

    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    const isPrescriptionRequired = requires_prescription === 'true' || requires_prescription === true;

    if (!name || name.trim() === '' || !category_id) {
      const missing = [];
      if (!name || name.trim() === '') missing.push("name");
      if (!category_id) missing.push("category_id");
      return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    }

    await pool.query(
      `INSERT INTO medicines 
       (medicine_name, category_id, description, dosage_form, strength, manufacturer, image_url, indications, side_effects, requires_prescription) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [name.trim(), category_id, description, dosage_form, strength, manufacturer, image_url, indications, side_effects, isPrescriptionRequired || false]
    );

    res.status(201).json({ message: "Medicine created successfully" });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: "A medicine with this name already exists." });
    }
    res.status(500).json({ message: "Failed to create medicine." });
  }
};

exports.getMedicines = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.medicine_id, 
        m.medicine_name as name, 
        m.category_id, 
        m.is_active,
        m.description,
        m.dosage_form,
        m.strength,
        m.manufacturer,
        m.image_url,
        m.indications,
        m.side_effects,
        m.requires_prescription,
        c.category_name,
        COALESCE((SELECT SUM(i.current_quantity) FROM inventory i JOIN batches b ON i.batch_id = b.batch_id WHERE b.medicine_id = m.medicine_id), 0) as total_stock
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.category_id
      WHERE m.is_active = TRUE
      ORDER BY m.medicine_id DESC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch medicines." });
  }
};

exports.getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        m.*, c.category_name,
        COALESCE((SELECT SUM(current_quantity) FROM inventory WHERE batch_id IN (SELECT batch_id FROM batches WHERE medicine_id = m.medicine_id)), 0) as total_stock
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.category_id
      WHERE m.medicine_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch medicine." });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      name, category_id, is_active, description, dosage_form,
      strength, manufacturer, image_url, indications, side_effects,
      requires_prescription
    } = req.body;

    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    const isPrescriptionRequired = requires_prescription === 'true' || requires_prescription === true;
    const isActiveBool = is_active !== undefined ? (is_active === 'true' || is_active === true) : null;

    if (!name || name.trim() === '' || !category_id) {
      const missing = [];
      if (!name || name.trim() === '') missing.push("name");
      if (!category_id) missing.push("category_id");
      return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    }

    await pool.query(
      `UPDATE medicines SET 
        medicine_name = $1, 
        category_id = $2, 
        is_active = COALESCE($3::boolean, is_active),
        description = $4,
        dosage_form = $5,
        strength = $6,
        manufacturer = $7,
        image_url = $8,
        indications = $9,
        side_effects = $10,
        requires_prescription = $11
      WHERE medicine_id = $12`,
      [name.trim(), category_id, isActiveBool !== null ? isActiveBool : null, description, dosage_form, strength, manufacturer, image_url, indications, side_effects, isPrescriptionRequired, id]
    );

    res.status(200).json({ message: "Medicine updated successfully" });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: "A medicine with this name already exists." });
    }
    res.status(500).json({ message: "Failed to update medicine." });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE medicines SET is_active = FALSE WHERE medicine_id = $1", [id]);
    res.status(200).json({ message: "Medicine archived successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to archive medicine." });
  }
};
