(function() {
  const THEME_KEY = 'theme-preference';
  
  function getStoredTheme() {
    return localStorage.getItem(THEME_KEY) || 'auto';
  }
  
  function setStoredTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }
  
  function isDarkHour() {
    const hour = new Date().getHours();
    return hour >= 19 || hour < 7;
  }
  
  function prefersDarkScheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  function getEffectiveTheme(preference) {
    if (preference === 'light' || preference === 'dark') {
      return preference;
    }
    if (isDarkHour() || prefersDarkScheme()) {
      return 'dark';
    }
    return 'light';
  }
  
  function applyTheme(theme) {
    const effectiveTheme = getEffectiveTheme(theme);
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    updateToggleIcon(effectiveTheme);
    updateDropdownState(theme);
  }
  
  function updateToggleIcon(effectiveTheme) {
    const icon = document.querySelector('.theme-toggle .icon');
    if (icon) {
      icon.textContent = effectiveTheme === 'dark' ? '🌙' : '☀️';
    }
  }
  
  function updateDropdownState(preference) {
    document.querySelectorAll('.theme-option').forEach(option => {
      const isActive = option.dataset.theme === preference;
      option.classList.toggle('active', isActive);
    });
  }
  
  function setTheme(theme) {
    setStoredTheme(theme);
    applyTheme(theme);
    
    fetch('/api/user/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme })
    }).catch(() => {}); 
  }
  
  function init() {
    const storedTheme = getStoredTheme();
    applyTheme(storedTheme);
    
    const toggleBtn = document.querySelector('.theme-toggle');
    const dropdown = document.querySelector('.theme-dropdown-menu');
    
    if (toggleBtn && dropdown) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });
      
      document.addEventListener('click', () => {
        dropdown.classList.remove('show');
      });
      
      document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', () => {
          const theme = option.dataset.theme;
          setTheme(theme);
          dropdown.classList.remove('show');
        });
      });
    }
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (getStoredTheme() === 'auto') {
        applyTheme('auto');
      }
    });
    
    setInterval(() => {
      if (getStoredTheme() === 'auto') {
        applyTheme('auto');
      }
    }, 60000);
  }
  
  const storedTheme = getStoredTheme();
  document.documentElement.setAttribute('data-theme', getEffectiveTheme(storedTheme));
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();