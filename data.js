// ============================================================
// MODIT — in-memory mock data (replace with DB in production)
// ============================================================

const { v4: uuid } = require("uuid");

const SUPPLIERS = [
  { id:"sup-001", name:"RK Steel Traders",           zone:"Noida",         categories:["TMT Steel","Structural Steel"],       rating:4.8, delivery_hrs:2, price_index:0.97, gstin:true, bnpl:true  },
  { id:"sup-002", name:"UltraTech Cement Direct",    zone:"Noida",         categories:["Cement","Dry Mix"],                   rating:4.6, delivery_hrs:2, price_index:1.02, gstin:true, bnpl:false },
  { id:"sup-003", name:"Shree Cement Hub",            zone:"Gurugram",      categories:["Cement"],                             rating:4.4, delivery_hrs:24, price_index:0.98, gstin:true, bnpl:false },
  { id:"sup-004", name:"Kamal Tiles & Sanitary",     zone:"Noida",         categories:["Tiles","Sanitary","CP Fittings"],     rating:4.3, delivery_hrs:24, price_index:1.00, gstin:true, bnpl:true  },
  { id:"sup-005", name:"Gupta Hardware & Plywood",   zone:"Noida",         categories:["Plywood","Hardware","Laminates"],     rating:4.1, delivery_hrs:6,  price_index:0.99, gstin:true, bnpl:false },
  { id:"sup-006", name:"Delhi Aggregate Suppliers",  zone:"Greater Noida", categories:["Sand","Aggregate"],                   rating:4.4, delivery_hrs:5,  price_index:0.95, gstin:true, bnpl:false },
  { id:"sup-007", name:"Havells & Anchor Hub",        zone:"Noida",         categories:["Electrical","Wires","MCBs"],          rating:4.7, delivery_hrs:1,  price_index:1.01, gstin:true, bnpl:true  },
  { id:"sup-008", name:"Asian Paints Depot",          zone:"Gurugram",      categories:["Paint","Primer","Putty"],             rating:4.5, delivery_hrs:24, price_index:1.00, gstin:true, bnpl:false },
  { id:"sup-009", name:"JK Lakshmi Depot",            zone:"Faridabad",     categories:["Cement"],                             rating:4.2, delivery_hrs:3,  price_index:1.04, gstin:true, bnpl:false },
  { id:"sup-010", name:"Kamdhenu Steel NCR",          zone:"Gurugram",      categories:["TMT Steel","Structural Steel"],       rating:4.3, delivery_hrs:24, price_index:1.03, gstin:true, bnpl:false },
];

const PRODUCTS = [
  { id:"prd-001", name:"UltraTech OPC 43 Cement 50kg",  category:"Cement",    unit:"bag",  base_price:372, supplier_id:"sup-002" },
  { id:"prd-002", name:"Shree OPC 43 Cement 50kg",       category:"Cement",    unit:"bag",  base_price:365, supplier_id:"sup-003" },
  { id:"prd-003", name:"JK Lakshmi OPC 43 Cement 50kg",  category:"Cement",    unit:"bag",  base_price:380, supplier_id:"sup-009" },
  { id:"prd-004", name:"Fe500D TMT Bar 12mm (RK Steel)",  category:"TMT Steel", unit:"MT",   base_price:61500, supplier_id:"sup-001" },
  { id:"prd-005", name:"Fe500D TMT Bar 12mm (Kamdhenu)", category:"TMT Steel", unit:"MT",   base_price:63200, supplier_id:"sup-010" },
  { id:"prd-006", name:"River Sand (Coarse)",             category:"Sand",      unit:"cu.ft",base_price:54,   supplier_id:"sup-006" },
  { id:"prd-007", name:"Vitrified Tile 600x600 Glossy",  category:"Tiles",     unit:"sqft", base_price:48,   supplier_id:"sup-004" },
  { id:"prd-008", name:"Havells 2.5mm Copper Wire 90m",  category:"Electrical",unit:"coil", base_price:2350, supplier_id:"sup-007" },
  { id:"prd-009", name:"Asian Paints Tractor Emulsion 20L",category:"Paint",   unit:"drum", base_price:2680, supplier_id:"sup-008" },
  { id:"prd-010", name:"Century Ply MR Grade 19mm",      category:"Plywood",   unit:"sqft", base_price:118,  supplier_id:"sup-005" },
];

const ORDERS = [];
const RFQS   = [];
const USERS  = [
  { id:"usr-001", name:"Demo Contractor", phone:"9876543210", type:"contractor", zone:"Noida" }
];

module.exports = { SUPPLIERS, PRODUCTS, ORDERS, RFQS, USERS, uuid };
