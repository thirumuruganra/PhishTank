// background.js

import { createDetectionNotification } from './checksus.js';

// this listener now just detects and stores threats
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url && tab.active) {
        const newUrl = changeInfo.url;
        
        // for this test, we'll log every url
        console.log(`URL DETECTED & STORED: ${newUrl}`);
        
        // store the url with a status of 'suspicious'
        // using the url itself as the key is a more robust pattern
        chrome.storage.local.set({ [newUrl]: 'suspicious' });

        createDetectionNotification();
    }
});

// listeners for notification clicks remain the same
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (notificationId === 'suspicious-url-notif' && buttonIndex === 0) {
        chrome.action.openPopup();
    }
});

chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId === 'suspicious-url-notif') {
        chrome.action.openPopup();
    }
});