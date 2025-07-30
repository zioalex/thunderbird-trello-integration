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
        const tabs = await browser.tabs.query({ active: true, windowType: "messageDisplay" });

        if (!tabs || tabs.length === 0) {
            console.log("No active message display tab found.");
            return null;
        }

        // Get the message displayed in the active tab
        const message = await browser.messageDisplay.getDisplayedMessage(tabs[0].id);
        if (!message) {
            console.log("No message displayed in the active tab.");
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
        console.error("Error getting current message:", error);
        return null;
    }
}

// Listen for messages from other parts of the extension (e.g., the popup)
browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.command === "get_current_message") {
        const messageData = await getCurrentMessage();
        return messageData;
    }
});
