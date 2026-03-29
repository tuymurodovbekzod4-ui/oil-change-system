// ========== STATE ==========
let allCars = [];
let allOils = [];
let currentCar = null;

const API_URL = 'https://oil-change-system.onrender.com/api';

// ========== UI ==========
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const modal = document.getElementById('car-modal');
const toast = document.getElementById('toast');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loading-text');

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadOils();
  loadCars();
  loadDashboard();
});

// ========== EVENTS ==========
function setupEventListeners() {
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.getAttribute('data-page');
      navigateToPage(page);
    });
  });

  document.querySelector('.close-btn').addEventListener('click', () => {
    modal.classList.remove('active');
  });
  modal.querySelector('.modal-overlay').addEventListener('click', () => {
    modal.classList.remove('active');
  });

  document.getElementById('add-car-form').addEventListener('submit', addNewCar);
  document.getElementById('add-oil-form').addEventListener('submit', addNewOil);

  setupImageUpload();

  document.querySelectorAll('.modal-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchModalTab(btn.getAttribute('data-tab'));
    });
  });

  document.getElementById('btn-update-km').addEventListener('click', updateCarKm);
  document.getElementById('btn-change-oil').addEventListener('click', changeCarService);
  document.getElementById('btn-delete-car').addEventListener('click', deleteCurrentCar);
}

