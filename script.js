const DOM = {
  searchInput: document.getElementById('searchInput'),
  categoryFilter: null,
  eventsContainer: document.getElementById('eventsContainer'),
  eventsList: [],
  quantityBtns: document.querySelectorAll('.qty-btn'),
  totalPrice: document.getElementById('totalPrice'),
  bookingForm: document.getElementById('bookingForm'),
  fullName: document.getElementById('fullName'),
  emailInput: document.getElementById('email'),
  eventChoice: document.getElementById('eventChoice'),
  ticketCountInput: document.getElementById('ticketCount'),
  formMessage: document.getElementById('formMessage'),
  successModal: document.getElementById('successModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  modalCloseBtn: document.getElementById('modalClose'),
  menuToggle: document.querySelector('.menu-toggle'),
  mainNav: document.querySelector('.main-nav'),
  navLinks: document.querySelectorAll('.main-nav a'),
  themeToggle: document.getElementById('themeToggle'),
  headerTime: document.getElementById('headerTime'),
  currentDateTime: document.getElementById('currentDateTime'),
  scrollElements: document.querySelectorAll('.scroll-animate')
};

const state = {
  selectedEvent: null,
  currentQuantity: 1,
  basePrice: 0,
  wishlist: JSON.parse(localStorage.getItem('wishlist')) || [],
  currentTheme: localStorage.getItem('theme') || 'light',
  filteredEvents: [],
  activeFilter: 'all'
};

const eventsData = [
  { id: 1, name: 'Live Music Concert', category: 'concert', date: new Date(2026, 8, 25, 19, 30), price: 55, description: 'Experience an unforgettable night of live music.', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=80' },
  { id: 2, name: 'Movie Premiere Night', category: 'movie', date: new Date(2026, 9, 18, 20, 0), price: 40, description: 'Be first to see the most anticipated film of the year.', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80' },
  { id: 3, name: 'Championship Match', category: 'sports', date: new Date(2026, 10, 10, 18, 0), price: 65, description: 'Watch the best teams compete for the championship title.', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80' },
  { id: 4, name: 'Art Festival Workshop', category: 'concert', date: new Date(2026, 10, 30, 16, 0), price: 35, description: 'Join creative workshops at this vibrant art festival.', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80' }
];

function init() {
  initTheme();
  renderEvents(eventsData);
  setupEventListeners();
  updateDateTime();
  setInterval(updateDateTime, 1000);
  updateCountdownTimers();
  setInterval(updateCountdownTimers, 1000);
  observeScrollElements();
}

function initTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');

  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    if (DOM.themeToggle) DOM.themeToggle.textContent = '☀️';
  }

  localStorage.setItem('theme', theme);
  state.currentTheme = theme;
}

function setupEventListeners() {
  if (DOM.searchInput) {
    DOM.searchInput.addEventListener('input', handleSearch);
  }

  if (DOM.bookingForm) {
    DOM.bookingForm.addEventListener('submit', handleFormSubmit);
    if (DOM.fullName) DOM.fullName.addEventListener('blur', validateName);
    if (DOM.emailInput) DOM.emailInput.addEventListener('blur', validateEmail);
    if (DOM.eventChoice) {
      DOM.eventChoice.addEventListener('change', handleEventChoiceChange);
      DOM.eventChoice.addEventListener('blur', validateEventSelect);
    }
    if (DOM.ticketCountInput) {
      DOM.ticketCountInput.addEventListener('input', validateTicketCount);
      DOM.ticketCountInput.addEventListener('blur', validateTicketCount);
    }
  }

  if (DOM.themeToggle) {
    DOM.themeToggle.addEventListener('click', toggleTheme);
  }

  if (DOM.menuToggle) {
    DOM.menuToggle.addEventListener('click', toggleMobileMenu);
    DOM.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        DOM.menuToggle.setAttribute('aria-expanded', 'false');
        DOM.mainNav.classList.remove('open');
      });
    });
  }

  if (DOM.closeModalBtn) {
    DOM.closeModalBtn.addEventListener('click', closeSuccessModal);
  }

  if (DOM.modalCloseBtn) {
    DOM.modalCloseBtn.addEventListener('click', closeSuccessModal);
  }

  if (DOM.successModal) {
    DOM.successModal.addEventListener('click', (e) => {
      if (e.target === DOM.successModal) closeSuccessModal();
    });
  }

  document.addEventListener('click', handleDynamicEvents);
  document.addEventListener('keydown', handleKeyboard);
}

