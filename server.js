const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ========== IN-MEMORY DATABASE ==========
let allCars = [];
let allOils = [
  { id: 1, name: 'SAE 5W-30', interval: 18000 },
  { id: 2, name: 'SAE 0W-20', interval: 15000 },
  { id: 3, name: 'SAE 10W-40', interval: 20000 }
];
let carIdCounter = 1;
let oilIdCounter = 4;

// ========== API ROUTES ==========

// Mashina qo'shish
app.post('/api/cars/add', (req, res) => {
  try {
    const { 
      car_name, 
      car_number, 
      daily_km, 
      phone_number, 
      antifreeze_interval, 
      gearbox_interval,
      oil_name
    } = req.body;

    if (!car_name || !car_number || !daily_km || !phone_number) {
      return res.status(400).json({ 
        success: false, 
        error: 'Barcha maydonlarni to\'ldiring' 
      });
    }

    if (allCars.some(c => c.car_number === car_number)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Bu raqamli mashina allaqachon mavjud' 
      });
    }

    const newCar = {
      id: carIdCounter++,
      car_name,
      car_number,
      daily_km: parseInt(daily_km),
      phone_number,
      antifreeze_interval: parseInt(antifreeze_interval) || 3000,
      gearbox_interval: parseInt(gearbox_interval) || 50000,
      total_km: 0,
      oil_change_km: 0,
      oil_name: oil_name || 'SAE 5W-30',
      antifreeze_km: 0,
      gearbox_km: 0,
      created_at: new Date().toISOString()
    };

    allCars.push(newCar);
    res.json({ success: true, message: 'Mashina qo\'shildi', car: newCar });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Barcha mashinalar
app.get('/api/cars', (req, res) => {
  res.json({ success: true, cars: allCars });
});

// Mashina tafsiloti
app.get('/api/cars/:id', (req, res) => {
  const car = allCars.find(c => c.id == req.params.id);
  if (!car) return res.status(404).json({ success: false, error: 'Mashina topilmadi' });
  res.json({ success: true, car });
});

// KM yangilash
app.post('/api/cars/:id/update-km', (req, res) => {
  try {
    const { current_km } = req.body;
    const car = allCars.find(c => c.id == req.params.id);

    if (!car) return res.status(404).json({ success: false, error: 'Mashina topilmadi' });

    car.total_km = parseInt(current_km);
    res.json({ success: true, message: 'KM yangilandi', car });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Xizmat almashtirish
app.post('/api/cars/:id/change-oil', (req, res) => {
  try {
    const { oil_name, current_km, service_type } = req.body;
    const car = allCars.find(c => c.id == req.params.id);

    if (!car) return res.status(404).json({ success: false, error: 'Mashina topilmadi' });

    if (service_type === 'oil') {
      car.oil_name = oil_name;
      car.oil_change_km = parseInt(current_km);
    } else if (service_type === 'antifreeze') {
      car.antifreeze_km = parseInt(current_km);
    } else if (service_type === 'gearbox') {
      car.gearbox_km = parseInt(current_km);
    }

    res.json({ success: true, message: 'Xizmat yangilandi', car });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mashina o'chirish
app.delete('/api/cars/:id', (req, res) => {
  try {
    allCars = allCars.filter(c => c.id != req.params.id);
    res.json({ success: true, message: 'Mashina o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Moylar qo'shish
app.post('/api/oils/add', (req, res) => {
  try {
    const { name, interval } = req.body;

    if (!name || !interval) {
      return res.status(400).json({ success: false, error: 'Barcha maydonlarni to\'ldiring' });
    }

    const newOil = {
      id: oilIdCounter++,
      name,
      interval: parseInt(interval)
    };

    allOils.push(newOil);
    res.json({ success: true, message: 'Moy tupi qo\'shildi', oil: newOil });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Barcha moylar
app.get('/api/oils', (req, res) => {
  res.json({ success: true, oils: allOils });
});

// Moy o'chirish
app.delete('/api/oils/:id', (req, res) => {
  try {
    allOils = allOils.filter(o => o.id != req.params.id);
    res.json({ success: true, message: 'Moy tupi o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 SERVER RUNNING ON PORT ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🆓 100% FREE - Tesseract.js\n`);
});