// ========== IMAGE UPLOAD ==========
function setupImageUpload() {
  const dropZone = document.getElementById('image-drop-zone');
  const fileInput = document.getElementById('car-image-input');

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  async function handleFiles(files) {
    for (let file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          await analyzeCarImage(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }
}

// ========== TESSERACT ==========
async function analyzeCarImage(imageBase64) {
  try {
    showLoading(true);
    loadingText.textContent = '📸 Tesseract tahlil...';

    const { data: { text } } = await Tesseract.recognize(imageBase64, 'eng');

    const plateNumber = extractPlateNumber(text);
    if (plateNumber) {
      document.getElementById('car-number').value = plateNumber;
      document.getElementById('recog-number').textContent = plateNumber;
      showToast(`✅ Raqam: ${plateNumber}`, 'success');
    }

    const color = detectColorFromText(text);
    if (color !== 'Noma\'lum') {
      document.getElementById('recog-color').textContent = color;
      showToast(`✅ Rang: ${color}`, 'success');
    }

    showLoading(false);
  } catch (error) {
    console.error('Xatolik:', error);
    showToast('❌ Tahlil xatolik', 'error');
    showLoading(false);
  }
}

// ========== EXTRACT PLATE ==========
function extractPlateNumber(text) {
  const regex = /\d{2}[A-Z]\d{3}[A-Z]{2}/g;
  const matches = text.match(regex);
  if (matches && matches.length > 0) return matches[0];

  const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const pattern = /^(\d{2})([A-Z])(\d{3})([A-Z]{2})/;
  const match = cleaned.match(pattern);
  if (match) return `${match[1]}${match[2]}${match[3]}${match[4]}`;

  return null;
}

// ========== DETECT COLOR ==========
function detectColorFromText(text) {
  const lower = text.toLowerCase();
  if (lower.includes('white') || lower.includes('oq')) return 'Oq';
  if (lower.includes('black') || lower.includes('qora')) return 'Qora';
  if (lower.includes('red') || lower.includes('qizil')) return 'Qizil';
  if (lower.includes('blue') || lower.includes('ko\'k')) return 'Ko\'k';
  if (lower.includes('gray') || lower.includes('kul')) return 'Kul';
  if (lower.includes('green') || lower.includes('yashil')) return 'Yashil';
  return 'Noma\'lum';
}

// ========== LOADING ==========
function showLoading(show) {
  if (show) loading.classList.add('active');
  else loading.classList.remove('active');
}

// ========== NAVIGATE ==========
function navigateToPage(page) {
  pages.forEach(p => p.classList.remove('active'));
  document.getElementById(page).classList.add('active');

  navItems.forEach(item => item.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`).classList.add('active');

  if (page === 'home') loadDashboard();
  else if (page === 'cars') loadCarsGrid();
  else if (page === 'add-car') resetAddCarForm();
  else if (page === 'oils') loadOilsPage();
}

// ========== LOAD CARS ==========
async function loadCars() {
  try {
    const response = await fetch(`${API_URL}/cars`);
    const data = await response.json();
    if (data.success) allCars = data.cars;
  } catch (error) {
    console.error('Xatolik:', error);
  }
}

// ========== LOAD OILS ==========
async function loadOils() {
  try {
    const response = await fetch(`${API_URL}/oils`);
    const data = await response.json();
    if (data.success) allOils = data.oils;
  } catch (error) {
    console.error('Xatolik:', error);
  }
}

// ========== DASHBOARD ==========
function loadDashboard() {
  const urgent = [];
  const warning = [];
  let urgentCount = 0, warningCount = 0, goodCount = 0;

  allCars.forEach(car => {
    const status = getCarStatus(car);
    if (status.class === 'status-urgent') {
      urgentCount++;
      urgent.push(car);
    } else if (status.class === 'status-warning') {
      warningCount++;
      warning.push(car);
    } else {
      goodCount++;
    }
  });

  document.getElementById('total-cars-stat').textContent = allCars.length;
  document.getElementById('urgent-stat').textContent = urgentCount;
  document.getElementById('warning-stat').textContent = warningCount;
  document.getElementById('good-stat').textContent = goodCount;

  const urgentList = document.getElementById('urgent-list');
  urgentList.innerHTML = [...urgent, ...warning]
    .map(car => createCarListItem(car))
    .join('');
  
  if (urgent.length === 0 && warning.length === 0) {
    urgentList.innerHTML = '<div style="text-align: center; padding: 30px; color: #999;"><p style="font-size: 28px; margin-bottom: 10px;">🎉</p><p>Hammasi yaxshi</p></div>';
  } else {
    urgentList.querySelectorAll('.car-item').forEach(item => {
      item.addEventListener('click', function() {
        currentCar = allCars.find(c => c.id == this.dataset.carId);
        openCarModal();
      });
    });
  }

  const allCarsList = document.getElementById('all-cars-list');
  allCarsList.innerHTML = allCars.map(car => createCarListItem(car)).join('');
  allCarsList.querySelectorAll('.car-item').forEach(item => {
    item.addEventListener('click', function() {
      currentCar = allCars.find(c => c.id == this.dataset.carId);
      openCarModal();
    });
  });
}

// ========== LOAD CARS GRID ==========
function loadCarsGrid() {
  const grid = document.getElementById('cars-grid');
  grid.innerHTML = allCars.map(car => `
    <div class="car-card" data-car-id="${car.id}">
      <div class="car-card-image">🚗</div>
      <div class="car-card-info">
        <div class="car-card-name">${car.car_name}</div>
        <div class="car-card-detail">📍 ${car.car_number}</div>
        <div class="car-card-detail">⚙️ ${car.total_km} km</div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.car-card').forEach(card => {
    card.addEventListener('click', function() {
      currentCar = allCars.find(c => c.id == this.dataset.carId);
      openCarModal();
    });
  });
}

// ========== CREATE CAR LIST ITEM ==========
function createCarListItem(car) {
  const status = getCarStatus(car);
  return `
    <div class="car-item" data-car-id="${car.id}">
      <div class="car-item-image">🚗</div>
      <div class="car-item-info">
        <div class="car-item-name">${car.car_name}</div>
        <div class="car-item-details">${car.car_number} • ${car.total_km} km</div>
        <span class="car-item-status ${status.class}">${status.text}</span>
      </div>
    </div>
  `;
}

// ========== GET CAR STATUS ==========
function getCarStatus(car) {
  const oilUsage = (car.total_km - car.oil_change_km) / (car.daily_km * 180);
  const antiUsage = (car.total_km - car.antifreeze_km) / car.antifreeze_interval;
  const gearUsage = (car.total_km - car.gearbox_km) / car.gearbox_interval;

  const max = Math.max(oilUsage, antiUsage, gearUsage);

  if (max >= 1) return { text: '🔴 HOZIR!', class: 'status-urgent' };
  if (max >= 0.8) return { text: '⚠️ Tez!', class: 'status-warning' };
  return { text: '✅ Yaxshi', class: 'status-ok' };
}

// ========== ADD NEW CAR ==========
async function addNewCar(e) {
  e.preventDefault();

  const car_name = document.getElementById('car-name').value;
  const car_number = document.getElementById('car-number').value;
  const daily_km = document.getElementById('daily-km').value;
  const phone_number = document.getElementById('phone-number').value;
  const oil_name = document.getElementById('oil-name').value;
  const antifreeze_interval = document.getElementById('antifreeze-interval').value;
  const gearbox_interval = document.getElementById('gearbox-interval').value;

  if (!car_name || !car_number || !daily_km || !phone_number || !oil_name) {
    showToast('❌ Barcha maydonlarni to\'ldiring', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/cars/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        car_name,
        car_number,
        daily_km,
        phone_number,
        oil_name,
        antifreeze_interval,
        gearbox_interval
      })
    });

    const data = await response.json();

    if (data.success) {
      showToast('✅ Mashina qo\'shildi!', 'success');
      await loadCars();
      loadDashboard();
      resetAddCarForm();
      navigateToPage('cars');
    } else {
      showToast(`❌ ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Xatolik:', error);
    showToast('❌ Xatolik yuz berdi', 'error');
  }
}

// ========== ADD NEW OIL ==========
async function addNewOil(e) {
  e.preventDefault();

  const name = document.getElementById('oil-name-input').value;
  const interval = document.getElementById('oil-interval-input').value;

  if (!name || !interval) {
    showToast('❌ Barcha maydonlarni to\'ldiring', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/oils/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, interval })
    });

    const data = await response.json();

    if (data.success) {
      showToast('✅ Moy tupi qo\'shildi!', 'success');
      await loadOils();
      loadOilsPage();
      document.getElementById('add-oil-form').reset();
    } else {
      showToast(`❌ ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Xatolik:', error);
    showToast('❌ Xatolik yuz berdi', 'error');
  }
}