function handleDynamicEvents(e) {
  const wishlistBtn = e.target.closest('.wishlist-btn');
  if (wishlistBtn) { toggleWishlist(wishlistBtn); return; }

  const detailsBtn = e.target.closest('.details-btn');
  if (detailsBtn) { toggleEventDetails(detailsBtn); return; }

  const bookBtn = e.target.closest('.book-btn');
  if (bookBtn) { handleBookEvent(bookBtn); return; }

  const quantityBtn = e.target.closest('.qty-btn');
  if (quantityBtn) { handleQuantityChange(quantityBtn); return; }

  const filterBtn = e.target.closest('.filter-btn');
  if (filterBtn) { handleFilterButton(filterBtn); return; }
}

function handleKeyboard(e) {
  if (e.key === 'Escape' && DOM.successModal && !DOM.successModal.classList.contains('hidden')) {
    closeSuccessModal();
  }
}

function renderEvents(events) {
  if (!DOM.eventsContainer) return;

  DOM.eventsContainer.innerHTML = events.length
    ? events.map(event => createEventCard(event)).join('')
    : '<p style="text-align:center;color:var(--muted);padding:2rem 0;">No events found matching your search.</p>';

  if (DOM.eventChoice) {
    DOM.eventChoice.innerHTML = '<option value="">Choose an event</option>' +
      events.map(e => `<option value="${e.name}">${e.name}</option>`).join('');
  }

  DOM.eventsList = events;
  observeNewCards();
}

function createEventCard(event) {
  const isWishlisted = state.wishlist.includes(event.id);
  const countdown = getCountdownText(event.date);
  const formattedDate = event.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const formattedTime = event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const categoryLabel = event.category.charAt(0).toUpperCase() + event.category.slice(1);

  const delay = (event.id - 1) * 0.12;
  return `
    <article class="event-card scroll-animate" style="transition-delay:${delay}s" data-event-id="${event.id}" data-category="${event.category}" data-price="${event.price}">
      <div class="event-image-container">
        <img src="${event.image}" alt="${event.name}" class="event-img" loading="lazy">
        <button class="wishlist-btn" type="button" aria-label="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}">
          ${isWishlisted ? '❤️' : '♡'}
        </button>
        <span class="event-tag-overlay">${categoryLabel}</span>
        <div class="event-countdown" data-event-id="${event.id}">${countdown}</div>
      </div>
      <div class="event-content">
        <h3>${event.name}</h3>
        <p class="event-meta">📅 ${formattedDate} &nbsp;|&nbsp; 🕐 ${formattedTime}</p>
        <p class="event-meta">💵 $${event.price} per ticket</p>
        <div class="event-details">
          <p>${event.description}</p>
        </div>
        <div class="event-actions">
          <button class="btn btn-secondary details-btn" type="button">View Details</button>
          <button class="btn btn-primary book-btn" type="button" data-event-id="${event.id}" data-price="${event.price}">Book Ticket</button>
        </div>
      </div>
    </article>
  `;
}

function handleContactSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Sent!';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = 'Send Message';
    btn.disabled = false;
    e.target.reset();
  }, 3000);
}

function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase().trim();
  applyFilters(state.activeFilter, searchTerm);
}

function handleFilterButton(btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.activeFilter = btn.dataset.filter;
  const searchTerm = DOM.searchInput ? DOM.searchInput.value.toLowerCase().trim() : '';
  applyFilters(state.activeFilter, searchTerm);
}

