// ============================================================
// MODIT Backend — Express API server
// ============================================================
require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const multer   = require("multer");
const path     = require("path");
const { SUPPLIERS, PRODUCTS, ORDERS, RFQS, USERS, uuid } = require("./data");

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend from ../frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// File upload storage
const storage = multer.memoryStorage();
const upload  = multer({ storage, limits:{ fileSize: 10 * 1024 * 1024 } });

// ---------------------------------------------------------------
// HEALTH
// ---------------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({ status:"ok", service:"MODIT API", region:"Delhi NCR", ts: new Date() });
});

// ---------------------------------------------------------------
// SUPPLIERS
// ---------------------------------------------------------------
app.get("/api/suppliers", (req, res) => {
  let result = [...SUPPLIERS];
  const { zone, category, bnpl, min_rating, sort } = req.query;

  if (zone)       result = result.filter(s => s.zone.toLowerCase().includes(zone.toLowerCase()));
  if (category)   result = result.filter(s => s.categories.some(c => c.toLowerCase().includes(category.toLowerCase())));
  if (bnpl === "true") result = result.filter(s => s.bnpl);
  if (min_rating) result = result.filter(s => s.rating >= parseFloat(min_rating));

  if (sort === "rating")   result.sort((a,b) => b.rating - a.rating);
  else if (sort === "delivery") result.sort((a,b) => a.delivery_hrs - b.delivery_hrs);
  else if (sort === "price")    result.sort((a,b) => a.price_index - b.price_index);

  res.json({ count: result.length, suppliers: result });
});

app.get("/api/suppliers/:id", (req, res) => {
  const s = SUPPLIERS.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error:"Supplier not found" });
  const products = PRODUCTS.filter(p => p.supplier_id === s.id);
  res.json({ ...s, products });
});

// ---------------------------------------------------------------
// PRODUCTS
// ---------------------------------------------------------------
app.get("/api/products", (req, res) => {
  let result = [...PRODUCTS];
  const { category, q, sort } = req.query;

  if (category) result = result.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
  if (q)        result = result.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase()));

  if (sort === "price_asc")  result.sort((a,b) => a.base_price - b.base_price);
  if (sort === "price_desc") result.sort((a,b) => b.base_price - a.base_price);

  // Attach supplier name
  result = result.map(p => ({
    ...p,
    supplier: SUPPLIERS.find(s => s.id === p.supplier_id)?.name || "Unknown"
  }));

  res.json({ count: result.length, products: result });
});

// ---------------------------------------------------------------
// PRICE COMPARISON for a category/product name
// ---------------------------------------------------------------
app.get("/api/compare", (req, res) => {
  const { product, zone } = req.query;
  if (!product) return res.status(400).json({ error:"Provide ?product=name" });

  let matches = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(product.toLowerCase()) ||
    p.category.toLowerCase().includes(product.toLowerCase())
  );

  if (zone) {
    matches = matches.filter(p => {
      const sup = SUPPLIERS.find(s => s.id === p.supplier_id);
      return sup && sup.zone.toLowerCase().includes(zone.toLowerCase());
    });
  }

  const result = matches.map(p => {
    const sup = SUPPLIERS.find(s => s.id === p.supplier_id);
    return {
      product_name : p.name,
      supplier     : sup?.name,
      zone         : sup?.zone,
      price        : p.base_price,
      unit         : p.unit,
      delivery_hrs : sup?.delivery_hrs,
      rating       : sup?.rating,
      gstin        : sup?.gstin,
      bnpl         : sup?.bnpl,
    };
  }).sort((a,b) => a.price - b.price);

  const best = result[0] || null;
  res.json({ query: product, zone: zone||"All NCR", best, all: result });
});

// ---------------------------------------------------------------
// QUOTATION / RFQ
// ---------------------------------------------------------------
app.post("/api/rfq", (req, res) => {
  const { project_name, project_type, zone, materials, delivery_date, payment } = req.body;
  if (!materials || !materials.length)
    return res.status(400).json({ error:"Provide materials array" });

  // Simple mock pricing engine
  const line_items = materials.map(m => {
    const match = PRODUCTS.find(p =>
      p.name.toLowerCase().includes(m.name?.toLowerCase() || m.toLowerCase()) ||
      p.category.toLowerCase().includes(m.name?.toLowerCase() || m.toLowerCase())
    );
    const sup = match ? SUPPLIERS.find(s => s.id === match?.supplier_id) : null;
    const qty  = m.qty || 1;
    const price = match?.base_price || 0;
    const total = price * qty;
    return {
      item         : m.name || m,
      qty          : qty,
      unit         : match?.unit || "unit",
      best_price   : price,
      supplier     : sup?.name || "Pending match",
      delivery_hrs : sup?.delivery_hrs || null,
      line_total   : total,
    };
  });

  const subtotal = line_items.reduce((a,b) => a + b.line_total, 0);
  const gst      = +(subtotal * 0.18).toFixed(0);

  const rfq = {
    id           : "RFQ-" + Math.floor(1000 + Math.random()*9000),
    project_name : project_name || "Unnamed project",
    project_type : project_type || "General",
    zone         : zone || "Delhi NCR",
    delivery_date,
    payment      : payment || "Advance",
    line_items,
    subtotal,
    gst,
    total        : subtotal + gst,
    status       : "awaiting_supplier_bids",
    created_at   : new Date(),
  };
  RFQS.push(rfq);
  res.status(201).json(rfq);
});

