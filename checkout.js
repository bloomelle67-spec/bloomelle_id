document.addEventListener('DOMContentLoaded', () => {
  const auth = window.BloomelleAuth.requireAuth();
  if (!auth) return;

  const STORAGE_KEYS = {
    checkoutDraft: 'bloomelle.checkout.draft',
    latestInvoice: 'bloomelle.checkout.invoice',
    orderHistory: 'bloomelle.checkout.history'
  };

  const PAYMENT_CONFIG = {
    ewallet: [
      {
        id: 'gopay',
        group: 'ewallet',
        label: 'GoPay',
        description: 'Pembayaran instan melalui GoPay.',
        target: '0812-3456-7890\na.n Bloomelle Studio',
        copyLabel: 'Salin Nomor E-Wallet'
      },
      {
        id: 'dana',
        group: 'ewallet',
        label: 'DANA',
        description: 'Pembayaran instan melalui DANA.',
        target: '0812-9876-5432\na.n Bloomelle Studio',
        copyLabel: 'Salin Nomor E-Wallet'
      }
    ],
    bank: [
      {
        id: 'mandiri',
        group: 'bank',
        label: 'Bank Mandiri',
        description: 'Transfer bank ke rekening tujuan di bawah ini.',
        target: '1230012345678\na.n Bloomelle Studio',
        copyLabel: 'Salin Nomor Rekening'
      },
      {
        id: 'bri',
        group: 'bank',
        label: 'Bank BRI',
        description: 'Transfer bank ke rekening tujuan di bawah ini.',
        target: '456701234567890\na.n Bloomelle Studio',
        copyLabel: 'Salin Nomor Rekening'
      }
    ]
  };

  const SHIPPING_OPTIONS = [
    { id: 'regular', label: 'Reguler', estimate: '2-4 Hari', fee: 15000 },
    { id: 'express', label: 'Express', estimate: '1 Hari', fee: 30000 }
  ];

  const PRODUCT_CATALOG = [
    { id: 1, name: 'Vas Mini Bloomelle', category: 'Dekorasi Meja Estetik', price: 33000, originalPrice: 49000, image: 'vas bunga 1-2.jpg' },
    { id: 2, name: 'Bloomelle Medium Bouquet', category: 'Bouquet Premium', price: 58000, originalPrice: 79000, image: 'buket 1-2.jpg' },
    { id: 3, name: 'Bloomelle Keychain', category: 'Aksesori Lucu', price: 15000, originalPrice: 19000, image: 'ganci 1-2.jpg' },
    { id: 4, name: 'Bloomelle Brooch', category: 'Aksesori Fashion', price: 17000, originalPrice: 21000, image: 'bros 1-4.jpg' },
    { id: 5, name: 'Bloomelle Hair Clip', category: 'Aksesori Rambut', price: 18000, originalPrice: 22000, image: 'https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80' }
  ];

  const BUNDLE_CATALOG = [
    {
      id: 'bundle-1',
      name: 'Paket Meja Estetik',
      price: 60000,
      normalPrice: 65000,
      image: PRODUCT_CATALOG[0].image,
      includes: [PRODUCT_CATALOG[0].name, PRODUCT_CATALOG[2].name, PRODUCT_CATALOG[3].name]
    },
    {
      id: 'bundle-2',
      name: 'Paket Gift Special',
      price: 68000,
      normalPrice: 73000,
      image: PRODUCT_CATALOG[1].image,
      includes: [PRODUCT_CATALOG[1].name, PRODUCT_CATALOG[2].name]
    },
    {
      id: 'bundle-3',
      name: 'Paket Premium Bloom',
      price: 95000,
      normalPrice: 106000,
      image: PRODUCT_CATALOG[1].image,
      includes: [PRODUCT_CATALOG[1].name, PRODUCT_CATALOG[0].name, PRODUCT_CATALOG[2].name]
    }
  ];

  const VOUCHERS = [
    { code: 'BLOOM10', title: 'BLOOM10', description: 'Diskon 10%', type: 'percent', value: 0.1 },
    { code: 'FREESHIP', title: 'FREESHIP', description: 'Gratis ongkir', type: 'shipping', value: 1 }
  ];

  const defaultAddress = {
    recipientName: 'Prathama Khairan Putera',
    phone: '0812-3456-7890',
    province: 'Lampung',
    city: 'Bandar Lampung',
    district: 'Tanjung Karang Pusat',
    subdistrict: 'Kebon Jeruk',
    postalCode: '35111',
    detailAddress: 'Jl. Contoh No. 123, Patokan dekat taman kota',
    label: 'Rumah',
    primary: true
  };

  const initialDraft = loadDraft();
  const initialItems = loadCheckoutItems();
  const initialAddress = initialDraft.address || defaultAddress;

  const state = {
    address: initialAddress,
    shipping: initialDraft.shipping || SHIPPING_OPTIONS[0].id,
    paymentId: initialDraft.paymentId || 'gopay',
    gift: initialDraft.gift || false,
    giftMessage: initialDraft.giftMessage || '',
    donation: initialDraft.donation || false,
    sellerNote: initialDraft.sellerNote || '',
    orderNote: initialDraft.orderNote || '',
    voucherCode: initialDraft.voucherCode || null,
    invoiceNumber: initialDraft.invoiceNumber || '',
    addressConfirmed: typeof initialDraft.addressConfirmed === 'boolean' ? initialDraft.addressConfirmed : Boolean(initialAddress.recipientName || initialAddress.phone || initialAddress.detailAddress),
    items: initialItems.length ? initialItems : [{ ...PRODUCT_CATALOG[0], qty: 1 }]
  };

  const el = {
    addressTitle: document.getElementById('addressTitle'),
    addressBadge: document.getElementById('addressBadge'),
    addressPhone: document.getElementById('addressPhone'),
    addressText: document.getElementById('addressText'),
    addressRegion: document.getElementById('addressRegion'),
    editAddressBtn: document.getElementById('editAddressBtn'),
    recipientNameInput: document.getElementById('recipientNameInput'),
    phoneInput: document.getElementById('phoneInput'),
    provinceInput: document.getElementById('provinceInput'),
    cityInput: document.getElementById('cityInput'),
    districtInput: document.getElementById('districtInput'),
    subdistrictInput: document.getElementById('subdistrictInput'),
    postalCodeInput: document.getElementById('postalCodeInput'),
    detailAddressInput: document.getElementById('detailAddressInput'),
    addressLabelSelect: document.getElementById('addressLabelSelect'),
    primaryAddressInput: document.getElementById('primaryAddressInput'),
    addressModalTitle: document.getElementById('addressModalTitle'),
    addressModalSubtitle: document.getElementById('addressModalSubtitle'),
    cartItems: document.getElementById('cartItems'),
    shippingOptions: document.getElementById('shippingOptions'),
    paymentOptions: document.getElementById('paymentOptions'),
    selectedVoucherLabel: document.getElementById('selectedVoucherLabel'),
    paymentSummaryValue: document.getElementById('paymentSummaryValue'),
    subtotalProducts: document.getElementById('subtotalProducts'),
    subtotalShipping: document.getElementById('subtotalShipping'),
    voucherDiscount: document.getElementById('voucherDiscount'),
    serviceFee: document.getElementById('serviceFee'),
    donationValue: document.getElementById('donationValue'),
    grandTotal: document.getElementById('grandTotal'),
    sidebarTotal: document.getElementById('sidebarTotal'),
    footerTotal: document.getElementById('footerTotal'),
    summaryShipping: document.getElementById('summaryShipping'),
    summaryPayment: document.getElementById('summaryPayment'),
    summaryProductCount: document.getElementById('summaryProductCount'),
    shipError: document.getElementById('shipError'),
    sellerNote: document.getElementById('sellerNote'),
    orderNote: document.getElementById('orderNote'),
    giftWrap: document.getElementById('giftWrap'),
    giftMessageWrap: document.getElementById('giftMessageWrap'),
    giftMessage: document.getElementById('giftMessage'),
    donateCheckbox: document.getElementById('donateCheckbox'),
    openVoucherBtn: document.getElementById('openVoucherBtn'),
    closeVoucherBtn: document.getElementById('closeVoucherBtn'),
    createOrderBtn: document.getElementById('createOrderBtn'),
    cancelOrderBtn: document.getElementById('cancelOrderBtn'),
    continueOrderBtn: document.getElementById('continueOrderBtn'),
    confirmationModal: document.getElementById('confirmationModal'),
    confirmAddress: document.getElementById('confirmAddress'),
    confirmPayment: document.getElementById('confirmPayment'),
    confirmTotal: document.getElementById('confirmTotal'),
    voucherModal: document.getElementById('voucherModal'),
    voucherOptions: document.getElementById('voucherOptions'),
    addressModal: document.getElementById('addressModal'),
    cancelAddressBtn: document.getElementById('cancelAddressBtn'),
    saveAddressBtn: document.getElementById('saveAddressBtn'),
    toast: document.getElementById('toast')
  };

  function loadDraft() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.checkoutDraft)) || {};
    } catch {
      return {};
    }
  }

  function readJSON(raw) {
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function productById(id) {
    return PRODUCT_CATALOG.find(product => product.id === id) || null;
  }

  function bundleById(id) {
    return BUNDLE_CATALOG.find(bundle => bundle.id === id) || null;
  }

  function loadCheckoutItems() {
    const queryProductId = Number(new URLSearchParams(window.location.search).get('productId'));
    const queryBundleId = new URLSearchParams(window.location.search).get('bundle');
    const directCheckout = readJSON(localStorage.getItem('bloomelle-direct-checkout'));
    const cart = readJSON(localStorage.getItem('bloomelle-cart'));

    const directBundle = bundleById(directCheckout?.bundleId || queryBundleId);
    if (directBundle) {
      return [{
        id: directBundle.id,
        name: directBundle.name,
        category: 'Bundle Deal',
        price: directBundle.price,
        image: directCheckout?.bundleImage || directCheckout?.image || directBundle.image,
        qty: 1,
        includes: directBundle.includes,
        bundle: true
      }];
    }

    const directId = Number(directCheckout?.productId || queryProductId);
    if (Number.isFinite(directId) && directId > 0) {
      const product = productById(directId);
      if (product) {
        return [{
          ...product,
          image: directCheckout?.image || directCheckout?.productImage || product.image,
          qty: Number(directCheckout?.quantity) || 1
        }];
      }
    }

    if (Array.isArray(cart) && cart.length) {
      return cart
        .map(item => {
          const product = productById(Number(item?.product?.id));
          if (!product) return null;
          return {
            ...product,
            ...item.product,
            image: item.product?.image || product.image,
            qty: Number(item.quantity) || 1
          };
        })
        .filter(Boolean);
    }

    return [];
  }

  function saveDraft(partial) {
    const current = loadDraft();
    const next = { ...current, ...partial };
    localStorage.setItem(STORAGE_KEYS.checkoutDraft, JSON.stringify(next));
  }

  function saveDraftState() {
    saveDraft({
      address: state.address,
      shipping: state.shipping,
      paymentId: state.paymentId,
      gift: state.gift,
      giftMessage: state.giftMessage,
      donation: state.donation,
      sellerNote: state.sellerNote,
      orderNote: state.orderNote,
      voucherCode: state.voucherCode,
      addressConfirmed: state.addressConfirmed,
      invoiceNumber: state.invoiceNumber
    });
  }

  function money(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value)));
  }

  function toast(message) {
    el.toast.textContent = message;
    el.toast.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => el.toast.classList.remove('show'), 1800);
  }

  function openModal(modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal(modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function getSelectedShipping() {
    return SHIPPING_OPTIONS.find(option => option.id === state.shipping) || SHIPPING_OPTIONS[0];
  }

  function getSelectedPayment() {
    return [...PAYMENT_CONFIG.ewallet, ...PAYMENT_CONFIG.bank].find(option => option.id === state.paymentId) || PAYMENT_CONFIG.ewallet[0];
  }

  function getSelectedVoucher() {
    return VOUCHERS.find(voucher => voucher.code === state.voucherCode) || null;
  }

  function getProductSubtotal() {
    return state.items.reduce((total, product) => total + product.price * product.qty, 0);
  }

  function getShippingCost() {
    return getSelectedShipping().fee;
  }

  function getVoucherDiscount() {
    const voucher = getSelectedVoucher();
    if (!voucher) return 0;
    if (voucher.type === 'percent') return getProductSubtotal() * voucher.value;
    if (voucher.type === 'shipping') return getShippingCost();
    return 0;
  }

  function getTotal() {
    const adminFee = 1000;
    const donationFee = state.donation ? 2000 : 0;
    return getProductSubtotal() + getShippingCost() - getVoucherDiscount() + adminFee + donationFee;
  }

  function formatAddressLine(address) {
    return [address.detailAddress, address.subdistrict, address.district, address.city, address.province, address.postalCode]
      .filter(Boolean)
      .join(', ');
  }

  function renderAddress() {
    const address = state.address;
    const region = [address.subdistrict, address.district, address.city, address.province].filter(Boolean).join(', ');
    el.addressTitle.textContent = address.recipientName || 'Belum ada alamat tersimpan';
    el.addressBadge.textContent = address.label || 'Rumah';
    el.addressPhone.textContent = address.phone || 'Lengkapi nomor handphone';
    el.addressText.textContent = formatAddressLine(address) || 'Simpan alamat pengiriman agar checkout bisa dilanjutkan.';
    el.addressRegion.textContent = region;

    el.recipientNameInput.value = address.recipientName || '';
    el.phoneInput.value = address.phone || '';
    el.provinceInput.value = address.province || '';
    el.cityInput.value = address.city || '';
    el.districtInput.value = address.district || '';
    el.subdistrictInput.value = address.subdistrict || '';
    el.postalCodeInput.value = address.postalCode || '';
    el.detailAddressInput.value = address.detailAddress || '';
    el.addressLabelSelect.value = address.label || 'Rumah';
    el.primaryAddressInput.checked = Boolean(address.primary);
    el.addressModalTitle.textContent = state.addressConfirmed ? 'Edit Alamat' : 'Tambah Alamat';
    el.addressModalSubtitle.textContent = state.addressConfirmed ? 'Perbarui alamat pengiriman Anda di sini.' : 'Lengkapi alamat pengiriman agar pesanan bisa diproses.';
  }

  function renderProducts() {
    el.cartItems.innerHTML = state.items.map(product => `
      <article class="product-card">
        <img src="${product.image}" alt="${product.name}" />
        <div>
          <p class="product-name">${product.name}</p>
          <div class="product-category">${product.category}</div>
          <div class="product-meta">
            <span>Qty ${product.qty}</span>
            <strong>${money(product.price)}</strong>
          </div>
          ${Array.isArray(product.includes) ? `<div class="product-subitems">${product.includes.map(item => `<span>${item}</span>`).join('')}</div>` : ''}
          <div class="product-subtotal">Subtotal: <strong>${money(product.price * product.qty)}</strong></div>
        </div>
      </article>
    `).join('');
    el.summaryProductCount.textContent = `${state.items.reduce((total, product) => total + product.qty, 0)} item`;
  }

  function renderShipping() {
    el.shippingOptions.innerHTML = SHIPPING_OPTIONS.map(option => `
      <label class="choice-card ${state.shipping === option.id ? 'active' : ''}" data-shipping="${option.id}">
        <input type="radio" name="shippingMethod" ${state.shipping === option.id ? 'checked' : ''} />
        <div class="choice-copy">
          <strong>${option.label}</strong>
          <span>Estimasi ${option.estimate}</span>
        </div>
        <div class="choice-fee">${money(option.fee)}</div>
      </label>
    `).join('');

    el.shippingOptions.querySelectorAll('[data-shipping]').forEach(card => {
      card.addEventListener('click', () => {
        state.shipping = card.dataset.shipping || SHIPPING_OPTIONS[0].id;
        saveDraftState();
        renderShipping();
        renderTotals();
      });
    });

    el.summaryShipping.textContent = getSelectedShipping().label;
  }

  function renderPayment() {
    const options = [...PAYMENT_CONFIG.ewallet, ...PAYMENT_CONFIG.bank];
    el.paymentOptions.innerHTML = options.map(option => {
      const active = state.paymentId === option.id ? 'active' : '';
      const targetText = option.target.split('\n').join('<br />');
      return `
        <label class="payment-card ${active}" data-payment="${option.id}">
          <input type="radio" name="paymentMethod" ${state.paymentId === option.id ? 'checked' : ''} />
          <div class="payment-card-head">
            <div>
              <strong>${option.label}</strong>
              <p>${option.description}</p>
            </div>
            <span class="radio-mark"></span>
          </div>
          <div class="payment-target">${targetText}</div>
          <button class="copy-button" type="button" data-copy-target="${option.id}">${option.copyLabel}</button>
        </label>
      `;
    }).join('');

    el.paymentOptions.querySelectorAll('[data-payment]').forEach(card => {
      card.addEventListener('click', event => {
        const copyButton = event.target.closest('[data-copy-target]');
        if (copyButton) return;
        state.paymentId = card.dataset.payment || options[0].id;
        saveDraftState();
        renderPayment();
        renderTotals();
        toast('Metode pembayaran diperbarui');
      });
    });

    el.paymentOptions.querySelectorAll('[data-copy-target]').forEach(button => {
      button.addEventListener('click', async event => {
        event.preventDefault();
        event.stopPropagation();
        const payment = options.find(option => option.id === button.dataset.copyTarget);
        if (!payment) return;
        const copyText = payment.group === 'bank' ? payment.target.replace(/\na\.n.*$/, '') : payment.target.replace(/\na\.n.*$/, '');
        try {
          await navigator.clipboard.writeText(copyText);
          toast('Nomor berhasil disalin.');
        } catch {
          toast('Nomor berhasil disalin.');
        }
      });
    });

    const payment = getSelectedPayment();
    el.summaryPayment.textContent = payment.label;
    el.paymentSummaryValue.textContent = payment.label;
  }

  function renderVouchers() {
    const selectedVoucher = getSelectedVoucher();
    el.selectedVoucherLabel.textContent = selectedVoucher ? `${selectedVoucher.title} dipilih` : 'Belum ada voucher dipilih';
    const selectedText = selectedVoucher ? `${selectedVoucher.title} dipilih` : 'Belum ada voucher dipilih';
    el.selectedVoucherLabel.textContent = selectedText;
    saveDraftState();
  }

  function renderTotals() {
    const subtotalProducts = getProductSubtotal();
    const subtotalShipping = getShippingCost();
    const voucherDiscount = getVoucherDiscount();
    const adminFee = 1000;
    const donationFee = state.donation ? 2000 : 0;
    const total = subtotalProducts + subtotalShipping - voucherDiscount + adminFee + donationFee;

    el.subtotalProducts.textContent = money(subtotalProducts);
    el.subtotalShipping.textContent = money(subtotalShipping);
    el.voucherDiscount.textContent = `- ${money(voucherDiscount)}`;
    el.serviceFee.textContent = money(adminFee);
    el.donationValue.textContent = money(donationFee);
    el.grandTotal.textContent = money(total);
    el.sidebarTotal.textContent = money(total);
    el.footerTotal.textContent = money(total);
    el.confirmTotal.textContent = money(total);
    el.confirmPayment.textContent = getSelectedPayment().label;
    el.confirmAddress.textContent = formatAddressLine(state.address) || 'Alamat belum lengkap';

    el.createOrderBtn.disabled = false;
    el.createOrderBtn.classList.remove('is-disabled');
    el.shipError.classList.toggle('hidden', state.addressConfirmed);
    if (!state.addressConfirmed) {
      el.shipError.textContent = 'Alamat belum disimpan. Anda masih bisa lanjut, tetapi sebaiknya cek ulang alamat terlebih dahulu.';
    }

    saveDraftState();
  }

  function hydrateFromDraft() {
    el.sellerNote.value = state.sellerNote;
    el.orderNote.value = state.orderNote;
    el.giftWrap.checked = state.gift;
    el.giftMessageWrap.classList.toggle('hidden', !state.gift);
    el.giftMessage.value = state.giftMessage;
    el.donateCheckbox.checked = state.donation;
  }

  function buildInvoiceData(invoiceNumber) {
    const payment = getSelectedPayment();
    const address = state.address;
    const total = getTotal();
    return {
      invoiceNumber,
      createdAt: new Date().toISOString(),
      buyerName: address.recipientName,
      buyerAddress: formatAddressLine(address),
      buyerPhone: address.phone,
      status: 'Pesanan Dibuat',
      payment: {
        id: payment.id,
        label: payment.label,
        target: payment.target,
        group: payment.group
      },
      address,
      totals: {
        subtotalProducts: getProductSubtotal(),
        shipping: getShippingCost(),
        voucherDiscount: getVoucherDiscount(),
        adminFee: 1000,
        donationFee: state.donation ? 2000 : 0,
        total
      },
      voucher: getSelectedVoucher(),
      notes: {
        sellerNote: state.sellerNote,
        orderNote: state.orderNote,
        gift: state.gift,
        giftMessage: state.giftMessage
      },
      products: state.items.map(product => ({ ...product }))
    };
  }

  function generateInvoiceNumber() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const next = String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0');
    return `INV-BLM-${yyyy}${mm}${dd}-${next}`;
  }

  function saveInvoice(invoiceData) {
    localStorage.setItem(STORAGE_KEYS.latestInvoice, JSON.stringify(invoiceData));

    const history = readJSON(localStorage.getItem(STORAGE_KEYS.orderHistory));
    const nextHistory = [invoiceData, ...(Array.isArray(history) ? history : [])]
      .filter(Boolean)
      .slice(0, 10);
    localStorage.setItem(STORAGE_KEYS.orderHistory, JSON.stringify(nextHistory));

    localStorage.removeItem(STORAGE_KEYS.checkoutDraft);
    localStorage.removeItem('bloomelle-direct-checkout');
  }

  function validateAddress() {
    const hasUsableAddress = Boolean(state.address?.recipientName || state.address?.phone || state.address?.detailAddress);
    if (hasUsableAddress) return true;
    toast('Silakan isi alamat terlebih dahulu.');
    openModal(el.addressModal);
    return false;
  }

  function openConfirmation() {
    if (!validateAddress()) return;
    el.confirmAddress.textContent = formatAddressLine(state.address) || 'Alamat belum lengkap';
    el.confirmPayment.textContent = getSelectedPayment().label;
    el.confirmTotal.textContent = money(getTotal());
    openModal(el.confirmationModal);
  }

  function setAddressFromInputs() {
    state.address = {
      recipientName: el.recipientNameInput.value.trim() || 'Prathama Khairan Putera',
      phone: el.phoneInput.value.trim() || '0812-3456-7890',
      province: el.provinceInput.value.trim() || 'Lampung',
      city: el.cityInput.value.trim() || 'Bandar Lampung',
      district: el.districtInput.value.trim() || 'Tanjung Karang Pusat',
      subdistrict: el.subdistrictInput.value.trim() || 'Kebon Jeruk',
      postalCode: el.postalCodeInput.value.trim() || '35111',
      detailAddress: el.detailAddressInput.value.trim() || 'Jl. Contoh No. 123, Patokan dekat taman kota',
      label: el.addressLabelSelect.value || 'Rumah',
      primary: el.primaryAddressInput.checked
    };
    state.addressConfirmed = true;
    saveDraftState();
    renderAddress();
    renderTotals();
    toast('Alamat berhasil disimpan.');
  }

  function wireEvents() {
    el.editAddressBtn.addEventListener('click', () => openModal(el.addressModal));
    el.cancelAddressBtn.addEventListener('click', () => closeModal(el.addressModal));
    el.saveAddressBtn.addEventListener('click', () => {
      setAddressFromInputs();
      closeModal(el.addressModal);
    });

    el.openVoucherBtn.addEventListener('click', () => openModal(el.voucherModal));
    el.closeVoucherBtn.addEventListener('click', () => closeModal(el.voucherModal));

    el.voucherOptions.addEventListener('click', event => {
      const button = event.target.closest('[data-voucher]');
      if (!button) return;
      const voucher = VOUCHERS.find(item => item.code === button.dataset.voucher) || null;
      state.voucherCode = voucher ? voucher.code : null;
      saveDraftState();
      closeModal(el.voucherModal);
      renderVouchers();
      renderTotals();
      toast('Voucher diterapkan.');
    });

    el.giftWrap.addEventListener('change', () => {
      state.gift = el.giftWrap.checked;
      el.giftMessageWrap.classList.toggle('hidden', !state.gift);
      saveDraftState();
      renderTotals();
    });

    el.giftMessage.addEventListener('input', () => {
      state.giftMessage = el.giftMessage.value;
      saveDraftState();
    });

    el.donateCheckbox.addEventListener('change', () => {
      state.donation = el.donateCheckbox.checked;
      renderTotals();
    });

    el.sellerNote.addEventListener('input', () => {
      state.sellerNote = el.sellerNote.value;
      saveDraftState();
    });

    el.orderNote.addEventListener('input', () => {
      state.orderNote = el.orderNote.value;
      saveDraftState();
    });

    el.createOrderBtn.addEventListener('click', openConfirmation);
    el.cancelOrderBtn.addEventListener('click', () => closeModal(el.confirmationModal));
    el.continueOrderBtn.addEventListener('click', () => {
      if (!validateAddress()) return;
      const invoiceNumber = generateInvoiceNumber();
      state.invoiceNumber = invoiceNumber;
      const invoiceData = buildInvoiceData(invoiceNumber);
      saveInvoice(invoiceData);
      closeModal(el.confirmationModal);
      window.location.href = `invoice.html?invoice=${encodeURIComponent(invoiceNumber)}`;
    });

    document.querySelectorAll('[data-close-confirmation]').forEach(node => node.addEventListener('click', () => closeModal(el.confirmationModal)));
    document.querySelectorAll('[data-close-voucher]').forEach(node => node.addEventListener('click', () => closeModal(el.voucherModal)));
    document.querySelectorAll('[data-close-address]').forEach(node => node.addEventListener('click', () => closeModal(el.addressModal)));

    window.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeModal(el.confirmationModal);
        closeModal(el.voucherModal);
        closeModal(el.addressModal);
      }
    });
  }

  renderProducts();
  hydrateFromDraft();
  renderAddress();
  renderShipping();
  renderPayment();
  renderVouchers();
  renderTotals();
  wireEvents();
});
