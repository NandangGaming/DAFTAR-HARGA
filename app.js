const SHEET_ID = "15g0UFq0fLNbyORzKiITkLzlRduUSvi6TEFhVqoQOedM";
const SHEET_NAME = "Sheet1";
const WA_PHONE = "6289697736784";
const CURRENCY_PREFIX = "Rp";
const THOUSANDS = ".";

let rawProducts = [];
let filteredProducts = [];
let cart = [];

function formatRupiah(num) {
  const intVal = parseInt(num, 10);
  if (isNaN(intVal)) return num;
  return CURRENCY_PREFIX + " " + intVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS);
}

// Ambil data dari Google Sheet
async function fetchSheetData() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
  const res = await fetch(url);
  const text = await res.text();
  const jsonStr = text.substring(text.indexOf("(") + 1, text.lastIndexOf(")"));
  const dataObj = JSON.parse(jsonStr);
  return gvizToObjects(dataObj.table).map(normalizeRow);
}

function gvizToObjects(table) {
  const cols = table.cols.map(c => c.label || c.id);
  return table.rows.map(r => {
    const obj = {};
    cols.forEach((col, i) => obj[col] = r.c[i] ? r.c[i].v : "");
    return obj;
  });
}

function normalizeRow(p) {
  return {
    SKU: p["SKU"],
    Nama: p["Nama"],
    Harga: parseInt(p["Harga"]) || 0,
    Deskripsi: p["Diskripsi"] || p["Deskripsi"],
    FotoURL: p["FotoURL"],
    Kategori: p["Kategori"],
    Stok: p["Stok"],
    Aktif: p["Aktif"],
  };
}

function applyFilters() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const cat = document.getElementById('categoryFilter').value;
  const sort = document.getElementById('sortSelect').value;

  filteredProducts = rawProducts.filter(p => {
    if (String(p.Aktif).toLowerCase() === 'false') return false;
    const hay = `${p.SKU} ${p.Nama} ${p.Deskripsi} ${p.Kategori}`.toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (cat && p.Kategori !== cat) return false;
    return true;
  });

  switch (sort) {
    case 'harga-asc':
      filteredProducts.sort((a, b) => a.Harga - b.Harga);
      break;
    case 'harga-desc':
      filteredProducts.sort((a, b) => b.Harga - a.Harga);
      break;
    case 'nama-asc':
      filteredProducts.sort((a, b) => a.Nama.localeCompare(b.Nama));
      break;
    case 'nama-desc':
      filteredProducts.sort((a, b) => b.Nama.localeCompare(a.Nama));
      break;
  }
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';
  if (!filteredProducts.length) {
    grid.innerHTML = '<div class="col-span-full text-center text-gray-500">Tidak ada produk.</div>';
    return;
  }

  filteredProducts.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card p-2 flex flex-col';
    const imgSrc = p.FotoURL || 'https://via.placeholder.com/300x200?text=No+Image';
    const desc = p.Deskripsi || '';
    card.innerHTML = `
      <img src="${imgSrc}" alt="${p.Nama}" loading="lazy"/>
      <div class="flex-1 flex flex-col mt-2">
        <h3 class="product-name mb-1">${p.Nama}</h3>
        <p class="product-price mb-1">${formatRupiah(p.Harga)}</p>
        <p class="product-desc mb-2">${desc}</p>
        <button class="add-cart-btn mt-auto" data-sku="${p.SKU}">+ Keranjang</button>
      </div>`;
    grid.appendChild(card);
  });

  document.querySelectorAll('.add-cart-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const sku = e.target.dataset.sku;
      const product = rawProducts.find(p => p.SKU === sku);
      addToCart(product);
    });
  });
}

// Tambah ke keranjang
function addToCart(product) {
  const existing = cart.find(item => item.sku === product.SKU);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ sku: product.SKU, name: product.Nama, price: product.Harga, qty: 1 });
  }
  updateCartUI();
}

function updateCartUI() {
  document.getElementById('cart-count').textContent = cart.reduce((sum, item) => sum + item.qty, 0);
}

function renderCart() {
  const container = document.getElementById('cart-items');
  container.innerHTML = '';
  if (!cart.length) {
    container.innerHTML = '<p>Keranjang kosong.</p>';
    return;
  }
  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <span>${item.name} x ${item.qty}</span>
      <span>${formatRupiah(item.price * item.qty)}</span>`;
    container.appendChild(div);
  });
  document.getElementById('cart-total').textContent = formatRupiah(getCartTotal());
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

// Modal Handling
document.getElementById('cart-icon').addEventListener('click', () => {
  renderCart();
  document.getElementById('cart-modal').classList.remove('hidden');
});

document.getElementById('close-cart').addEventListener('click', () => {
  document.getElementById('cart-modal').classList.add('hidden');
});

document.getElementById('checkout-btn').addEventListener('click', () => {
  document.getElementById('cart-modal').classList.add('hidden');
  document.getElementById('payment-modal').classList.remove('hidden');
  document.getElementById('qris-total').textContent = formatRupiah(getCartTotal());
  document.getElementById('bca-total').textContent = formatRupiah(getCartTotal());
});

document.getElementById('close-payment').addEventListener('click', () => {
  document.getElementById('payment-modal').classList.add('hidden');
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
    document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
  });
});

// Konfirmasi WA
document.getElementById('confirm-wa').addEventListener('click', () => {
  const text = buildCartWaMessage();
  const link = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
  window.open(link, '_blank');
});

function buildCartWaMessage() {
  let msg = "Halo, saya sudah melakukan pembayaran.\n\nPesanan saya:\n";
  cart.forEach(item => {
    msg += `- ${item.name} x ${item.qty} = ${formatRupiah(item.price * item.qty)}\n`;
  });
  msg += `\nTotal: ${formatRupiah(getCartTotal())}`;
  return msg;
}

// Filter dan Inisialisasi
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('categoryFilter').addEventListener('change', applyFilters);
document.getElementById('sortSelect').addEventListener('change', applyFilters);

async function init() {
  try {
    const data = await fetchSheetData();
    rawProducts = data;
    populateCategoryFilter();
    applyFilters();
    document.getElementById('lastUpdated').textContent = `Data dimuat: ${new Date().toLocaleString('id-ID')}`;
  } catch (err) {
    console.error(err);
  }
}

function populateCategoryFilter() {
  const sel = document.getElementById('categoryFilter');
  sel.innerHTML = '<option value="">Semua Kategori</option>';
  const cats = Array.from(new Set(rawProducts.map(p => p.Kategori).filter(Boolean)));
  cats.sort();
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
}

init();