// ========== LOAD OILS PAGE ==========
function loadOilsPage() {
  const oilsList = document.getElementById('oils-list');
  oilsList.innerHTML = allOils.map(oil => `
    <div class="oil-item">
      <div>
        <div class="oil-item-name">🛢️ ${oil.name}</div>
        <div class="oil-item-interval">📍 ${oil.interval} km</div>
      </div>
      <div class="oil-item-actions">
        <button onclick="deleteOil(${oil.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

// ========== DELETE OIL ==========
async function deleteOil(id) {
  if (!confirm('Oilni o\'chirasizmi?')) return;

  try {
    const response = await fetch(`${API_URL}/oils/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      showToast('✅ O\'chirildi!', 'success');
      await loadOils();
      loadOilsPage();
    }
  } catch (error) {
    console.error('Xatolik:', error);
  }
}

// ========== OPEN CAR MODAL ==========
function openCarModal() {
  if (!currentCar) return;

  document.getElementById('modal-car-info').innerHTML = `
    <h3>${currentCar.car_name}</h3>
    <p>${currentCar.car_number} • ${currentCar.total_km} km</p>
  `;

  const oilUsage = (currentCar.total_km - currentCar.oil_change_km) / (currentCar.daily_km * 180);
  const antiUsage = (currentCar.total_km - currentCar.antifreeze_km) / currentCar.antifreeze_interval;
  const gearUsage = (currentCar.total_km - currentCar.gearbox_km) / currentCar.gearbox_interval;

  const getServiceStatus = (usage) => {
    if (usage >= 1) return { text: '🔴 HOZIR!', class: 'danger' };
    if (usage >= 0.8) return { text: '⚠️ Tez!', class: 'warning' };
    return { text: '✅ Yaxshi', class: '' };
  };

  const servicesHTML = `
    <div class="service-item">
      <h4>🛢️ Dvigatel Moyi - ${currentCar.oil_name}</h4>
      <p>${getServiceStatus(oilUsage).text}</p>
      <div class="progress-bar">
        <div class="progress-fill ${getServiceStatus(oilUsage).class}" style="width: ${Math.min(oilUsage * 100, 100)}%"></div>
      </div>
      <p>${Math.round((currentCar.total_km - currentCar.oil_change_km))} / ${Math.round(currentCar.daily_km * 180)} km</p>
    </div>

    <div class="service-item">
      <h4>🔵 Antifriz</h4>
      <p>${getServiceStatus(antiUsage).text}</p>
      <div class="progress-bar">
        <div class="progress-fill ${getServiceStatus(antiUsage).class}" style="width: ${Math.min(antiUsage * 100, 100)}%"></div>
      </div>
      <p>${Math.round((currentCar.total_km - currentCar.antifreeze_km))} / ${currentCar.antifreeze_interval} km</p>
    </div>

    <div class="service-item">
      <h4>🟢 Karobka Moyi</h4>
      <p>${getServiceStatus(gearUsage).text}</p>
      <div class="progress-bar">
        <div class="progress-fill ${getServiceStatus(gearUsage).class}" style="width: ${Math.min(gearUsage * 100, 100)}%"></div>
      </div>
      <p>${Math.round((currentCar.total_km - currentCar.gearbox_km))} / ${currentCar.gearbox_interval} km</p>
    </div>
  `;

  document.getElementById('modal-services').innerHTML = servicesHTML;
  document.getElementById('modal-current-km').value = currentCar.total_km;
  document.getElementById('modal-service-type').value = 'oil';
  document.getElementById('modal-oil-name').value = currentCar.oil_name;

  modal.classList.add('active');
}

