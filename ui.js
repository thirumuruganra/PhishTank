function loadAllClassifiedUrls() {
    chrome.storage.local.get(null, function(items) {
        // Get containers
        const threatsList = document.getElementById('threats-list');
        const whitelistList = document.getElementById('whitelist-list');
        const blacklistList = document.getElementById('blacklist-list');

        // Clear
        if (threatsList) threatsList.innerHTML = '';
        if (whitelistList) whitelistList.innerHTML = '';
        if (blacklistList) blacklistList.innerHTML = '';

        // Fill lists
        for (const [url, classification] of Object.entries(items)) {
            // Skip non-web URLs
            if (!url.startsWith('http')) continue;
            let cardHTML = `
                <div class="card">
                    <span class="icon ${classification === "blacklist" ? "warn-icon" : "safe-icon"}">${classification === "blacklist" ? "!" : "✔"}</span>
                    <div class="card-details">
                        <h3>${classification === "blacklist" ? "Blacklisted" : "Whitelisted"} URL</h3>
                        <p class="url">${url}</p>
                    </div>
                </div>
            `;
            if (classification === "blacklist" && blacklistList) blacklistList.innerHTML += cardHTML;
            if (classification === "whitelist" && whitelistList) whitelistList.innerHTML += cardHTML;
        }
    });
}

// Always refresh lists on storage change
chrome.storage.onChanged.addListener(function(changes, areaName) {
    if (areaName === "local") loadAllClassifiedUrls();
});

// Document Ready
document.addEventListener('DOMContentLoaded', function () {
    loadAllClassifiedUrls();

    const threatsList = document.getElementById('threats-list');
    const tempAlert = document.querySelector('.temporary-alert');
    const navTabs = document.querySelectorAll('.nav-tab');
    const sliderUnderline = document.querySelector('.slider-underline');
    const contentSlider = document.querySelector('.content-slider');
    const closeAlertBtn = document.getElementById('close-alert-btn');
    const scanUrlBtn = document.getElementById('scan-url-btn');
    const scanWebpageBtn = document.getElementById('scan-webpage-btn');

    // Show alert if current tab is blacklisted
    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
        const tab = tabs[0];
        if (tab && tab.url) {
            chrome.storage.local.get([tab.url], function(result) {
                if (result[tab.url] === 'blacklist') {
                    tempAlert.classList.remove('hidden');
                    const cardHTML = `
                        <div class="card">
                            <span class="icon warn-icon">!</span>
                            <div class="card-details">
                                <h3>Blacklisted URL</h3>
                                <p class="url">${tab.url}</p>
                            </div>
                        </div>
                    `;
                    threatsList.innerHTML = cardHTML;
                }
            });
        }
    });

    // Handle tab switching UI
    function updateSlider(tab) {
        const tabWidth = tab.offsetWidth;
        const tabOffsetLeft = tab.offsetLeft;
        sliderUnderline.style.width = `${tabWidth}px`;
        sliderUnderline.style.transform = `translateX(${tabOffsetLeft}px)`;
        const tabIndex = parseInt(tab.dataset.tab);
        const contentWidth = contentSlider.querySelector('.tab-content').offsetWidth;
        contentSlider.style.transform = `translateX(-${tabIndex * contentWidth}px)`;
        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    }
    const initialActiveTab = document.querySelector('.nav-tab.active');
    if (initialActiveTab) setTimeout(() => updateSlider(initialActiveTab), 0);
    navTabs.forEach(tab => {
        tab.addEventListener('click', (event) => {
            event.preventDefault();
            updateSlider(tab);
        });
    });

    // Temporary alert close
    if (closeAlertBtn && tempAlert) {
        closeAlertBtn.addEventListener('click', () => {
            tempAlert.classList.add('hidden');
        });
    }

    // Scanner toggle
    if (scanUrlBtn && scanWebpageBtn) {
        scanUrlBtn.addEventListener('click', () => {
            scanUrlBtn.classList.add('active');
            scanWebpageBtn.classList.remove('active');
        });
        scanWebpageBtn.addEventListener('click', () => {
            scanWebpageBtn.classList.add('active');
            scanUrlBtn.classList.remove('active');
        });
    }

    // Toast notification function
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Clear history functionality
    const clearAllBtn = document.getElementById('clear-all-btn');
    const clearWhitelistBtn = document.getElementById('clear-whitelist-btn');
    const clearBlacklistBtn = document.getElementById('clear-blacklist-btn');

    // Clear all history
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            chrome.storage.local.clear(() => {
                console.log('All history cleared');
                loadAllClassifiedUrls();
                showToast('All history cleared successfully!');
            });
        });
    }

    // Clear whitelist only
    if (clearWhitelistBtn) {
        clearWhitelistBtn.addEventListener('click', () => {
            chrome.storage.local.get(null, function(items) {
                const whitelistKeys = Object.keys(items).filter(key => items[key] === 'whitelist');
                chrome.storage.local.remove(whitelistKeys, () => {
                    console.log('Whitelist cleared');
                    loadAllClassifiedUrls();
                    showToast('Whitelist cleared successfully!');
                });
            });
        });
    }

    // Clear blacklist only
    if (clearBlacklistBtn) {
        clearBlacklistBtn.addEventListener('click', () => {
            chrome.storage.local.get(null, function(items) {
                const blacklistKeys = Object.keys(items).filter(key => items[key] === 'blacklist');
                chrome.storage.local.remove(blacklistKeys, () => {
                    console.log('Blacklist cleared');
                    loadAllClassifiedUrls();
                    showToast('Blacklist cleared successfully!');
                });
            });
        });
    }

    // Footer nav
    document.getElementById('nav-btn')?.addEventListener('click', () => console.log("Nav button clicked!"));
    document.getElementById('user-btn')?.addEventListener('click', () => console.log("User button clicked!"));
    document.getElementById('settings-btn')?.addEventListener('click', () => console.log("Settings button clicked!"));
});
