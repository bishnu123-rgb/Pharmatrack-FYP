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

    // Convert string 'true'/'false' from FormData to boolean
    const isPrescriptionRequired = requires_prescription === 'true' || requires_prescription === true;

    if (!name || !category_id) {
      const missing = [];
      if (!name) missing.push("name");
      if (!category_id) missing.push("category_id");
      return res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` });
    }

    await pool.query(
      `INSERT INTO medicines 
       (medicine_name, category_id, description, dosage_form, strength, manufacturer, image_url, indications, side_effects, requires_prescription) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [name, category_id, description, dosage_form, strength, manufacturer, image_url, indications, side_effects, isPrescriptionRequired || false]
    );

    res.status(201).json({ message: "Medicine created successfully" });

  } catch (err) {
    console.error("CREATE MEDICINE ERROR:", err);
    res.status(500).json({ error: err.message });
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
    console.error("GET MEDICINES ERROR:", err);
    res.status(500).json({ error: err.message });
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

    if (!name || !category_id) {
      console.log("MISSING FIELDS ERROR. req.body:", req.body, "req.file:", req.file);
      const missing = [];
      if (!name) missing.push("name");
      if (!category_id) missing.push("category_id");
      return res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` });
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
      [name, category_id, isActiveBool !== null ? isActiveBool : null, description, dosage_form, strength, manufacturer, image_url, indications, side_effects, isPrescriptionRequired, id]
    );

    res.status(200).json({ message: "Medicine updated successfully" });
  } catch (err) {
    console.error("UPDATE MEDICINE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    // Soft Delete Implementation
    await pool.query("UPDATE medicines SET is_active = FALSE WHERE medicine_id = $1", [id]);
    res.status(200).json({ message: "Medicine deactivated successfully" });
  } catch (err) {
    console.error("DELETE MEDICINE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
