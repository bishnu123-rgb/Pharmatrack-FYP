require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const categoryRoutes = require("./routes/category.routes");
const medicineRoutes = require("./routes/medicine.routes");
const batchRoutes = require("./routes/batch.routes");
const purchaseRoutes = require("./routes/purchase.routes");
const saleRoutes = require("./routes/sale.routes");
const alertRoutes = require("./routes/alert.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const userRoutes = require("./routes/user.routes");
const supplierRoutes = require("./routes/supplier.routes");
const storeRoutes = require("./routes/store.routes");
const aiRoutes = require("./routes/ai.routes");
const aiService = require("./services/ai.service");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/ai", aiRoutes);

// Train AI on startup
aiService.init();


app.get("/", (req, res) => {
  res.send("PharmaTrack API running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
