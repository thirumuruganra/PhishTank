/**
 * ui.js
 * * This file handles all user interface logic for the PhishTank extension.
 * * THIS VERSION INCLUDES A CORRECTLY PLACED HARD-CODED SAMPLE EMAIL.
 */

function loadAllItems() {
    chrome.storage.local.get(null, function(items) {
        // Get containers for all four lists from index.html
        const whitelistUrlList = document.getElementById('whitelist-list-url');
        const whitelistEmailList = document.getElementById('whitelist-list-email');
        const blacklistUrlList = document.getElementById('blacklist-list-url');
        const blacklistEmailList = document.getElementById('blacklist-list-email');

        // Clear all lists to prevent displaying duplicate items on refresh
        if (whitelistUrlList) whitelistUrlList.innerHTML = '';
        if (whitelistEmailList) whitelistEmailList.innerHTML = '';
        if (blacklistUrlList) blacklistUrlList.innerHTML = '';
        if (blacklistEmailList) blacklistEmailList.innerHTML = '';

        // Loop through every item saved in storage to display them
        for (const [key, value] of Object.entries(items)) {
            // Logic for URL items
            if (typeof value === 'string' && key.startsWith('http')) {
                const classification = value;
                const cardHTML = `
                    <div class="card">
                        <span class="icon ${classification === "blacklist" ? "warn-icon" : "safe-icon"}">${classification === "blacklist" ? "!" : "✔"}</span>
                        <div class="card-details">
                            <h3>${classification === "blacklist" ? "Blacklisted" : "Whitelisted"} URL</h3>
                            <p class="url">${key}</p>
                        </div>
                    </div>
                `;
                if (classification === "blacklist" && blacklistUrlList) blacklistUrlList.innerHTML += cardHTML;
                if (classification === "whitelist" && whitelistUrlList) whitelistUrlList.innerHTML += cardHTML;
            }
        }

        // ==================================================================
        // == HARD-CODED SAMPLE EMAIL FOR VISUAL DESIGN                    ==
        // This block is now INSIDE the callback, so it runs after the lists
        // are cleared and will not be erased.
        // ==================================================================
        const sampleFrom = "support-scam@paypai.co";
        const sampleSubject = "Action Required: Account Suspended";
        const sampleBody = "Please verify your details immediately to avoid permanent closure.";
        const truncatedBody = sampleBody.substring(0, 15) + '...';

        const emailCardHTML = `
            <div class="card">
                <div class="card-details">
                    <h3>Suspicious Mail</h3>
                    <p class="email-address">${sampleFrom}</p>
                    <div class="email-details-card">
                        <span class="icon warn-icon">!</span>
                        <div>
                            <span class="email-subject">${sampleSubject}</span>
                            <span class="email-body">${truncatedBody}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        // Inject the sample email card into the blacklist email list
        if (blacklistEmailList) {
            blacklistEmailList.innerHTML = emailCardHTML;
        }
        // ==================================================================
    });
}

// LISTENER FOR STORAGE CHANGES
chrome.storage.onChanged.addListener(function(changes, areaName) {
    if (areaName === "local") {
        loadAllItems();
    }
});

// MAIN EXECUTION BLOCK - RUNS WHEN THE POPUP IS OPENED
document.addEventListener('DOMContentLoaded', function () {
    loadAllItems();

    const threatsList = document.getElementById('threats-list');
    const tempAlert = document.querySelector('.temporary-alert');
    const navTabs = document.querySelectorAll('.nav-tab');
    const sliderUnderline = document.querySelector('.slider-underline');
    const contentSlider = document.querySelector('.content-slider');
    const closeAlertBtn = document.getElementById('close-alert-btn');
    const scanUrlBtn = document.getElementById('scan-url-btn');
    const scanEmailBtn = document.getElementById('scan-email-btn');

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const tab = tabs[0];
        if (tab && tab.url) {
            chrome.storage.local.get([tab.url], function(result) {
                if (result[tab.url] === 'blacklist') {
                    tempAlert.classList.remove('hidden');
                }
            });
        }
    });

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

    if (closeAlertBtn && tempAlert) {
        closeAlertBtn.addEventListener('click', () => {
            tempAlert.classList.add('hidden');
        });
    }

    if (scanUrlBtn && scanEmailBtn) {
        scanUrlBtn.addEventListener('click', () => {
            scanUrlBtn.classList.add('active');
            scanEmailBtn.classList.remove('active');
        });
        scanEmailBtn.addEventListener('click', () => {
            scanEmailBtn.classList.add('active');
            scanUrlBtn.classList.remove('active');
        });
    }

    document.getElementById('nav-btn')?.addEventListener('click', () => console.log("Nav button clicked!"));
    document.getElementById('user-btn')?.addEventListener('click', () => console.log("User button clicked!"));
    document.getElementById('settings-btn')?.addEventListener('click', () => console.log("Settings button clicked!"));
});