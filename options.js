// options.js
// Handles the options/settings page functionality

class OptionsManager {
    constructor() {
        this.init();
    }
    
    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.updateTokenUrl();
    }
    
    async loadSettings() {
        try {
            const result = await browser.storage.sync.get(['trelloApiKey', 'trelloToken']);
            
            if (result.trelloApiKey) {
                document.getElementById('api-key').value = result.trelloApiKey;
            }
            
            if (result.trelloToken) {
                document.getElementById('token').value = result.trelloToken;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    setupEventListeners() {
        // Form submission
        document.getElementById('settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });
        
        // Test connection button
        document.getElementById('test-connection').addEventListener('click', () => {
            this.testConnection();
        });
        
        // API key input change - update token URL
        document.getElementById('api-key').addEventListener('input', () => {
            this.updateTokenUrl();
        });
    }
    
    updateTokenUrl() {
        const apiKey = document.getElementById('api-key').value.trim();
        const tokenUrlDisplay = document.getElementById('token-url-display');
        const tokenUrlDiv = document.getElementById('token-url');
        
        if (apiKey) {
            const tokenUrl = `https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=Thunderbird%20Extension&key=${apiKey}`;
            // Remove previous content
            tokenUrlDiv.textContent = '';
            // Create anchor safely
            const a = document.createElement('a');
            a.href = tokenUrl;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = tokenUrl;
            tokenUrlDiv.appendChild(a);
            tokenUrlDisplay.style.display = 'block';
        } else {
            tokenUrlDisplay.style.display = 'none';
        }
    }
    
    async saveSettings() {
        const apiKey = document.getElementById('api-key').value.trim();
        const token = document.getElementById('token').value.trim();
        
        if (!apiKey || !token) {
            this.showMessage('Please enter both API key and token.', 'error');
            return;
        }
        
        try {
            await browser.storage.sync.set({
                trelloApiKey: apiKey,
                trelloToken: token
            });
            
            this.showMessage('Settings saved successfully!', 'success');
            
            // Also test the connection after saving
            setTimeout(() => {
                this.testConnection();
            }, 1000);
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showMessage('Error saving settings. Please try again.', 'error');
        }
    }
    
    async testConnection() {
        const apiKey = document.getElementById('api-key').value.trim();
        const token = document.getElementById('token').value.trim();
        
        if (!apiKey || !token) {
            this.showMessage('Please enter both API key and token first.', 'error');
            return;
        }
        
        const testButton = document.getElementById('test-connection');
        const originalText = testButton.textContent;
        
        try {
            testButton.disabled = true;
            testButton.textContent = 'Testing...';
            
            const response = await fetch(
                `https://api.trello.com/1/members/me?key=${apiKey}&token=${token}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const userData = await response.json();
            this.showMessage(
                `Connection successful! Connected as: ${userData.fullName || userData.username}`,
                'success'
            );
            
        } catch (error) {
            console.error('Connection test failed:', error);
            
            let errorMessage = 'Connection failed. ';
            if (error.message.includes('401')) {
                errorMessage += 'Invalid API credentials.';
            } else if (error.message.includes('403')) {
                errorMessage += 'Access denied. Check your token permissions.';
            } else if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
                errorMessage += 'Network error. Check your internet connection.';
            } else {
                errorMessage += error.message;
            }
            
            this.showMessage(errorMessage, 'error');
            
        } finally {
            testButton.disabled = false;
            testButton.textContent = originalText;
        }
    }
    
    showMessage(message, type) {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (messageDiv.className.includes('success')) {
                    messageDiv.style.display = 'none';
                }
            }, 5000);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OptionsManager();
});
