// Background script for SmartQuiz Chrome Extension

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('SmartQuiz extension installed!');
        
        // Initialize storage with default values
        chrome.storage.local.set({
            quizzesTaken: 0,
            totalScore: 0,
            bestStreak: 0,
            preferences: {
                theme: 'light',
                difficulty: 'medium',
                autoNext: false
            }
        });
        
        // Open welcome page or show notification
        chrome.tabs.create({
            url: chrome.runtime.getURL('popup.html')
        });
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // This will open the popup automatically due to default_popup in manifest
    console.log('Extension icon clicked');
});

// Context menu for quick quiz access
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'quickQuiz',
        title: 'Start Quick Quiz',
        contexts: ['selection', 'page']
    });
    
    chrome.contextMenus.create({
        id: 'quizAboutPage',
        title: 'Quiz about this page topic',
        contexts: ['page']
    });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'quickQuiz') {
        // Open popup with quick quiz
        chrome.action.openPopup();
    } else if (info.menuItemId === 'quizAboutPage') {
        // Future feature: generate quiz based on page content
        chrome.tabs.sendMessage(tab.id, {
            action: 'analyzePageForQuiz',
            pageTitle: tab.title,
            pageUrl: tab.url
        });
    }
});

// Message handling from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'getQuizData':
            // Future: fetch quiz data from external API
            sendResponse({
                success: true,
                data: 'Quiz data would be fetched here'
            });
            break;
            
        case 'saveQuizResult':
            // Save quiz results to storage
            saveQuizResult(message.data)
                .then(() => sendResponse({ success: true }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true; // Keep message channel open for async response
            
        case 'getStats':
            // Get user statistics
            getStats()
                .then(stats => sendResponse({ success: true, stats }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
            
        case 'pageAnalysis':
            // Handle page analysis from content script
            console.log('Page analysis received:', message.data);
            break;
            
        default:
            console.log('Unknown message action:', message.action);
    }
});

// Helper function to save quiz results
async function saveQuizResult(resultData) {
    try {
        const result = await chrome.storage.local.get(['quizResults', 'totalScore', 'bestStreak']);
        
        const quizResults = result.quizResults || [];
        const totalScore = result.totalScore || 0;
        const bestStreak = result.bestStreak || 0;
        
        // Add new result
        quizResults.push({
            ...resultData,
            timestamp: Date.now()
        });
        
        // Update totals
        const newTotalScore = totalScore + resultData.score;
        const newBestStreak = Math.max(bestStreak, resultData.streak || 0);
        
        // Keep only last 50 results to avoid storage bloat
        if (quizResults.length > 50) {
            quizResults.splice(0, quizResults.length - 50);
        }
        
        await chrome.storage.local.set({
            quizResults,
            totalScore: newTotalScore,
            bestStreak: newBestStreak
        });
        
        console.log('Quiz result saved successfully');
    } catch (error) {
        console.error('Error saving quiz result:', error);
        throw error;
    }
}

// Helper function to get user statistics
async function getStats() {
    try {
        const result = await chrome.storage.local.get([
            'quizzesTaken',
            'totalScore',
            'bestStreak',
            'quizResults'
        ]);
        
        const quizResults = result.quizResults || [];
        const recentResults = quizResults.slice(-10); // Last 10 quizzes
        
        return {
            quizzesTaken: result.quizzesTaken || 0,
            totalScore: result.totalScore || 0,
            bestStreak: result.bestStreak || 0,
            averageScore: quizResults.length > 0 
                ? quizResults.reduce((sum, quiz) => sum + quiz.score, 0) / quizResults.length 
                : 0,
            recentPerformance: recentResults
        };
    } catch (error) {
        console.error('Error getting stats:', error);
        throw error;
    }
}

// Alarm for daily quiz reminder (optional feature)
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'dailyQuizReminder') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'SmartQuiz Reminder',
            message: 'Time for your daily brain training! 🧠'
        });
    }
});

// Set up daily reminder (can be controlled from popup)
function setupDailyReminder() {
    chrome.alarms.create('dailyQuizReminder', {
        delayInMinutes: 1440, // 24 hours
        periodInMinutes: 1440
    });
}

// Badge text to show quiz count or achievements
function updateBadgeText(text = '') {
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
}

// Initialize badge on startup
chrome.runtime.onStartup.addListener(async () => {
    try {
        const result = await chrome.storage.local.get(['quizzesTaken']);
        const count = result.quizzesTaken || 0;
        if (count > 0) {
            updateBadgeText(count.toString());
        }
    } catch (error) {
        console.error('Error updating badge:', error);
    }
});

console.log('SmartQuiz background script loaded');