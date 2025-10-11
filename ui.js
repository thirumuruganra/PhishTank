document.addEventListener('DOMContentLoaded', function () {
    // variables
    const threatsList = document.getElementById('threats-list');
    const tempAlert = document.querySelector('.temporary-alert');
    const navTabs = document.querySelectorAll('.nav-tab');
    const sliderUnderline = document.querySelector('.slider-underline');
    const contentSlider = document.querySelector('.content-slider');
    const closeAlertBtn = document.getElementById('close-alert-btn');
    const scanUrlBtn = document.getElementById('scan-url-btn');
    const scanWebpageBtn = document.getElementById('scan-webpage-btn');

    async function checkCurrentTabStatus() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab && tab.url) {
            const result = await chrome.storage.local.get(tab.url);
            
            if (result[tab.url] === 'suspicious') {
                tempAlert.classList.remove('hidden');
                const cardHTML = `
                    <div class="card">
                        <span class="icon warn-icon">!</span>
                        <div class="card-details">
                            <h3>Suspicious URL</h3>
                            <p class="url">${tab.url}</p>
                        </div>
                    </div>
                `;
                threatsList.innerHTML = cardHTML;
            }
        }
    }

    checkCurrentTabStatus();

    // dynamic threat loader
    chrome.storage.local.get(['suspiciousUrl', 'threatDetected'], (result) => {
        if (result.threatDetected && result.suspiciousUrl && threatsList && tempAlert) {
            tempAlert.classList.remove('hidden');
            const url = result.suspiciousUrl;
            const cardHTML = `
                <div class="card">
                    <span class="icon warn-icon">!</span>
                    <div class="card-details">
                        <h3>Suspicious URL</h3>
                        <p class="url">${url}</p>
                    </div>
                </div>
            `;
            threatsList.innerHTML = cardHTML;
            chrome.storage.local.remove(['suspiciousUrl', 'threatDetected']);
        }
    });

    // navigation slider
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
    if (initialActiveTab) {
        setTimeout(() => updateSlider(initialActiveTab), 0);
    }
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', (event) => {
            event.preventDefault();
            updateSlider(tab);
        });
    });

    // temporary alert
    if (closeAlertBtn && tempAlert) {
        closeAlertBtn.addEventListener('click', () => {
            tempAlert.classList.add('hidden');
        });
    }

    // scanner toggle
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

    // footer buttons
    document.getElementById('nav-btn')?.addEventListener('click', () => console.log("Nav button clicked!"));
    document.getElementById('user-btn')?.addEventListener('click', () => console.log("User button clicked!"));
    document.getElementById('settings-btn')?.addEventListener('click', () => console.log("Settings button clicked!"));
});