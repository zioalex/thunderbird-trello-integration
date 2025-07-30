// background.js
// Handles background tasks for the Trello Task Creator extension.

console.log('=== BACKGROUND SCRIPT LOADING ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Available browser APIs:', Object.keys(browser || {}));
if (browser && browser.messages) {
    console.log('browser.messages methods:', Object.keys(browser.messages));
} else {
    console.log('browser.messages not available during init');
}

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
    const indent = '  '.repeat(depth);
    console.log(`${indent}Extracting from ${parts.length} parts at depth ${depth}`);
    
    let textContent = '';
    
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        console.log(`${indent}Part ${i}:`, {
            contentType: part.contentType,
            hasBody: !!part.body,
            bodyLength: part.body?.length || 0,
            hasParts: !!part.parts,
            nestedPartsCount: part.parts?.length || 0,
            headers: part.headers ? Object.keys(part.headers) : []
        });
        
        // Look for text/plain parts first
        if (part.contentType === 'text/plain' && part.body) {
            console.log(`${indent}  Found text/plain content, length:`, part.body.length);
            textContent += part.body;
        }
        // If no plain text, try text/html and strip tags
        else if (part.contentType === 'text/html' && part.body && !textContent) {
            console.log(`${indent}  Found text/html content, stripping tags...`);
            // Simple HTML tag removal (basic)
            const strippedContent = part.body.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
            console.log(`${indent}  Stripped HTML, length:`, strippedContent.length);
            textContent = strippedContent;
        }
        // Recursively check nested parts
        else if (part.parts && part.parts.length > 0) {
            console.log(`${indent}  Recursing into ${part.parts.length} nested parts...`);
            const nestedContent = extractBodyFromParts(part.parts, depth + 1);
            if (nestedContent) {
                console.log(`${indent}  Got nested content, length:`, nestedContent.length);
                textContent += nestedContent;
            } else {
                console.log(`${indent}  No content from nested parts`);
            }
        }
        else {
            console.log(`${indent}  Skipping part: no usable content`);
        }
    }
    
    console.log(`${indent}Total extracted content length at depth ${depth}:`, textContent.length);
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
            console.log('No active message display tab found, trying general tabs.');
            tabs = await browser.tabs.query({ active: true, currentWindow: true });
        }

        if (!tabs || tabs.length === 0) {
            console.log('No active tab found.');
            return null;
        }

        let message = null;
        let tabIndex = 0;

        // Try each tab to find one with a displayed message
        while (!message && tabIndex < tabs.length) {
            try {
                message = await browser.messageDisplay.getDisplayedMessage(tabs[tabIndex].id);
                if (message) {
                    console.log(`Found message in tab ${tabIndex}:`, tabs[tabIndex].id);
                    break;
                }
            } catch (err) {
                console.log(`Tab ${tabIndex} doesn't have a message:`, err.message);
            }
            tabIndex++;
        }

        if (!message) {
            console.log('No message displayed in any active tab.');
            return null;
        }

        // Get the email body using available APIs
        let body = '';
        try {
            console.log('=== STARTING MESSAGE BODY RETRIEVAL ===');
            console.log('Message ID:', message.id);
            console.log('Available browser.messages:', !!browser.messages);
            
            if (browser.messages) {
                console.log('Available methods in browser.messages:', Object.keys(browser.messages));
                console.log('getPlainBody available:', typeof browser.messages.getPlainBody);
                console.log('getFull available:', typeof browser.messages.getFull);
            } else {
                console.log('browser.messages is not available!');
            }
            
            // Strategy 1: Try getPlainBody if available
            if (browser.messages && typeof browser.messages.getPlainBody === 'function') {
                try {
                    console.log('Attempting getPlainBody...');
                    const bodyPart = await browser.messages.getPlainBody(message.id);
                    console.log('getPlainBody result:', bodyPart);
                    
                    if (bodyPart && bodyPart.value) {
                        body = bodyPart.value;
                        console.log('SUCCESS: Got plain body, length:', body.length);
                        console.log('Body preview (first 100 chars):', body.substring(0, 100));
                    } else {
                        console.log('getPlainBody returned empty or invalid result');
                    }
                } catch (plainBodyError) {
                    console.error('getPlainBody FAILED:', plainBodyError);
                    console.error('Error name:', plainBodyError.name);
                    console.error('Error message:', plainBodyError.message);
                }
            } else {
                console.log('SKIP: getPlainBody not available (type:', typeof browser.messages?.getPlainBody, ')');
            }
            
            // Strategy 2: Try getFull message if plain body failed or not available
            if (!body && browser.messages && typeof browser.messages.getFull === 'function') {
                try {
                    console.log('Attempting getFull message...');
                    const fullMessage = await browser.messages.getFull(message.id);
                    console.log('getFull result structure:', {
                        hasHeaders: !!fullMessage?.headers,
                        hasParts: !!fullMessage?.parts,
                        partsLength: fullMessage?.parts?.length || 0
                    });
                    
                    if (fullMessage && fullMessage.parts) {
                        console.log('Extracting body from message parts...');
                        body = extractBodyFromParts(fullMessage.parts);
                        console.log('SUCCESS: Extracted body from full message, length:', body.length);
                        console.log('Body preview (first 100 chars):', body.substring(0, 100));
                    } else {
                        console.log('getFull returned no usable parts');
                    }
                } catch (fullError) {
                    console.error('getFull FAILED:', fullError);
                    console.error('Error name:', fullError.name);
                    console.error('Error message:', fullError.message);
                }
            } else {
                console.log('SKIP: getFull not available or body already found');
            }
            
            // Strategy 3: Use message snippet as fallback
            if (!body && message.snippet) {
                body = message.snippet;
                console.log('SUCCESS: Using message snippet as body, length:', body.length);
                console.log('Snippet preview:', body.substring(0, 100));
            } else if (!body) {
                console.log('SKIP: No snippet available or body already found');
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
            console.error('Error getting message body:', bodyError);
            body = '';
        }

        console.log('Successfully retrieved message:', {
            subject: message.subject,
            bodyLength: body.length
        });

        return {
            subject: message.subject || '',
            body: body
        };
    } catch (error) {
        console.error('Error getting current message:', error);
        return null;
    }
}

// Listen for messages from other parts of the extension (e.g., the popup)
console.log('Setting up message listener...');
browser.runtime.onMessage.addListener(async (request, _sender, _sendResponse) => {
    console.log('=== RECEIVED MESSAGE FROM POPUP ===');
    console.log('Request:', request);
    console.log('Sender:', _sender);
    
    if (request.command === 'get_current_message') {
        console.log('Processing get_current_message command...');
        const messageData = await getCurrentMessage();
        console.log('Returning message data:', messageData);
        return messageData;
    } else {
        console.log('Unknown command:', request.command);
    }
});
console.log('Message listener set up successfully');
console.log('=== BACKGROUND SCRIPT INITIALIZATION COMPLETE ===');

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getCurrentMessage, formatEmailForTrello };
}
