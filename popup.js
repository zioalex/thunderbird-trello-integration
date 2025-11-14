// popup.js
// Handles the popup interface for creating Trello tasks

// Cache configuration








class TrelloTaskCreator {
    static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
    static CACHE_KEYS = {
        BOARDS: 'cached_boards',
        BOARDS_TIMESTAMP: 'cached_boards_timestamp',
        LISTS: 'cached_lists_',
        LISTS_TIMESTAMP: 'cached_lists_timestamp_'
    };
    constructor() {
        this.apiKey = '';
        this.token = '';
        this.boards = [];
        this.selectedBoard = null;
        this.lists = [];
        this.selectedList = null;
        this.labels = [];
        this.lastUsedBoardId = '';
        this.lastUsedListId = '';

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
            const result = await browser.storage.sync.get([
                'trelloApiKey', 
                'trelloToken', 
                'lastUsedBoardId', 
                'lastUsedListId'
            ]);
            this.apiKey = result.trelloApiKey || '';
            this.token = result.trelloToken || '';
            this.lastUsedBoardId = result.lastUsedBoardId || '';
            this.lastUsedListId = result.lastUsedListId || '';
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }
    
    setupEventListeners() {
        // Board selection
        document.getElementById('board-select').addEventListener('change', (e) => {
            this.onBoardChange(e.target.value);
        });

        // Label selection (show/hide new label form)
        document.getElementById('label-select').addEventListener('change', (e) => {
            this.onLabelSelectionChange(e.target.value);
        });

        // Refresh boards button
        document.getElementById('refresh-boards').addEventListener('click', () => {
            this.refreshBoards();
        });

        // Quick date buttons
        document.getElementById('due-tomorrow').addEventListener('click', () => {
            this.setQuickDate(1);
        });

        document.getElementById('due-next-week').addEventListener('click', () => {
            this.setQuickDate(7);
        });

        document.getElementById('due-next-month').addEventListener('click', () => {
            this.setQuickDate(30);
        });

        document.getElementById('due-clear').addEventListener('click', () => {
            document.getElementById('task-due-date').value = '';
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

    /**
     * Set quick date by adding days to current date
     * @param {number} days - Number of days to add
     */
    setQuickDate(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);

        // Format date as YYYY-MM-DD for input[type="date"]
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;

        document.getElementById('task-due-date').value = formatted;
    }

    /**
     * Check if cached data is still valid
     * @param {number} timestamp - Cached timestamp
     * @returns {boolean} - True if cache is still valid
     */
    isCacheValid(timestamp) {
        if (!timestamp) return false;
        const now = Date.now();
        return (now - timestamp) < TrelloTaskCreator.CACHE_DURATION;
    }

    /**
     * Get boards from cache or API
     * @param {boolean} forceRefresh - Force fetch from API even if cache is valid
     * @returns {Promise<boolean>} - Returns true on success, false on failure
     */
    async loadBoards(forceRefresh = false) {
        try {
            // Try to load from cache first
            if (!forceRefresh) {
                const cachedData = await browser.storage.local.get([
                    TrelloTaskCreator.CACHE_KEYS.BOARDS,
                    TrelloTaskCreator.CACHE_KEYS.BOARDS_TIMESTAMP
                ]);

                if (cachedData[TrelloTaskCreator.CACHE_KEYS.BOARDS] &&
                    this.isCacheValid(cachedData[TrelloTaskCreator.CACHE_KEYS.BOARDS_TIMESTAMP])) {
                    this.boards = cachedData[TrelloTaskCreator.CACHE_KEYS.BOARDS];
                    this.populateBoardSelect();
                    return true;
                }
            }

            // Fetch from API if cache is invalid or force refresh
            const response = await fetch(
                `https://api.trello.com/1/members/me/boards?key=${this.apiKey}&token=${this.token}`
            );

            if (!response.ok) {
                throw new Error('Failed to load boards');
            }

            this.boards = await response.json();

            // Cache the boards data
            await browser.storage.local.set({
                [TrelloTaskCreator.CACHE_KEYS.BOARDS]: this.boards,
                [TrelloTaskCreator.CACHE_KEYS.BOARDS_TIMESTAMP]: Date.now()
            });

            this.populateBoardSelect();
            return true;
        } catch (error) {
            console.error('Error loading boards:', error);
            this.showMessage('Error loading boards. Please check your API credentials.', 'error');
            return false;
        }
    }

    /**
     * Refresh boards by forcing a fetch from API
     */
    async refreshBoards() {
        const refreshBtn = document.getElementById('refresh-boards');
        refreshBtn.disabled = true;
        refreshBtn.classList.add('spinning');

        try {
            const success = await this.loadBoards(true);
            if (success) {
                this.showMessage('Boards refreshed successfully!', 'success');
            }
        } finally {
            refreshBtn.disabled = false;
            refreshBtn.classList.remove('spinning');
        }
    }
    
    populateBoardSelect() {
        const boardSelect = document.getElementById('board-select');
        boardSelect.innerHTML = '<option value="">Select a board</option>';
        
        this.boards.forEach(board => {
            const option = document.createElement('option');
            option.value = board.id;
            option.textContent = board.name;
            
            // Pre-select the last used board if it matches
            if (this.lastUsedBoardId && board.id === this.lastUsedBoardId) {
                option.selected = true;
            }
            
            boardSelect.appendChild(option);
        });
        
        // If we have a pre-selected board, load its lists
        if (this.lastUsedBoardId && boardSelect.value === this.lastUsedBoardId) {
            this.onBoardChange(this.lastUsedBoardId);
        }
    }
    
    async onBoardChange(boardId) {
        if (!boardId) {
            this.selectedBoard = null;
            this.lists = [];
            this.populateListSelect();
            return;
        }
        
        this.selectedBoard = this.boards.find(board => board.id === boardId);
        await Promise.all([
            this.loadLists(boardId),
            this.loadLabels(boardId)
        ]);
    }
    
    /**
     * Get lists for a board from cache or API
     * @param {string} boardId - The board ID
     * @param {boolean} forceRefresh - Force fetch from API even if cache is valid
     */
    async loadLists(boardId, forceRefresh = false) {
        try {
            const cacheKey = TrelloTaskCreator.CACHE_KEYS.LISTS + boardId;
            const timestampKey = TrelloTaskCreator.CACHE_KEYS.LISTS_TIMESTAMP + boardId;

            // Try to load from cache first
            if (!forceRefresh) {
                const cachedData = await browser.storage.local.get([cacheKey, timestampKey]);

                if (cachedData[cacheKey] && this.isCacheValid(cachedData[timestampKey])) {
                    this.lists = cachedData[cacheKey];
                    this.populateListSelect();
                    return;
                }
            }

            // Fetch from API if cache is invalid or force refresh
            const response = await fetch(
                `https://api.trello.com/1/boards/${boardId}/lists?key=${this.apiKey}&token=${this.token}`
            );

            if (!response.ok) {
                throw new Error('Failed to load lists');
            }

            this.lists = await response.json();

            // Cache the lists data
            await browser.storage.local.set({
                [cacheKey]: this.lists,
                [timestampKey]: Date.now()
            });

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
            
            // Pre-select the last used list if it matches
            if (this.lastUsedListId && list.id === this.lastUsedListId) {
                option.selected = true;
            }
            
            listSelect.appendChild(option);
        });
    }
    
    async loadLabels(boardId) {
        try {
            const response = await fetch(
                `https://api.trello.com/1/boards/${boardId}/labels?key=${this.apiKey}&token=${this.token}`
            );
            
            if (!response.ok) {
                throw new Error('Failed to load labels');
            }
            
            this.labels = await response.json();
            this.populateLabelSelect();
        } catch (error) {
            console.error('Error loading labels:', error);
            // Labels are optional, don't show error to user
            this.labels = [];
            this.populateLabelSelect();
        }
    }
    
    populateLabelSelect() {
        const labelSelect = document.getElementById('label-select');
        labelSelect.innerHTML = '<option value="">No label</option>';
        
        this.labels.forEach(label => {
            // Only show labels that have a name or color
            if (label.name || label.color) {
                const option = document.createElement('option');
                option.value = label.id;
                option.textContent = label.name || `${label.color} label`;
                labelSelect.appendChild(option);
            }
        });
        
        // Add the "Create new label" option
        const createNewOption = document.createElement('option');
        createNewOption.value = 'create-new';
        createNewOption.textContent = '+ Create new label';
        labelSelect.appendChild(createNewOption);
    }
    
    onLabelSelectionChange(value) {
        const newLabelGroup = document.getElementById('new-label-group');
        
        if (value === 'create-new') {
            newLabelGroup.style.display = 'block';
        } else {
            newLabelGroup.style.display = 'none';
        }
    }
    
    async createTask() {
        const boardId = document.getElementById('board-select').value;
        const listId = document.getElementById('list-select').value;
        const labelId = document.getElementById('label-select').value;
        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-description').value.trim();
        
        if (!boardId || !listId || !title) {
            this.showMessage('Please fill in all required fields.', 'error');
            return;
        }
        
        // If creating a new label, validate the new label form
        if (labelId === 'create-new') {
            const newLabelName = document.getElementById('new-label-name').value.trim();
            if (!newLabelName) {
                this.showMessage('Please enter a name for the new label.', 'error');
                return;
            }
        }
        
        try {
            const button = document.getElementById('create-task');
            button.disabled = true;
            button.textContent = 'Creating...';
            
            let userLabelId = null;
            
            // Handle new label creation
            if (labelId === 'create-new') {
                const newLabelName = document.getElementById('new-label-name').value.trim();
                const newLabelColor = document.getElementById('new-label-color').value;
                
                userLabelId = await this.createNewLabel(boardId, newLabelName, newLabelColor);
                if (!userLabelId) {
                    throw new Error('Failed to create new label');
                }
            } else if (labelId) {
                userLabelId = labelId;
            }
            
            // Create the card
            const cardPayload = {
                name: title,
                desc: description,
                idList: listId
            };

            // Add user's label if selected
            if (userLabelId) {
                cardPayload.idLabels = [userLabelId];
            }

            // Add due date if selected
            const dueDate = document.getElementById('task-due-date').value;
            if (dueDate) {
                // Convert YYYY-MM-DD to ISO 8601 format (with time set to end of day)
                const dueDateObj = new Date(dueDate + 'T23:59:59Z');
                cardPayload.due = dueDateObj.toISOString();
            }
            
            const response = await fetch(
                `https://api.trello.com/1/cards?key=${this.apiKey}&token=${this.token}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(cardPayload)
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to create task');
            }
            
            const createdCard = await response.json();
            
            // Add "thunderbird-email" label to identify cards created from emails
            // This will be added in addition to any user-selected label
            await this.addThunderbirdLabel(createdCard.id, boardId);
            
            this.showMessage('Task created successfully!', 'success');
            
            // Save the current board and list selection for next time
            await this.saveLastUsedSelection(boardId, listId);
            
            // Clear form
            document.getElementById('task-title').value = '';
            document.getElementById('task-description').value = '';
            document.getElementById('task-due-date').value = '';
            document.getElementById('label-select').value = '';
            document.getElementById('new-label-name').value = '';
            document.getElementById('new-label-group').style.display = 'none';
            
        } catch (error) {
            console.error('Error creating task:', error);
            this.showMessage('Error creating task. Please try again.', 'error');
        } finally {
            const button = document.getElementById('create-task');
            button.disabled = false;
            button.textContent = 'Create Task';
        }
    }
    
    async createNewLabel(boardId, name, color) {
        try {
            const response = await fetch(
                `https://api.trello.com/1/boards/${boardId}/labels?key=${this.apiKey}&token=${this.token}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        color: color
                    })
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to create label');
            }
            
            const newLabel = await response.json();
            
            // Add the new label to our local labels array for future reference
            this.labels.push(newLabel);
            
            return newLabel.id;
        } catch (error) {
            console.error('Error creating new label:', error);
            return null;
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
            // Add a small delay to give background script time to initialize
            await new Promise(resolve => setTimeout(resolve, 100));

            const message = await browser.runtime.sendMessage({ command: 'get_current_message' });

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

    async saveLastUsedSelection(boardId, listId) {
        try {
            await browser.storage.sync.set({
                lastUsedBoardId: boardId,
                lastUsedListId: listId
            });
            
            // Update instance variables for immediate use
            this.lastUsedBoardId = boardId;
            this.lastUsedListId = listId;
        } catch (error) {
            console.error('Error saving last used selection:', error);
            // Not a critical error, continue execution
        }
    }
    
    async addThunderbirdLabel(cardId, boardId) {
        try {
            // First, try to find an existing "thunderbird-email" label
            let thunderbirdLabel = this.labels.find(label => 
                label.name === 'thunderbird-email' || 
                label.name === 'Thunderbird Email'
            );
            
            // If no thunderbird label exists, create one
            if (!thunderbirdLabel) {
                const createLabelResponse = await fetch(
                    `https://api.trello.com/1/boards/${boardId}/labels?key=${this.apiKey}&token=${this.token}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            name: 'thunderbird-email',
                            color: 'blue'
                        })
                    }
                );
                
                if (createLabelResponse.ok) {
                    thunderbirdLabel = await createLabelResponse.json();
                }
            }
            
            // Add the thunderbird label to the card if we have one
            if (thunderbirdLabel) {
                await fetch(
                    `https://api.trello.com/1/cards/${cardId}/idLabels?key=${this.apiKey}&token=${this.token}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            value: thunderbirdLabel.id
                        })
                    }
                );
            }
        } catch (error) {
            console.error('Error adding Thunderbird label:', error);
            // This is not a critical error, don't interrupt the flow
        }
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        new TrelloTaskCreator();
    });
}

if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = { TrelloTaskCreator };
}
