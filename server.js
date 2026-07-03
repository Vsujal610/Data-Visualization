const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'sales.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// Sales Data Generator for Initial DB State
// ============================================================
const regions = ['North', 'South', 'East', 'West'];
const categoryProducts = {
  Electronics: ['Laptop', 'Phone', 'Tablet', 'Monitor', 'Headphones', 'Smart Watch'],
  Furniture: ['Desk', 'Chair', 'Bookshelf', 'Lamp', 'Sofa', 'Cabinet'],
  Clothing: ['Jacket', 'Shoes', 'T-Shirt', 'Jeans', 'Sweater', 'Boots'],
  Sports: ['Bicycle', 'Yoga Mat', 'Dumbbells', 'Running Shoes', 'Tennis Racket', 'Football'],
  'Home & Garden': ['Vacuum Cleaner', 'Coffee Maker', 'Blender', 'Garden Hose', 'Plant Pot', 'Curtains'],
};
const categories = Object.keys(categoryProducts);
const salesRanges = {
  Electronics: [299, 1800],
  Furniture: [79, 950],
  Clothing: [25, 280],
  Sports: [19, 650],
  'Home & Garden': [29, 450],
};
const profitMargins = {
  Electronics: [0.12, 0.28],
  Furniture: [0.18, 0.38],
  Clothing: [0.25, 0.55],
  Sports: [0.20, 0.45],
  'Home & Garden': [0.22, 0.42],
};

function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function generateDate(month) {
  const year = 2025;
  const day = randomInt(1, 28);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function generateSalesData() {
  const records = [];
  let id = 1;

  for (let month = 1; month <= 12; month++) {
    const count = randomInt(19, 23); // ~20-22 records per month
    for (let i = 0; i < count; i++) {
      const category = randomFrom(categories);
      const products = categoryProducts[category];
      const product = randomFrom(products);
      const [minSale, maxSale] = salesRanges[category];
      const [minMargin, maxMargin] = profitMargins[category];
      const quantity = randomInt(1, 8);
      const unitSales = randomBetween(minSale, maxSale);
      const sales = Math.round(unitSales * quantity * 100) / 100;
      const margin = randomBetween(minMargin, maxMargin);
      const profit = Math.round(sales * margin * 100) / 100;

      records.push({
        id: id++,
        date: generateDate(month),
        region: randomFrom(regions),
        product,
        category,
        sales,
        quantity,
        profit,
      });
    }
  }
  return records.sort((a, b) => a.date.localeCompare(b.date));
}

// Ensure database file and directory exist
function initDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    console.log('Database not found. Pre-populating with 250 realistic sales records...');
    const initialData = generateSalesData();
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    console.log('Database initialized successfully.');
  }
}

initDatabase();

// ============================================================
// API Endpoints
// ============================================================

// Helper to read database
function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return [];
  }
}

// Helper to write database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

// GET all sales records
app.get('/api/sales', (req, res) => {
  const records = readDB();
  res.json(records);
});

// POST add a sales record
app.post('/api/sales', (req, res) => {
  const { date, region, product, category, sales, quantity, profit } = req.body;

  // Validation
  if (!date || !region || !product || !category || sales === undefined || quantity === undefined || profit === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const records = readDB();
  
  // Find highest ID
  const maxId = records.reduce((max, r) => (r.id > max ? r.id : max), 0);
  const newRecord = {
    id: maxId + 1,
    date,
    region,
    product,
    category,
    sales: Number(sales),
    quantity: Number(quantity),
    profit: Number(profit)
  };

  records.push(newRecord);
  // Re-sort by date
  records.sort((a, b) => a.date.localeCompare(b.date));

  if (writeDB(records)) {
    res.status(201).json(newRecord);
  } else {
    res.status(500).json({ error: 'Failed to save record' });
  }
});

// DELETE a sales record
app.delete('/api/sales/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  let records = readDB();
  const initialLength = records.length;
  records = records.filter(r => r.id !== id);

  if (records.length === initialLength) {
    return res.status(404).json({ error: 'Record not found' });
  }

  if (writeDB(records)) {
    res.json({ message: 'Record deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// Wildcard to serve static frontend (SPA routing helper if needed)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