app.get("/api/rfq", (req, res) => {
  res.json({ count: RFQS.length, rfqs: RFQS });
});

app.get("/api/rfq/:id", (req, res) => {
  const r = RFQS.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error:"RFQ not found" });
  res.json(r);
});

// ---------------------------------------------------------------
// ORDER
// ---------------------------------------------------------------
app.post("/api/order", (req, res) => {
  const { rfq_id, supplier_id, buyer_name, buyer_phone, delivery_address } = req.body;
  if (!delivery_address) return res.status(400).json({ error:"delivery_address required" });

  const sup  = SUPPLIERS.find(s => s.id === supplier_id) || SUPPLIERS[0];
  const eta  = new Date(Date.now() + sup.delivery_hrs * 3600000);

  const order = {
    id               : "MD-" + Math.floor(10000 + Math.random()*90000),
    rfq_id           : rfq_id || null,
    supplier         : sup.name,
    buyer_name       : buyer_name || "Guest buyer",
    buyer_phone      : buyer_phone || "",
    delivery_address,
    status           : "confirmed",
    dispatch_eta     : eta,
    tracking_url     : "#",
    gstin_invoice    : "INV-" + Date.now(),
    created_at       : new Date(),
  };
  ORDERS.push(order);
  res.status(201).json(order);
});

app.get("/api/order/:id", (req, res) => {
  const o = ORDERS.find(x => x.id === req.params.id);
  if (!o) return res.status(404).json({ error:"Order not found" });
  res.json(o);
});

// Delivery tracking mock
app.get("/api/track/:orderId", (req, res) => {
  const o = ORDERS.find(x => x.id === req.params.orderId);
  if (!o) return res.status(404).json({ error:"Order not found" });
  const statuses = ["confirmed","dispatched","in_transit","arriving_soon","delivered"];
  const elapsed  = (Date.now() - new Date(o.created_at)) / 60000; // minutes
  const statusIdx = Math.min(Math.floor(elapsed / 5), statuses.length-1);
  res.json({
    order_id    : o.id,
    status      : statuses[statusIdx],
    eta_minutes : Math.max(0, 40 - Math.floor(elapsed)),
    km_remaining: Math.max(0, +(8.4 - elapsed * 0.22).toFixed(1)),
    location    : "NH-58, Noida — 4.2 km from your site",
    driver      : { name:"Ravi Singh", phone:"+91 9811XXXXXX" },
  });
});

// ---------------------------------------------------------------
// BOQ UPLOAD (parses metadata; NLP in AI route)
// ---------------------------------------------------------------
app.post("/api/boq/upload", upload.single("boq_file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error:"No file uploaded" });
  res.json({
    filename    : req.file.originalname,
    size_bytes  : req.file.size,
    mimetype    : req.file.mimetype,
    message     : "BOQ received. AI processing initiated — estimated line items will be returned within 30s in production.",
    mock_items  : [
      { item:"OPC 53 Cement 50kg bags", qty:300, unit:"bag"  },
      { item:"Fe500D TMT 12mm bars",    qty:15,  unit:"MT"   },
      { item:"Vitrified tiles 600x600", qty:800, unit:"sqft" },
      { item:"River sand (coarse)",     qty:200, unit:"cu.ft"},
      { item:"Copper wire 2.5mm 90m",   qty:12,  unit:"coil" },
    ],
  });
});

