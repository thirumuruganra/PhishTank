// background.js

import { createDetectionNotification } from './checksus.js';
import { sendUrlToBackend } from './checksus.js';
import { storeSuspiciousUrl } from './checksus.js';
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const newUrl = changeInfo.url;
    
    // Skip internal browser URLs and whitelisted domains
    if (newUrl.startsWith('chrome://') || 
        newUrl.startsWith('about:') || 
        newUrl.startsWith('edge://') ||
        newUrl.startsWith('chrome-extension://') ||
        newUrl.startsWith('https://mail.google.com')) {
      console.log(`Skipping internal/whitelisted URL: ${newUrl}`);
      return;
    }
    
    console.log(`URL DETECTED & STORED: ${newUrl}`);
    const result = await sendUrlToBackend(newUrl);
    console.log(`URL: ${newUrl} classified as ${result}`);
    chrome.storage.local.set({ [newUrl]: result });
    createDetectionNotification(result);
  }
});
// this listener now just detects and stores threats
// chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
//     if (changeInfo.url) {
//         const newUrl = changeInfo.url;
        
//         // for this test, we'll log every url
//         console.log(`URL DETECTED & STORED: ${newUrl}`);
        
//         // store the url with a status of 'suspicious'
//         // using the url itself as the key is a more robust pattern
//         chrome.storage.local.set({ [newUrl]: 'suspicious' });

//         createDetectionNotification();
//     }
// });

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