// background.js
// Handles background tasks for the Trello Task Creator extension.

/**
 * Formats email content for better display in Trello cards
 * @param {string} body - The email body content
 * @param {object} message - The message object with metadata
 * @returns {string} Formatted content suitable for Trello
 */
function formatEmailForTrello(body, message) {
    let formatted = '';
    
    // Add email metadata header
    formatted += '## Email Details\n\n';
    
    // Add basic email info
    if (message.author) {
        formatted += `**From:** ${message.author}\n`;
    }
    if (message.recipients && message.recipients.length > 0) {
        const toList = message.recipients.map(r => r.replace(/^[^<]*<([^>]+)>.*$/, '$1') || r).join(', ');
        formatted += `**To:** ${toList}\n`;
    }
    if (message.ccList && message.ccList.length > 0) {
        const ccList = message.ccList.map(r => r.replace(/^[^<]*<([^>]+)>.*$/, '$1') || r).join(', ');
        formatted += `**CC:** ${ccList}\n`;
    }
    if (message.date) {
        const date = new Date(message.date);
        formatted += `**Date:** ${date.toLocaleString()}\n`;
    }
    
    formatted += '\n---\n\n';
    
    // Clean up and format the body content
    let cleanBody = body;
    
    // Handle quoted text (lines starting with >)
    const lines = cleanBody.split('\n');
    const processedLines = [];
    let inQuote = false;
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Detect quoted text
        if (trimmedLine.startsWith('>')) {
            if (!inQuote) {
                processedLines.push('\n**Previous conversation:**\n');
                inQuote = true;
            }
            // Remove the > and format as blockquote
            processedLines.push(`> ${trimmedLine.substring(1).trim()}`);
        } else if (inQuote && trimmedLine === '') {
            // Empty line in quote
            processedLines.push('>');
        } else {
            if (inQuote) {
                processedLines.push('\n---\n');
                inQuote = false;
            }
            processedLines.push(line);
        }
    }
    
    cleanBody = processedLines.join('\n');
    
    // Clean up excessive whitespace
    cleanBody = cleanBody.replace(/\n{4,}/g, '\n\n\n');
    
    // Look for email signatures (common patterns)
    const signaturePatterns = [
        /\n--\s*\n[\s\S]*$/,  // Standard signature delimiter
        /\n_{3,}\s*\n[\s\S]*$/,  // Underline signatures
        /\nBest regards?[\s\S]*$/i,  // "Best regards" endings
        /\nSincerely[\s\S]*$/i,     // "Sincerely" endings
        /\nThanks?[\s\S]*$/i       // "Thanks" endings
    ];
    
    for (const pattern of signaturePatterns) {
        const match = cleanBody.match(pattern);
        if (match) {
            const mainContent = cleanBody.substring(0, match.index);
            const signature = match[0].trim();
            
            if (signature.length > 10 && signature.length < 300) {
                cleanBody = mainContent + '\n\n**Signature:**\n' + signature.replace(/^\n+/, '');
                break;
            }
        }
    }
    
    // Add the formatted body
    formatted += cleanBody;
    
    return formatted;
}

/**
 * Helper function to extract text body from message parts
 * @param {Array} parts - Message parts array
 * @param {number} depth - Recursion depth for logging
 * @returns {string} Extracted text content
 */
function extractBodyFromParts(parts, depth = 0) {
    let textContent = '';
    
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        // Look for text/plain parts first
        if (part.contentType === 'text/plain' && part.body) {
            textContent += part.body;
        }
        // If no plain text, try text/html and strip tags
        else if (part.contentType === 'text/html' && part.body && !textContent) {
            // Simple HTML tag removal (basic)
            const strippedContent = part.body.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
            textContent = strippedContent;
        }
        // Recursively check nested parts
        else if (part.parts && part.parts.length > 0) {
            const nestedContent = extractBodyFromParts(part.parts, depth + 1);
            if (nestedContent) {
                textContent += nestedContent;
            }
        }
    }
    
    return textContent;
}

/**
 * Retrieves the subject and plain body of the currently displayed email message.
 * @returns {Promise<object|null>} A promise that resolves to an object with
 *   `subject` and `body` properties, or `null` if no message is displayed.
 */
async function getCurrentMessage() {
    try {
        // Strategy 1: Query for the active tab in the message display window
        let tabs = await browser.tabs.query({ active: true, windowType: 'messageDisplay' });

        // Strategy 2: If no messageDisplay tabs, try regular tabs that might be showing a message
        if (!tabs || tabs.length === 0) {
            tabs = await browser.tabs.query({ active: true, currentWindow: true });
        }

        if (!tabs || tabs.length === 0) {
            return null;
        }

        let message = null;
        let tabIndex = 0;

        // Try each tab to find one with a displayed message
        while (!message && tabIndex < tabs.length) {
            try {
                message = await browser.messageDisplay.getDisplayedMessage(tabs[tabIndex].id);
                if (message) {
                    break;
                }
            } catch (err) {
                // Tab doesn't have a message, continue to next tab
            }
            tabIndex++;
        }

        if (!message) {
            return null;
        }

        // Get the email body using available APIs
        let body = '';
        try {
            // Use getFull to get message parts and extract body
            if (browser.messages && typeof browser.messages.getFull === 'function') {
                try {
                    const fullMessage = await browser.messages.getFull(message.id);

                    if (fullMessage && fullMessage.parts) {
                        body = extractBodyFromParts(fullMessage.parts);
                    }
                } catch (fullError) {
                    // getFull failed, body will remain empty
                }
            }
            
            // Clean up and format the body text if we got any
            if (body) {
                body = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                body = body.replace(/\n{3,}/g, '\n\n'); // Limit consecutive line breaks
                body = body.trim();
                
                // Format as email content with markdown-style structure
                if (body) {
                    body = formatEmailForTrello(body, message);
                }
                
                // Truncate if too long (Trello has limits)
                if (body.length > 16000) {
                    body = body.substring(0, 16000) + '\n\n[Content truncated]';
                }
            }
            
        } catch (bodyError) {
            body = '';
        }

        return {
            subject: message.subject || '',
            body: body
        };
    } catch (error) {
        return null;
    }
}

// Listen for messages from other parts of the extension (e.g., the popup)
browser.runtime.onMessage.addListener(async (request, _sender, _sendResponse) => {
    if (request.command === 'get_current_message') {
        const messageData = await getCurrentMessage();
        return messageData;
    }
});

// Export for testing only - not used by the extension itself
if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = { getCurrentMessage, formatEmailForTrello, extractBodyFromParts };
}
