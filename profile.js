document.addEventListener('DOMContentLoaded', () => {
  const auth = window.BloomelleAuth.requireAuth();
  if (!auth) return;

  const state = {
    gender: 'Pilih jenis kelamin',
    verified: true,
    avatarData: null,
    selectedGender: null,
    profile: null,
    orders: []
  };

  const STORAGE_KEYS = {
    orderHistory: 'bloomelle.checkout.history',
    latestInvoice: 'bloomelle.checkout.invoice'
  };

  const defaultProfile = {
    name: auth.name || 'Bloomelle User',
    bio: 'Suka belanja produk estetik dan modern.',
    gender: 'Pilih jenis kelamin',
    birthday: '',
    phone: '',
    email: auth.email || 'customer@bloomelle.id',
    verified: true,
    avatar: null
  };

  const avatarButton = document.getElementById('avatarButton');
  const avatarInput = document.getElementById('avatarInput');
  const avatarPreview = document.getElementById('avatarPreview');
  const profileHeaderName = document.getElementById('profileHeaderName');
  const nameInput = document.getElementById('nameInput');
  const bioInput = document.getElementById('bioInput');
  const bioCount = document.getElementById('bioCount');
  const genderButton = document.getElementById('genderButton');
  const genderValue = document.getElementById('genderValue');
  const birthdayInput = document.getElementById('birthdayInput');
  const phoneInput = document.getElementById('phoneInput');
  const maskedEmail = document.getElementById('maskedEmail');
  const verificationBadge = document.getElementById('verificationBadge');
  const saveButton = document.getElementById('saveButton');
  const ordersList = document.getElementById('ordersList');
  const ordersEmpty = document.getElementById('ordersEmpty');
  const ordersCount = document.getElementById('ordersCount');
  const genderBackdrop = document.getElementById('genderBackdrop');
  const genderSheet = document.getElementById('genderSheet');
  const sheetCloseButton = document.getElementById('sheetCloseButton');
  const sheetConfirmButton = document.getElementById('sheetConfirmButton');
  const sheetOptions = Array.from(document.querySelectorAll('.sheet-option'));
  const toast = document.createElement('div');

  toast.className = 'toast';
  toast.id = 'toast';
  document.body.appendChild(toast);

  function safeParse(raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function storageKey() {
    const sessionAuth = safeParse(sessionStorage.getItem('bloomelle-auth') || 'null');
    return sessionAuth ? 'sessionStorage' : 'localStorage';
  }

  function getStoredProfile() {
    try {
      return JSON.parse(localStorage.getItem('bloomelle-profile-edit') || 'null') || defaultProfile;
    } catch {
      return defaultProfile;
    }
  }

  function getStoredOrders() {
    const history = safeParse(localStorage.getItem(STORAGE_KEYS.orderHistory) || 'null');
    if (Array.isArray(history) && history.length) return history;

    const latestInvoice = safeParse(localStorage.getItem(STORAGE_KEYS.latestInvoice) || 'null');
    return latestInvoice ? [latestInvoice] : [];
  }

  function saveStoredProfile(profile) {
    localStorage.setItem('bloomelle-profile-edit', JSON.stringify(profile));

    const authStore = storageKey() === 'sessionStorage' ? sessionStorage : localStorage;
    const authRecord = safeParse(authStore.getItem('bloomelle-auth') || 'null');
    if (authRecord) {
      authRecord.name = profile.name;
      authRecord.email = profile.email;
      authStore.setItem('bloomelle-auth', JSON.stringify(authRecord));
    }
  }

  function maskEmail(email) {
    const [localPart, domain = ''] = String(email || '').split('@');
    if (!localPart || !domain) return 'p***********3@gmail.com';

    const first = localPart.charAt(0);
    const last = localPart.charAt(localPart.length - 1);
    const maskedLocal = `${first}${'*'.repeat(Math.max(7, localPart.length - 1))}${last}`;
    return `${maskedLocal}@${domain}`;
  }

  function money(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value || 0)));
  }

  function formatDate(value) {
    const date = value ? new Date(value) : new Date();
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function renderOrders(orders) {
    state.orders = orders;
    ordersCount.textContent = `${orders.length} pesanan`;
    ordersEmpty.hidden = orders.length > 0;

    if (!orders.length) {
      ordersList.innerHTML = '';
      return;
    }

    ordersList.innerHTML = orders.map(order => {
      const itemCount = Array.isArray(order.products)
        ? order.products.reduce((total, product) => total + (Number(product.qty) || 0), 0)
        : 0;
      const productNames = Array.isArray(order.products)
        ? order.products.slice(0, 3).map(product => product.name).join(', ')
        : '-';
      const total = order.totals?.total || 0;

      return `
        <article class="order-item">
          <div class="order-top">
            <div>
              <p class="order-number">${order.invoiceNumber || 'INV-BLM-UNKNOWN'}</p>
              <h4>${order.status || 'Pesanan Dibuat'}</h4>
            </div>
            <span class="order-total">${money(total)}</span>
          </div>
          <div class="order-meta">
            <span>${formatDate(order.createdAt)}</span>
            <span>${itemCount} item</span>
            <span>${order.payment?.label || '-'}</span>
          </div>
          <p class="order-products">${productNames}</p>
        </article>
      `;
    }).join('');
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 1700);
  }

  function syncBioCount() {
    bioCount.textContent = `${bioInput.value.length}/150`;
  }

  function avatarUrl(name) {
    const safeName = encodeURIComponent(String(name || 'Bloomelle').trim() || 'Bloomelle');
    return `https://ui-avatars.com/api/?name=${safeName}&background=ee4d2d&color=fff&size=256&bold=true`;
  }

  function setAvatar(source) {
    avatarPreview.src = source;
    const isCustomImage = String(source).startsWith('data:') || String(source).startsWith('blob:');
    state.avatarData = isCustomImage ? source : null;
  }

  function updateGenderSelection(gender) {
    state.selectedGender = gender;
    sheetOptions.forEach(option => option.classList.toggle('active', option.dataset.gender === gender));
  }

  function openGenderSheet() {
    genderBackdrop.hidden = false;
    requestAnimationFrame(() => {
      genderBackdrop.classList.add('show');
      genderSheet.classList.add('open');
      genderSheet.setAttribute('aria-hidden', 'false');
    });
  }

  function closeGenderSheet() {
    genderBackdrop.classList.remove('show');
    genderSheet.classList.remove('open');
    genderSheet.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => {
      genderBackdrop.hidden = true;
    }, 220);
  }

  function applyProfile(profile) {
    state.profile = profile;
    nameInput.value = profile.name || '';
    bioInput.value = profile.bio || '';
    genderValue.textContent = profile.gender || 'Pilih jenis kelamin';
    birthdayInput.value = profile.birthday || '';
    phoneInput.value = profile.phone || '';
    maskedEmail.textContent = maskEmail(profile.email || auth.email);
    verificationBadge.textContent = profile.verified ? '✓ Terverifikasi' : 'Verifikasi';
    verificationBadge.classList.toggle('verified', Boolean(profile.verified));
    profileHeaderName.textContent = profile.name || 'Bloomelle User';
    updateGenderSelection(profile.gender || 'Pilih jenis kelamin');
    setAvatar(profile.avatar || avatarUrl(profile.name));
    syncBioCount();
  }

  function sanitizePhoneInput() {
    phoneInput.value = phoneInput.value.replace(/[^0-9]/g, '').slice(0, 13);
  }

  function validateAndSave() {
    const phone = phoneInput.value.replace(/\D/g, '');
    if (phoneInput.value && !/^[0-9]+$/.test(phoneInput.value)) {
      showToast('Nomor handphone hanya boleh angka');
      phoneInput.focus();
      return;
    }

    const profile = {
      name: nameInput.value.trim() || defaultProfile.name,
      bio: bioInput.value.trim().slice(0, 150),
      gender: state.selectedGender || 'Pilih jenis kelamin',
      birthday: birthdayInput.value,
      phone,
      email: auth.email || defaultProfile.email,
      verified: true,
      avatar: state.avatarData || avatarUrl(nameInput.value.trim() || defaultProfile.name)
    };

    saveStoredProfile(profile);
    applyProfile(profile);
    alert('Profil berhasil diperbarui!');
  }

  avatarButton.addEventListener('click', () => avatarInput.click());
  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files && avatarInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const result = String(event.target?.result || '');
      if (result) {
        setAvatar(result);
      }
    };
    reader.readAsDataURL(file);
  });

  bioInput.addEventListener('input', syncBioCount);
  nameInput.addEventListener('input', () => {
    if (!state.avatarData) {
      setAvatar(avatarUrl(nameInput.value));
    }
  });
  phoneInput.addEventListener('input', sanitizePhoneInput);
  genderButton.addEventListener('click', openGenderSheet);
  genderBackdrop.addEventListener('click', closeGenderSheet);
  sheetCloseButton.addEventListener('click', closeGenderSheet);

  sheetOptions.forEach(option => {
    option.addEventListener('click', () => updateGenderSelection(option.dataset.gender || 'Pilih jenis kelamin'));
  });

  sheetConfirmButton.addEventListener('click', () => {
    genderValue.textContent = state.selectedGender || 'Pilih jenis kelamin';
    closeGenderSheet();
  });

  saveButton.addEventListener('click', validateAndSave);

  const storedProfile = getStoredProfile();
  applyProfile(storedProfile);
  renderOrders(getStoredOrders());
  if (!storedProfile.gender) {
    updateGenderSelection('Pilih jenis kelamin');
  }
});