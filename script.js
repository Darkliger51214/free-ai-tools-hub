const searchInput = document.getElementById('toolSearch');
const filterButtons = document.querySelectorAll('.filter-btn');
const toolCards = document.querySelectorAll('.tool-card');
const visitorCountEl = document.getElementById('visitorCount');
const visitorStatusEl = document.getElementById('visitorStatus');

let activeFilter = 'all';

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();

  toolCards.forEach((card) => {
    const category = card.dataset.category;
    const name = card.dataset.name;
    const matchesFilter = activeFilter === 'all'
      || category === activeFilter
      || (activeFilter === 'china' && card.dataset.region === 'china');
    const matchesSearch = !query || name.includes(query) || card.textContent.toLowerCase().includes(query);

    card.classList.toggle('hidden', !(matchesFilter && matchesSearch));
  });
}

async function updateVisitorCount() {
  const config = window.SUPABASE_CONFIG;
  if (!visitorCountEl || !visitorStatusEl) return;

  if (!config?.url || !config?.anonKey) {
    visitorStatusEl.textContent = 'Add your Supabase URL and anon key to supabase-config.js.';
    return;
  }

  try {
    const storageKey = 'ai-tools-visitor-session';
    let visitorId = sessionStorage.getItem(storageKey);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      sessionStorage.setItem(storageKey, visitorId);
    }

    const response = await fetch(`${config.url.replace(/\/$/, '')}/rest/v1/rpc/record_site_visit`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_visitor_id: visitorId }),
    });

    if (!response.ok) {
      throw new Error(`Supabase returned HTTP ${response.status}.`);
    }

    const count = Number(await response.json());
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error('Supabase returned an invalid visit count.');
    }

    visitorCountEl.textContent = new Intl.NumberFormat().format(count);
    visitorStatusEl.textContent = 'Live count from Supabase';
  } catch (error) {
    console.error('Unable to load the Supabase visitor count:', error);
    visitorStatusEl.textContent = 'Visitor count is unavailable. Check the Supabase setup and try again.';
  }
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    activeFilter = button.dataset.filter;
    applyFilters();
  });
});

if (searchInput) {
  searchInput.addEventListener('input', applyFilters);
}

updateVisitorCount();
