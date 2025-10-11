// checksus.js
console.log("Background service worker loaded");

export function createDetectionNotification(result) {
    const message =
        result === 'blacklist'
            ? 'Suspicious site detected!'
            : 'Safe site detected';

    chrome.notifications.create('suspicious-url-notif', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Phish Alert',
        message: message,
        buttons: [{ title: 'Open PhishTank' }],
        priority: 2
    });
}

export async function sendUrlToBackend(url) {
    try {
        const response = await fetch('http://127.0.0.1:8000/check_url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const data = await response.json();
        return data.classification; // "whitelist" or "blacklist"
    } catch (error) {
        console.error('Backend request failed:', error);
        return 'unknown';
    }
}

export function storeSuspiciousUrl(url) {
    chrome.storage.local.set({ 'suspiciousUrl': url, 'threatDetected': true });
}

// this function now checks the url's domain against the blacklist
// export function isUrlSuspicious(url) {
    
// }

// function to save the suspicious url for the popup
// export function storeSuspiciousUrl(url) {
//     chrome.storage.local.set({ 'suspiciousUrl': url, 'threatDetected': true });
// }

// function to create the chrome toast notification
// export function createDetectionNotification() {
//     chrome.notifications.create('suspicious-url-notif', {
//         type: 'basic',
//         iconUrl: 'icons/icon128.png',
//         title: 'Phish Alert',
//         message: 'A new URL was detected and logged.',
//         priority: 2,
//         buttons: [{ title: 'Open PhishTank to review' }]
//     });
// }