// ---------------------------------------------------------------
// AGENTIC AI — natural language procurement agent (mock)
// ---------------------------------------------------------------
app.post("/api/ai/agent", (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error:"Provide query" });
  const q = query.toLowerCase();

  let reply = "I can help you search materials, compare prices, negotiate with vendors, place orders and track deliveries across Delhi NCR. What are you sourcing?";

  if (q.includes("recommend") || q.includes("flat") || q.includes("bhk") || q.includes("villa"))
    reply = "For a standard 2BHK (~950 sqft) in Noida, I recommend: 380 bags OPC 43 cement (₹365/bag — Shree Cement), 4.2 MT Fe500D TMT bars (₹61,500/MT — RK Steel), 320 cu.ft river sand, 6,800 class-A bricks, and 1,050 sqft vitrified tiles. Total material estimate: ₹4.8L–₹5.2L (ex-GST). Shall I send an RFQ to 5 matched suppliers?";
  else if (q.includes("cement") && q.includes("price"))
    reply = "Live OPC 43 cement prices in NCR: Shree Cement Hub ₹365/bag (best value, 24h delivery), UltraTech Direct ₹372/bag (2h delivery), JK Lakshmi ₹380/bag (3h), Ambuja ₹369/bag (5h). Want me to negotiate below ₹360 for a bulk order?";
  else if (q.includes("tmt") || q.includes("steel"))
    reply = "Fe500D 12mm TMT: RK Steel Traders ₹61,500/MT (3h, Noida), Kamdhenu NCR ₹63,200/MT (same day, Gurugram), Jindal Faridabad ₹62,000/MT (24h). For 20MT+ I can negotiate to ~₹59,500. Should I proceed?";
  else if (q.includes("negotiat"))
    reply = "Negotiation mode activated. Counter-offer of ₹59,800/MT sent to RK Steel and Kamdhenu. Citing: 20MT order volume, prompt payment, established account. Expected response within 2 hours. I'll notify you.";
  else if (q.includes("track") || q.includes("delivery") || q.includes("order"))
    reply = "Order #MD-10234 (200 bags OPC 53): 📍 Currently 4.2 km from your Sector-62 site, ETA 38 minutes. Driver: Ravi Singh (+91 9811XXXXXX). Second order #MD-10201 (TMT bars) delivered ✓.";
  else if (q.includes("reorder"))
    reply = "Smart reorder triggered. Based on site consumption (18 bags/day), stock-out in ~3 days. Proposing: 300 bags OPC 53 from Shree Cement Hub @ ₹365 = ₹1,09,500+GST. Approve or re-quote?";
  else if (q.includes("boq") || q.includes("bom") || q.includes("upload"))
    reply = "BOQ/BOM reader ready. Upload your Excel, PDF or Word BOQ on the /quotation page and I'll extract all line items, match to live NCR SKUs, and return a priced multi-vendor comparison in ~30 seconds.";

  res.json({ query, reply, timestamp: new Date() });
});

// ---------------------------------------------------------------
// AI DEMAND FORECAST (for supplier dashboard)
// ---------------------------------------------------------------
app.get("/api/ai/demand-forecast", (req, res) => {
  res.json({
    zone     : "Noida / Greater Noida",
    week     : "July week-2, 2026",
    forecasts: [
      { material:"Fe500D 12mm TMT", trend:"+22%",  reason:"New residential launches in Sector 150, 168" },
      { material:"Structural Steel", trend:"+14%",  reason:"Commercial projects resuming post-monsoon prep" },
      { material:"OPC 53 Cement",    trend:"+9%",   reason:"Seasonal demand uptick, bulk pre-orders rising" },
      { material:"Vitrified Tiles",  trend:"+11%",  reason:"Interior work season, Diwali renovation wave" },
      { material:"Wire Mesh",        trend:"-8%",   reason:"Large project completions, lower new starts" },
    ],
  });
});

// ---------------------------------------------------------------
// SUPPLIER REGISTRATION
// ---------------------------------------------------------------
app.post("/api/supplier/register", (req, res) => {
  const { name, phone, zone, categories } = req.body;
  if (!name || !phone) return res.status(400).json({ error:"name and phone required" });
  const newSup = {
    id         : "sup-" + uuid().slice(0,6),
    name, phone, zone: zone||"Delhi NCR",
    categories : categories||[],
    rating     : null,
    delivery_hrs: null,
    price_index: 1,
    gstin      : false,
    bnpl       : false,
    status     : "pending_verification",
    created_at : new Date(),
  };
  SUPPLIERS.push(newSup);
  res.status(201).json({ message:"Registration received. Verification within 24 hours.", supplier: newSup });
});

// ---------------------------------------------------------------
// CATCH-ALL: serve frontend
// ---------------------------------------------------------------
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.listen(PORT, () => {
  console.log(`\n🧱 MODIT API server running at http://localhost:${PORT}`);
  console.log(`   Serving frontend at  http://localhost:${PORT}/index.html`);
  console.log(`   API base:            http://localhost:${PORT}/api\n`);
});
