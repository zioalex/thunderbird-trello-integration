// background.js
// Handles background tasks for the Trello Task Creator extension.

/**
 * Retrieves the subject and plain body of the currently displayed email message.
 * @returns {Promise<object|null>} A promise that resolves to an object with
 *   `subject` and `body` properties, or `null` if no message is displayed.
 */
async function getCurrentMessage() {
    try {
        // Query for the active tab in the message display window
        const tabs = await browser.tabs.query({ active: true, windowType: 'messageDisplay' });

        if (!tabs || tabs.length === 0) {
            console.log('No active message display tab found.');
            return null;
        }

        // Get the message displayed in the active tab
        const message = await browser.messageDisplay.getDisplayedMessage(tabs[0].id);
        if (!message) {
            console.log('No message displayed in the active tab.');
            return null;
        }

        // Get the plain text body of the message
        const bodyPart = await browser.messages.getPlainBody(message.id);
        const body = bodyPart ? bodyPart.value : '';

        return {
            subject: message.subject,
            body: body
        };
    } catch (error) {
        console.error('Error getting current message:', error);
        return null;
    }
}

/**
 * Fetches all Thunderbird-tagged Trello cards from user's boards
 */
async function fetchThunderbirdTasks() {
    try {
        const config = await browser.storage.sync.get(['trelloApiKey', 'trelloToken']);
        const apiKey = config.trelloApiKey;
        const token = config.trelloToken;
        
        if (!apiKey || !token) {
            console.log('No Trello credentials found for task sync');
            return [];
        }

        // Get user's boards
        const boardsResponse = await fetch(
            `https://api.trello.com/1/members/me/boards?key=${apiKey}&token=${token}`
        );
        
        if (!boardsResponse.ok) {
            throw new Error('Failed to fetch boards');
        }
        
        const boards = await boardsResponse.json();
        const allTasks = [];
        
        // For each board, get cards with Thunderbird label
        for (const board of boards) {
            try {
                // Get board labels to find Thunderbird label
                const labelsResponse = await fetch(
                    `https://api.trello.com/1/boards/${board.id}/labels?key=${apiKey}&token=${token}`
                );
                
                if (!labelsResponse.ok) continue;
                
                const labels = await labelsResponse.json();
                const thunderbirdLabel = labels.find(label => 
                    label.name && label.name.toLowerCase() === 'thunderbird'
                );
                
                if (!thunderbirdLabel) continue;
                
                // Get cards with the Thunderbird label
                const cardsResponse = await fetch(
                    `https://api.trello.com/1/boards/${board.id}/cards?key=${apiKey}&token=${token}`
                );
                
                if (!cardsResponse.ok) continue;
                
                const cards = await cardsResponse.json();
                const thunderbirdCards = cards.filter(card => 
                    card.labels && card.labels.some(label => label.id === thunderbirdLabel.id)
                );
                
                // Add board context to each card
                for (const card of thunderbirdCards) {
                    allTasks.push({
                        id: card.id,
                        name: card.name,
                        desc: card.desc,
                        url: card.url,
                        boardName: board.name,
                        listName: card.list ? card.list.name : 'Unknown',
                        dateLastActivity: card.dateLastActivity
                    });
                }
                
            } catch (error) {
                console.error(`Error processing board ${board.name}:`, error);
            }
        }
        
        return allTasks;
        
    } catch (error) {
        console.error('Error fetching Thunderbird tasks:', error);
        return [];
    }
}

/**
 * Synchronizes Thunderbird-tagged Trello cards with Thunderbird's task system
 */
async function syncThunderbirdTasks() {
    try {
        const tasks = await fetchThunderbirdTasks();
        console.log(`Found ${tasks.length} Thunderbird tasks to sync`);
        
        // Store tasks in extension storage for access by other components
        await browser.storage.local.set({
            thunderbirdTasks: tasks,
            lastSync: Date.now()
        });
        
        return tasks;
        
    } catch (error) {
        console.error('Error syncing Thunderbird tasks:', error);
        return [];
    }
}

// Sync tasks on extension startup
syncThunderbirdTasks();

// Sync tasks every 5 minutes
setInterval(syncThunderbirdTasks, 5 * 60 * 1000);

// Listen for messages from other parts of the extension (e.g., the popup)
browser.runtime.onMessage.addListener(async (request, _sender, _sendResponse) => {
    if (request.command === 'get_current_message') {
        const messageData = await getCurrentMessage();
        return messageData;
    }
    
    if (request.command === 'sync_tasks') {
        const tasks = await syncThunderbirdTasks();
        return { tasks, success: true };
    }
    
    if (request.command === 'get_tasks') {
        const stored = await browser.storage.local.get(['thunderbirdTasks', 'lastSync']);
        return {
            tasks: stored.thunderbirdTasks || [],
            lastSync: stored.lastSync || null
        };
    }
});