// ========== UPDATE CAR KM ==========
async function updateCarKm() {
  const km = parseInt(document.getElementById('modal-current-km').value);

  if (!km || km < 0) {
    showToast('❌ KM to\'g\'ri kiriting', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/cars/${currentCar.id}/update-km`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_km: km })
    });

    const data = await response.json();

    if (data.success) {
      showToast('✅ KM yangilandi!', 'success');
      currentCar = data.car;
      await loadCars();
      loadDashboard();
      openCarModal();
    }
  } catch (error) {
    console.error('Xatolik:', error);
  }
}

// ========== CHANGE CAR SERVICE ==========
async function changeCarService() {
  const serviceType = document.getElementById('modal-service-type').value;
  const oilName = document.getElementById('modal-oil-name').value;
  const currentKm = currentCar.total_km;

  if (!oilName) {
    showToast('❌ Moy turini kiriting', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/cars/${currentCar.id}/change-oil`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_type: serviceType,
        oil_name: oilName,
        current_km: currentKm
      })
    });

    const data = await response.json();

    if (data.success) {
      const messages = {
        oil: '✅ Moy almashtirilib\'o\'ldi!',
        antifreeze: '✅ Antifriz yangilandi!',
        gearbox: '✅ Karobka moyi almashtirilib\'o\'ldi!'
      };
      showToast(messages[serviceType], 'success');

      currentCar = data.car;
      await loadCars();
      loadDashboard();
      openCarModal();
    }
  } catch (error) {
    console.error('Xatolik:', error);
  }
}

// ========== DELETE CAR ==========
async function deleteCurrentCar() {
  if (!confirm('Mashinani o\'chirasizmi?')) return;

  try {
    const response = await fetch(`${API_URL}/cars/${currentCar.id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      showToast('✅ Mashina o\'chirildi!', 'success');
      modal.classList.remove('active');
      await loadCars();
      loadDashboard();
      loadCarsGrid();
    }
  } catch (error) {
    console.error('Xatolik:', error);
  }
}

// ========== SWITCH MODAL TAB ==========
function switchModalTab(tabName) {
  document.querySelectorAll('.modal-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.modal-tab-content').forEach(content => content.classList.remove('active'));

  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}-tab`).classList.add('active');
}

// ========== RESET ADD CAR FORM ==========
function resetAddCarForm() {
  document.getElementById('add-car-form').reset();
  document.getElementById('recog-number').textContent = '-';
  document.getElementById('recog-color').textContent = '-';
}

// ========== SHOW TOAST ==========
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
