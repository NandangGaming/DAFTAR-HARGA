/* ============================
   APP.JS – Katalog dengan Keranjang + Pembayaran
   ============================ */

let cart = [];

// Ambil elemen penting
const cartIcon = document.getElementById('cart-icon');
const cartModal = document.getElementById('cart-modal');
const paymentModal = document.getElementById('payment-modal');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const qrisTotalEl = document.getElementById('qris-total');
const bcaTotalEl = document.getElementById('bca-total');

// Tombol tutup modal
document.getElementById('close-cart').onclick = () => cartModal.classList.add('hidden');
document.getElementById('close-payment').onclick = () => paymentModal.classList.add('hidden');

// Tombol keranjang
cartIcon.onclick = () => cartModal.classList.remove('hidden');

// Tombol checkout (pembayaran)
document.getElementById('checkout-btn').onclick = openPaymentModal;

/* ----------------------------
   Fungsi Keranjang
---------------------------- */
function addToCart(name, price) {
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  updateCart();
}

function updateCart() {
  cartItemsEl.innerHTML = '';
  let total = 0;

  cart.forEach(item => {
    const sub = item.price * item.qty;
    total += sub;
    cartItemsEl.innerHTML += `
      <div class="cart-item">
        <span>${item.name}</span>
        <input type="number" min="1" value="${item.qty}" 
               onchange="changeQty('${item.name}', this.value)">
        <span>Rp ${sub.toLocaleString()}</span>
      </div>`;
  });

  cartTotalEl.textContent = `Rp ${total.toLocaleString()}`;
  document.getElementById('cart-count').textContent = cart.length;
}

function changeQty(name, qty) {
  const item = cart.find(i => i.name === name);
  if (item) item.qty = parseInt(qty) || 1;
  updateCart();
}

/* ----------------------------
   Modal Pembayaran
---------------------------- */
function openPaymentModal() {
  if (cart.length === 0) {
    alert("Keranjang masih kosong!");
    return;
  }
  let total = cart.reduce((t, i) => t + (i.price * i.qty), 0);
  qrisTotalEl.textContent = `Rp ${total.toLocaleString()}`;
  bcaTotalEl.textContent = `Rp ${total.toLocaleString()}`;
  paymentModal.classList.remove('hidden');
}

// Tab Pembayaran
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
  });
});

// Konfirmasi WA
document.getElementById('confirm-wa').onclick = () => {
  if (cart.length === 0) {
    alert("Keranjang masih kosong!");
    return;
  }

  let text = 'Halo, saya sudah melakukan pembayaran untuk pesanan:\n';
  cart.forEach(item => text += `- ${item.name} x${item.qty}\n`);
  text += `Total: Rp ${cart.reduce((t, i) => t + (i.price * i.qty), 0).toLocaleString()}`;

  // Ganti nomor WA kamu
  window.open(`https://wa.me/6289697736784?text=${encodeURIComponent(text)}`);
};

/* ----------------------------
   Auto Tambah Tombol Keranjang
---------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    const name = card.querySelector('.product-name')?.textContent || 'Produk';
    const priceText = card.querySelector('.product-price')?.textContent || 'Rp 0';
    const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;

    // Cek apakah tombol sudah ada
    if (!card.querySelector('.add-cart-btn')) {
      const btn = document.createElement('button');
      btn.textContent = 'Tambah ke Keranjang';
      btn.classList.add('add-cart-btn');
      btn.onclick = () => addToCart(name, price);
      card.appendChild(btn);
    }
  });
});
