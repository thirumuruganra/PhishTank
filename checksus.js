// checksus.js

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
export function createDetectionNotification() {
    chrome.notifications.create('suspicious-url-notif', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Phish Alert',
        message: 'A new URL was detected and logged.',
        priority: 2,
        buttons: [{ title: 'Open PhishTank to review' }]
    });
}