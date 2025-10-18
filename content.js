// Content script for SmartQuiz Chrome Extension
// This script runs on all web pages and can interact with page content

(function() {
    'use strict';
    
    // Avoid multiple injections
    if (window.smartQuizInjected) {
        return;
    }
    window.smartQuizInjected = true;
    
    class SmartQuizContentScript {
        constructor() {
            this.isActive = false;
            this.selectedText = '';
            this.pageContent = '';
            
            this.init();
        }
        
        init() {
            this.setupMessageListener();
            this.setupTextSelection();
            this.analyzePageContent();
        }
        
        setupMessageListener() {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                switch (message.action) {
                    case 'analyzePageForQuiz':
                        this.analyzePageForQuiz(message)
                            .then(result => sendResponse(result))
                            .catch(error => sendResponse({ error: error.message }));
                        return true; // Keep message channel open
                        
                    case 'getSelectedText':
                        sendResponse({ text: this.getSelectedText() });
                        break;
                        
                    case 'highlightQuizTerms':
                        this.highlightQuizTerms(message.terms);
                        sendResponse({ success: true });
                        break;
                        
                    case 'showQuizNotification':
                        this.showQuizNotification(message.data);
                        sendResponse({ success: true });
                        break;
                        
                    default:
                        console.log('Unknown content script message:', message.action);
                }
            });
        }
        
        setupTextSelection() {
            document.addEventListener('mouseup', () => {
                const selectedText = this.getSelectedText();
                if (selectedText && selectedText.length > 10) {
                    this.selectedText = selectedText;
                    // Could show a small tooltip or button to create quiz from selection
                    this.showQuizFromSelectionOption();
                }
            });
        }
        
        getSelectedText() {
            return window.getSelection().toString().trim();
        }
        
        showQuizFromSelectionOption() {
            // Remove any existing quiz buttons
            this.removeQuizButtons();
            
            const selection = window.getSelection();
            if (selection.rangeCount === 0) return;
            
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Create a small button near the selection
            const button = document.createElement('button');
            button.id = 'smart-quiz-selection-btn';
            button.innerHTML = '🧠 Quiz';
            button.style.cssText = `
                position: fixed;
                top: ${rect.bottom + window.scrollY + 5}px;
                left: ${rect.left + window.scrollX}px;
                z-index: 10000;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 5px 10px;
                font-size: 12px;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            `;
            
            button.addEventListener('click', () => {
                this.createQuizFromSelection(this.selectedText);
                this.removeQuizButtons();
            });
            
            document.body.appendChild(button);
            
            // Auto-remove after 3 seconds
            setTimeout(() => this.removeQuizButtons(), 3000);
        }
        
        removeQuizButtons() {
            const existing = document.getElementById('smart-quiz-selection-btn');
            if (existing) {
                existing.remove();
            }
        }
        
        createQuizFromSelection(text) {
            // Send the selected text to the background script for quiz generation
            chrome.runtime.sendMessage({
                action: 'createQuizFromText',
                text: text,
                pageUrl: window.location.href,
                pageTitle: document.title
            });
            
            // Show a notification that quiz is being created
            this.showNotification('Creating quiz from selected text...', 'info');
        }
        
        async analyzePageContent() {
            try {
                // Extract main content from the page
                const content = this.extractMainContent();
                this.pageContent = content;
                
                // Send page analysis to background script
                chrome.runtime.sendMessage({
                    action: 'pageAnalysis',
                    data: {
                        url: window.location.href,
                        title: document.title,
                        content: content.substring(0, 1000), // Limit content size
                        keywords: this.extractKeywords(content),
                        language: document.documentElement.lang || 'en'
                    }
                });
            } catch (error) {
                console.error('Error analyzing page content:', error);
            }
        }
        
        extractMainContent() {
            // Try to find main content areas
            const selectors = [
                'main',
                'article',
                '[role="main"]',
                '.main-content',
                '.content',
                '#content',
                '.post-content',
                '.entry-content'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    return this.cleanText(element.textContent);
                }
            }
            
            // Fallback to body content
            return this.cleanText(document.body.textContent);
        }
        
        cleanText(text) {
            return text
                .replace(/\s+/g, ' ')
                .replace(/\n+/g, ' ')
                .trim()
                .substring(0, 2000); // Limit length
        }
        
        extractKeywords(text) {
            // Simple keyword extraction
            const words = text.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 3);
            
            const wordCount = {};
            words.forEach(word => {
                wordCount[word] = (wordCount[word] || 0) + 1;
            });
            
            // Return top 10 most frequent words
            return Object.entries(wordCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([word]) => word);
        }
        
        async analyzePageForQuiz(message) {
            try {
                const analysis = {
                    url: window.location.href,
                    title: document.title,
                    content: this.pageContent,
                    keywords: this.extractKeywords(this.pageContent),
                    selectedText: this.selectedText,
                    links: Array.from(document.querySelectorAll('a[href]'))
                        .map(a => ({ text: a.textContent.trim(), href: a.href }))
                        .slice(0, 10),
                    headings: Array.from(document.querySelectorAll('h1, h2, h3'))
                        .map(h => h.textContent.trim())
                        .slice(0, 5)
                };
                
                return { success: true, analysis };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }
        
        highlightQuizTerms(terms) {
            if (!terms || terms.length === 0) return;
            
            // Remove existing highlights
            document.querySelectorAll('.smart-quiz-highlight').forEach(el => {
                el.outerHTML = el.innerHTML;
            });
            
            // Highlight new terms
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            const textNodes = [];
            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }
            
            textNodes.forEach(textNode => {
                let text = textNode.textContent;
                let modified = false;
                
                terms.forEach(term => {
                    const regex = new RegExp(`\\b${term}\\b`, 'gi');
                    if (regex.test(text)) {
                        text = text.replace(regex, `<span class="smart-quiz-highlight" style="background: #ffeb3b; padding: 1px 2px; border-radius: 2px;">$&</span>`);
                        modified = true;
                    }
                });
                
                if (modified) {
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = text;
                    while (wrapper.firstChild) {
                        textNode.parentNode.insertBefore(wrapper.firstChild, textNode);
                    }
                    textNode.parentNode.removeChild(textNode);
                }
            });
        }
        
        showQuizNotification(data) {
            // Create notification element
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10001;
                background: #333;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                max-width: 300px;
                cursor: pointer;
            `;
            
            notification.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px;">🧠 SmartQuiz</div>
                <div>${data.message}</div>
            `;
            
            notification.addEventListener('click', () => {
                if (data.action === 'openQuiz') {
                    chrome.runtime.sendMessage({ action: 'openPopup' });
                }
                notification.remove();
            });
            
            document.body.appendChild(notification);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 5000);
        }
        
        showNotification(message, type = 'info') {
            const colors = {
                info: '#2196F3',
                success: '#4CAF50',
                warning: '#FF9800',
                error: '#F44336'
            };
            
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10001;
                background: ${colors[type]};
                color: white;
                padding: 10px 15px;
                border-radius: 4px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 13px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 3000);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new SmartQuizContentScript();
        });
    } else {
        new SmartQuizContentScript();
    }
    
})();