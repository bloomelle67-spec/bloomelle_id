document.addEventListener('DOMContentLoaded', () => {
  const storageKey = 'bloomelle.checkout.invoice';
  const invoiceData = safeParse(localStorage.getItem(storageKey));

  const el = {
    invoiceNumber: document.getElementById('invoiceNumber'),
    invoiceNumberCopy: document.getElementById('invoiceNumberCopy'),
    invoiceDate: document.getElementById('invoiceDate'),
    invoiceStatus: document.getElementById('invoiceStatus'),
    buyerName: document.getElementById('buyerName'),
    buyerAddress: document.getElementById('buyerAddress'),
    buyerPhone: document.getElementById('buyerPhone'),
    invoiceProducts: document.getElementById('invoiceProducts'),
    subtotalProducts: document.getElementById('subtotalProducts'),
    shippingCost: document.getElementById('shippingCost'),
    discountValue: document.getElementById('discountValue'),
    adminFee: document.getElementById('adminFee'),
    totalPayment: document.getElementById('totalPayment'),
    paymentMethod: document.getElementById('paymentMethod'),
    paymentTarget: document.getElementById('paymentTarget'),
    paymentStatus: document.getElementById('paymentStatus'),
    printInvoiceBtn: document.getElementById('printInvoiceBtn'),
    toast: document.getElementById('toast')
  };

  function safeParse(value) {
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  function money(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value || 0)));
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => el.toast.classList.remove('show'), 1800);
  }

  function renderFallback() {
    el.invoiceNumber.textContent = 'INV-BLM-UNKNOWN';
    el.invoiceNumberCopy.textContent = 'INV-BLM-UNKNOWN';
    el.invoiceDate.textContent = '-';
    el.invoiceStatus.textContent = 'Pesanan Dibuat';
    el.buyerName.textContent = '-';
    el.buyerAddress.textContent = '-';
    el.buyerPhone.textContent = '-';
    el.invoiceProducts.innerHTML = '<div class="product-row"><strong>Data invoice tidak ditemukan</strong><span>-</span><span>-</span></div>';
    el.subtotalProducts.textContent = money(0);
    el.shippingCost.textContent = money(0);
    el.discountValue.textContent = `- ${money(0)}`;
    el.adminFee.textContent = money(0);
    el.totalPayment.textContent = money(0);
  }

  function renderInvoice(data) {
    const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    el.invoiceNumber.textContent = data.invoiceNumber || 'INV-BLM-UNKNOWN';
    el.invoiceNumberCopy.textContent = data.invoiceNumber || 'INV-BLM-UNKNOWN';
    el.invoiceDate.textContent = createdAt.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: '2-digit' });
    el.invoiceStatus.textContent = data.status || 'Pesanan Dibuat';
    el.buyerName.textContent = data.buyerName || '-';
    el.buyerAddress.textContent = data.buyerAddress || '-';
    el.buyerPhone.textContent = data.buyerPhone || '-';
    el.paymentMethod.textContent = data.payment?.label || '-';
    el.paymentTarget.textContent = data.payment?.target || '-';
    el.paymentStatus.textContent = data.status || 'Menunggu Pembayaran';
    el.subtotalProducts.textContent = money(data.totals?.subtotalProducts);
    el.shippingCost.textContent = money(data.totals?.shipping);
    el.discountValue.textContent = `- ${money(data.totals?.voucherDiscount)}`;
    el.adminFee.textContent = money(data.totals?.adminFee);
    el.totalPayment.textContent = money(data.totals?.total);

    el.invoiceProducts.innerHTML = (data.products || []).map(product => `
      <div class="product-row">
        <div>
          <strong>${product.name}</strong>
          <span>Produk Bloomelle</span>
        </div>
        <span>Qty ${product.qty}</span>
        <strong>${money(product.price * product.qty)}</strong>
      </div>
    `).join('');
  }

  function buildPrintableMarkup() {
    return document.body.innerHTML;
  }

  if (!invoiceData) {
    renderFallback();
  } else {
    renderInvoice(invoiceData);
  }

  el.printInvoiceBtn.addEventListener('click', () => {
    window.print();
    showToast('Membuka dialog cetak.');
  });

  window.addEventListener('beforeprint', () => {
    document.body.classList.add('printing');
  });

  window.addEventListener('afterprint', () => {
    document.body.classList.remove('printing');
  });
});
