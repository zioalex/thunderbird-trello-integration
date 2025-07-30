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
            console.log('Created new label:', newLabel);
            
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

            console.log('Requesting current message from background script...');
            const message = await browser.runtime.sendMessage({ command: 'get_current_message' });
            console.log('Received message from background:', message);

            if (message && message.subject) {
                console.log('Setting title to:', message.subject);
                document.getElementById('task-title').value = message.subject;
            } else {
                console.log('No subject found in message');
            }
            
            if (message && message.body) {
                console.log('Setting description to body, length:', message.body.length);
                document.getElementById('task-description').value = message.body;
            } else {
                console.log('No body found in message');
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

// Export for testing
/* global module */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TrelloTaskCreator };
}