function applyFilters(category, searchTerm) {
  let filtered = category === 'all' ? eventsData : eventsData.filter(e => e.category === category);
  if (searchTerm) {
    filtered = filtered.filter(e => e.name.toLowerCase().includes(searchTerm) || e.description.toLowerCase().includes(searchTerm));
  }
  renderEvents(filtered);
}

function toggleWishlist(btn) {
  const card = btn.closest('.event-card');
  const eventId = parseInt(card.dataset.eventId);
  const index = state.wishlist.indexOf(eventId);

  if (index > -1) {
    state.wishlist.splice(index, 1);
    btn.textContent = '♡';
    btn.setAttribute('aria-label', 'Add to wishlist');
  } else {
    state.wishlist.push(eventId);
    btn.textContent = '❤️';
    btn.setAttribute('aria-label', 'Remove from wishlist');
  }

  localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
}

function toggleEventDetails(btn) {
  const card = btn.closest('.event-card');
  const isShown = card.classList.toggle('show-details');
  btn.textContent = isShown ? 'Hide Details' : 'View Details';

  if (isShown) {
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function handleBookEvent(btn) {
  const eventId = parseInt(btn.dataset.eventId || btn.closest('.event-card')?.dataset.eventId);
  const event = eventsData.find(e => e.id === eventId);

  if (!event) return;

  state.selectedEvent = event;
  state.basePrice = event.price;
  state.currentQuantity = 1;

  if (DOM.eventChoice) DOM.eventChoice.value = event.name;
  if (DOM.ticketCountInput) DOM.ticketCountInput.value = 1;
  if (DOM.totalPrice) DOM.totalPrice.textContent = `$${event.price}`;

  btn.classList.add('clicked');
  setTimeout(() => btn.classList.remove('clicked'), 300);

  const bookingSection = document.querySelector('#booking');
  if (bookingSection) {
    bookingSection.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => { if (DOM.fullName) DOM.fullName.focus(); }, 600);
  }
}

function handleEventChoiceChange() {
  const selectedName = DOM.eventChoice.value;
  const event = eventsData.find(e => e.name === selectedName);

  if (event) {
    state.basePrice = event.price;
    state.selectedEvent = event;
  } else {
    state.basePrice = 0;
    state.selectedEvent = null;
  }

  state.currentQuantity = parseInt(DOM.ticketCountInput?.value) || 1;
  updatePriceDisplay();
}

function handleQuantityChange(btn) {
  const action = btn.dataset.action;
  const currentValue = parseInt(DOM.ticketCountInput.value) || 1;

  if (action === 'increase' && currentValue < 10) {
    state.currentQuantity = currentValue + 1;
  } else if (action === 'decrease' && currentValue > 1) {
    state.currentQuantity = currentValue - 1;
  }

  DOM.ticketCountInput.value = state.currentQuantity;
  updatePriceDisplay();
}

function updatePriceDisplay() {
  if (DOM.totalPrice) {
    const total = state.basePrice * state.currentQuantity;
    DOM.totalPrice.textContent = total > 0 ? `$${total}` : '$0';
  }
}

function validateName() {
  const value = DOM.fullName.value.trim();
  const isValid = value.length >= 2;
  setFieldValidity(DOM.fullName, isValid);
  return isValid;
}

function validateEmail() {
  const value = DOM.emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(value);
  setFieldValidity(DOM.emailInput, isValid);
  return isValid;
}

function validateEventSelect() {
  const isValid = DOM.eventChoice.value !== '';
  setFieldValidity(DOM.eventChoice, isValid);
  return isValid;
}

function validateTicketCount() {
  let value = parseInt(DOM.ticketCountInput.value, 10);
  if (Number.isNaN(value)) value = 1;
  if (value < 1) value = 1;
  if (value > 10) value = 10;
  DOM.ticketCountInput.value = value;
  const isValid = value >= 1 && value <= 10;
  setFieldValidity(DOM.ticketCountInput, isValid);
  state.currentQuantity = value;
  updatePriceDisplay();
  return isValid;
}

function setFieldValidity(field, isValid) {
  field.classList.toggle('input-error', !isValid);
  field.classList.toggle('input-valid', isValid);
}

function handleFormSubmit(e) {
  e.preventDefault();

  const isNameValid = validateName();
  const isEmailValid = validateEmail();
  const isEventValid = validateEventSelect();
  const isTicketValid = validateTicketCount();

  if (!isNameValid || !isEmailValid || !isEventValid || !isTicketValid) {
    if (DOM.formMessage) {
      DOM.formMessage.textContent = 'Please fill in all fields correctly before submitting.';
      DOM.formMessage.style.color = '#e74c3c';
    }
    return;
  }

  const selectedEvent = eventsData.find(e => e.name === DOM.eventChoice.value);
  const pricePerTicket = selectedEvent ? selectedEvent.price : state.basePrice;
  const qty = parseInt(DOM.ticketCountInput.value) || 1;

  const bookingData = {
    name: DOM.fullName.value.trim(),
    email: DOM.emailInput.value.trim(),
    eventName: DOM.eventChoice.value,
    ticketCount: qty,
    totalPrice: pricePerTicket * qty,
    bookingDate: new Date().toLocaleString()
  };

  localStorage.setItem('lastBooking', JSON.stringify(bookingData));
  showSuccessModal(bookingData);
  DOM.bookingForm.reset();
  state.selectedEvent = null;
  state.currentQuantity = 1;
  state.basePrice = 0;
  if (DOM.totalPrice) DOM.totalPrice.textContent = '$0';
  if (DOM.formMessage) DOM.formMessage.textContent = '';

  document.querySelectorAll('.input-valid').forEach(el => el.classList.remove('input-valid'));
}

function showSuccessModal(bookingData) {
  const message = document.getElementById('modalMessage');
  if (message) {
    message.innerHTML = `Booking confirmed for <strong>${bookingData.eventName}</strong> — ${bookingData.ticketCount} ticket(s). Total: <strong>$${bookingData.totalPrice}</strong>. A confirmation will be sent to <strong>${bookingData.email}</strong>.`;
  }
  DOM.successModal.classList.remove('hidden');
  DOM.successModal.classList.add('show');
}

function closeSuccessModal() {
  if (DOM.successModal) {
    DOM.successModal.classList.remove('show');
    DOM.successModal.classList.add('hidden');
  }
}

function getCountdownText(eventDate) {
  const now = new Date();
  const diff = eventDate - now;

  if (diff <= 0) return 'Event started';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${days}d ${hours}h ${minutes}m`;
}

function updateCountdownTimers() {
  document.querySelectorAll('.event-countdown[data-event-id]').forEach(timer => {
    const eventId = parseInt(timer.dataset.eventId);
    const event = eventsData.find(e => e.id === eventId);
    if (event) {
      timer.textContent = getCountdownText(event.date);
    }
  });
}

function updateDateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  const dateString = now.toLocaleDateString();

  if (DOM.headerTime) DOM.headerTime.textContent = `${dateString} ${timeString}`;
  if (DOM.currentDateTime) DOM.currentDateTime.textContent = `${dateString} ${timeString}`;
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  DOM.themeToggle.textContent = isDark ? '☀️' : '🌙';
  DOM.themeToggle.setAttribute('aria-pressed', String(isDark));
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  state.currentTheme = isDark ? 'dark' : 'light';
}

function toggleMobileMenu() {
  const expanded = DOM.menuToggle.getAttribute('aria-expanded') === 'true';
  DOM.menuToggle.setAttribute('aria-expanded', String(!expanded));
  DOM.mainNav.classList.toggle('open');
}

let scrollObserver = null;

function observeScrollElements() {
  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        scrollObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

  DOM.scrollElements.forEach(el => scrollObserver.observe(el));
}

function observeNewCards() {
  if (!scrollObserver) return;
  DOM.eventsContainer.querySelectorAll('.scroll-animate').forEach(el => {
    scrollObserver.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', init);
