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
 * Decode common HTML entities
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded text
 */
function decodeHtmlEntities(text) {
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&apos;': '\'',
        '&nbsp;': ' ',
        '&ndash;': '–',
        '&mdash;': '—',
        '&hellip;': '...',
        '&copy;': '©',
        '&reg;': '®',
        '&trade;': '™',
        '&#39;': '\'',
        '&lsquo;': '‘',
        '&rsquo;': '’',
        '&ldquo;': '“',
        '&rdquo;': '”',
        '&bull;': '•',
        '&sect;': '§'
    };

    let decoded = text;
    for (const [entity, char] of Object.entries(entities)) {
        decoded = decoded.replaceAll(entity, char);
    }

    // Decode numeric entities (&#123; or &#xAB;)
    // Use String.fromCodePoint to support unicode characters above 0xFFFF (like emojis)
    decoded = decoded.replace(/&#(\d+);/g, (match, dec) => String.fromCodePoint(dec));
    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCodePoint(parseInt(hex, 16)));

    return decoded;
}

/**
 * Convert HTML to Markdown-style formatting
 * @param {string} html - HTML content
 * @returns {string} Markdown-formatted text
 */
function htmlToMarkdown(html) {
    let text = html;

    // Convert code blocks first (before other processing that might interfere)
    // <pre> -> ```code```
    text = text.replace(/<pre[^>]*>(.*?)<\/pre>/gis, '\n```\n$1\n```\n');

    // Convert links: <a href="url">text</a> -> [text](url)
    text = text.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Convert bold: <b> or <strong> -> **text**
    text = text.replace(/<(b|strong)>(.*?)<\/\1>/gi, '**$2**');

    // Convert italic: <i> or <em> -> *text*
    text = text.replace(/<(i|em)>(.*?)<\/\1>/gi, '*$2*');

    // Convert headers: <h1-6> -> # text
    text = text.replace(/<h1>(.*?)<\/h1>/gi, '\n# $1\n');
    text = text.replace(/<h2>(.*?)<\/h2>/gi, '\n## $1\n');
    text = text.replace(/<h3>(.*?)<\/h3>/gi, '\n### $1\n');
    text = text.replace(/<h4>(.*?)<\/h4>/gi, '\n#### $1\n');
    text = text.replace(/<h5>(.*?)<\/h5>/gi, '\n##### $1\n');
    text = text.replace(/<h6>(.*?)<\/h6>/gi, '\n###### $1\n');

    // Convert ordered lists FIRST (before unordered lists)
    // <ol><li> -> 1. item
    let olCounter = 0;
    text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
        olCounter = 0;
        const converted = content.replace(/<li[^>]*>(.*?)<\/li>/gi, (liMatch, liContent) => {
            olCounter++;
            return `${olCounter}. ${liContent}\n`;
        });
        return '\n' + converted + '\n';
    });

    // Convert unordered lists: <ul><li> -> - item
    text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
        const converted = content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
        return '\n' + converted + '\n';
    });

    // Convert line breaks: <br> -> \n
    text = text.replace(/<br\s*\/?>/gi, '\n');

    // Convert paragraphs: <p> -> double newline
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<p[^>]*>/gi, '');

    // Convert inline code: <code> -> `code`
    text = text.replace(/<code>(.*?)<\/code>/gi, '`$1`');

    // Convert blockquotes: <blockquote> -> > text
    text = text.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
        // Split content by newlines, trim each line, and prefix with '> '
        const lines = content.trim().split('\n').map(line => '> ' + line.trim());
        return '\n' + lines.join('\n') + '\n';
    });

    // Remove remaining HTML tags in a single pass (handles multi-line tags)
    text = text.replace(/<[^>]*>/gs, '');
    // Decode HTML entities
    text = decodeHtmlEntities(text);

    // Clean up excessive whitespace
    text = text.replace(/\n{4,}/g, '\n\n\n');
    text = text.replace(/[ \t]+/g, ' ');

    return text.trim();
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
        // If no plain text, try text/html and convert to markdown
        else if (part.contentType === 'text/html' && part.body && !textContent) {
            textContent = htmlToMarkdown(part.body);
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
    module.exports = {
        getCurrentMessage,
        formatEmailForTrello,
        extractBodyFromParts,
        decodeHtmlEntities,
        htmlToMarkdown
    };
}
