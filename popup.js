// popup.js
// Handles the popup interface for creating Trello tasks

class TrelloTaskCreator {
    constructor() {
        this.apiKey = '';
        this.token = '';
        this.boards = [];
        this.selectedBoard = null;
        this.lists = [];
        this.selectedList = null;
        
        this.init();
    }
    
    async init() {
        await this.loadConfig();
        this.setupEventListeners();
        
        if (this.apiKey && this.token) {
            await this.loadBoards();
            this.showTaskForm();
            await this.prefillTaskForm();
        } else {
            this.showConfigNeeded();
        }
    }
    
    async loadConfig() {
        try {
            const result = await browser.storage.sync.get(['trelloApiKey', 'trelloToken']);
            this.apiKey = result.trelloApiKey || '';
            this.token = result.trelloToken || '';
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }
    
    setupEventListeners() {
        // Board selection
        document.getElementById('board-select').addEventListener('change', (e) => {
            this.onBoardChange(e.target.value);
        });
        
        // Create task button
        document.getElementById('create-task').addEventListener('click', () => {
            this.createTask();
        });
        
        // Settings links
        document.getElementById('open-options').addEventListener('click', (e) => {
            e.preventDefault();
            this.openOptions();
        });
        
        document.getElementById('open-options-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.openOptions();
        });
    }
    
    showConfigNeeded() {
        document.getElementById('config-needed').style.display = 'block';
        document.getElementById('task-form').style.display = 'none';
    }
    
    showTaskForm() {
        document.getElementById('config-needed').style.display = 'none';
        document.getElementById('task-form').style.display = 'block';
    }
    
    async loadBoards() {
        try {
            const response = await fetch(
                `https://api.trello.com/1/members/me/boards?key=${this.apiKey}&token=${this.token}`
            );
            
            if (!response.ok) {
                throw new Error('Failed to load boards');
            }
            
            this.boards = await response.json();
            this.populateBoardSelect();
        } catch (error) {
            console.error('Error loading boards:', error);
            this.showMessage('Error loading boards. Please check your API credentials.', 'error');
        }
    }
    
    populateBoardSelect() {
        const boardSelect = document.getElementById('board-select');
        boardSelect.innerHTML = '<option value="">Select a board</option>';
        
        this.boards.forEach(board => {
            const option = document.createElement('option');
            option.value = board.id;
            option.textContent = board.name;
            boardSelect.appendChild(option);
        });
    }
    
    async onBoardChange(boardId) {
        if (!boardId) {
            this.selectedBoard = null;
            this.lists = [];
            this.populateListSelect();
            return;
        }
        
        this.selectedBoard = this.boards.find(board => board.id === boardId);
        await this.loadLists(boardId);
    }
    
    async loadLists(boardId) {
        try {
            const response = await fetch(
                `https://api.trello.com/1/boards/${boardId}/lists?key=${this.apiKey}&token=${this.token}`
            );
            
            if (!response.ok) {
                throw new Error('Failed to load lists');
            }
            
            this.lists = await response.json();
            this.populateListSelect();
        } catch (error) {
            console.error('Error loading lists:', error);
            this.showMessage('Error loading lists.', 'error');
        }
    }
    
    populateListSelect() {
        const listSelect = document.getElementById('list-select');
        listSelect.innerHTML = '<option value="">Select a list</option>';
        
        this.lists.forEach(list => {
            const option = document.createElement('option');
            option.value = list.id;
            option.textContent = list.name;
            listSelect.appendChild(option);
        });
    }
    
    async createTask() {
        const boardId = document.getElementById('board-select').value;
        const listId = document.getElementById('list-select').value;
        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-description').value.trim();
        
        if (!boardId || !listId || !title) {
            this.showMessage('Please fill in all required fields.', 'error');
            return;
        }
        
        try {
            const button = document.getElementById('create-task');
            button.disabled = true;
            button.textContent = 'Creating...';
            
            const response = await fetch(
                `https://api.trello.com/1/cards?key=${this.apiKey}&token=${this.token}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: title,
                        desc: description,
                        idList: listId
                    })
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to create task');
            }
            
            await response.json(); // Task created successfully
            this.showMessage('Task created successfully!', 'success');
            
            // Clear form
            document.getElementById('task-title').value = '';
            document.getElementById('task-description').value = '';
            
        } catch (error) {
            console.error('Error creating task:', error);
            this.showMessage('Error creating task. Please try again.', 'error');
        } finally {
            const button = document.getElementById('create-task');
            button.disabled = false;
            button.textContent = 'Create Task';
        }
    }
    
    showMessage(message, type) {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = message;
        messageDiv.className = type;
        
        // Clear message after 5 seconds
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = '';
        }, 5000);
    }
    
    openOptions() {
        browser.runtime.openOptionsPage();
        window.close();
    }

    async prefillTaskForm() {
        try {
            const message = await browser.runtime.sendMessage({ command: "get_current_message" });

            if (message && message.subject) {
                document.getElementById('task-title').value = message.subject;
            }
            if (message && message.body) {
                document.getElementById('task-description').value = message.body;
            }
        } catch (e) {
            console.error(`Error pre-filling task form: ${e}`);
            // This is not a critical error, so we just log it.
        }
    }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TrelloTaskCreator();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TrelloTaskCreator };
}
