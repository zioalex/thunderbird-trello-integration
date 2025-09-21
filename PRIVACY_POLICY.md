# Privacy Policy
## Thunderbird Trello Task Creator Extension

**Effective Date:** September 21, 2024  
**Version:** 1.1.12

---

## Overview

This Privacy Policy explains how the Thunderbird Trello Task Creator extension ("the Extension", "we", "us") collects, uses, and protects your information when you use our extension to create Trello tasks from Thunderbird emails.

**Key Point:** We are committed to your privacy. The Extension only processes data locally and communicates directly with Trello's API. We do not collect, store, or transmit your personal data to any third-party services other than Trello.

---

## Data Collection and Usage

### 1. Local Storage Data

**What we store locally:**
- **Trello API Credentials**
  - Trello API Key
  - Trello Access Token
- **User Preferences**
  - Last used board selection
  - Last used list selection

**Where it's stored:** All data is stored locally in your browser using Firefox's `browser.storage.sync` API, which may sync across your Firefox/Thunderbird installations if you're signed in to Firefox Sync.

**Why we collect it:** To authenticate with Trello's API and remember your preferences for a better user experience.

**How long we keep it:** Data is stored until you uninstall the extension or manually clear it through the extension settings.

### 2. Email Content Processing

**What we access:**
- **Email Subject Lines** - Used to pre-fill Trello task titles
- **Email Body Content** - Used to pre-fill Trello task descriptions
- **Email Metadata** - Sender, recipients, date (formatted into task descriptions)

**How we process it:**
- Email content is accessed only when you actively use the "Auto-fill" feature
- Content is processed locally within Thunderbird
- Email content is formatted and can be edited before sending to Trello
- No email content is stored permanently by the extension

**Thunderbird Permissions Used:**
- `messagesRead` - To access email content for auto-fill functionality
- `tabs` - To interact with Thunderbird's tab system

---

## Data Transmission

### 1. Trello API Communications

**What data is sent to Trello:**
- **Authentication Data**: Your Trello API key and token with each request
- **Task Content**: Only the task title and description you choose to send
- **Trello Metadata**: Board IDs, list IDs, label IDs for task creation

**When data is sent:**
- When testing your API connection
- When loading your Trello boards and lists
- When creating new Trello tasks
- When creating new Trello labels

**API Endpoints Used:**
```
https://api.trello.com/1/members/me                    - User authentication test
https://api.trello.com/1/members/me/boards            - Load user's boards
https://api.trello.com/1/boards/{id}/lists            - Load board lists
https://api.trello.com/1/boards/{id}/labels           - Load board labels
https://api.trello.com/1/cards                        - Create new tasks
https://api.trello.com/1/boards/{id}/labels           - Create new labels
https://api.trello.com/1/cards/{id}/idLabels          - Add labels to tasks
```

**Security:** All communications with Trello use HTTPS encryption. Your API credentials are transmitted securely with each request.

### 2. No Third-Party Services

**We do NOT:**
- Send data to any analytics services
- Use tracking cookies or pixels
- Communicate with any servers other than Trello's official API
- Share your data with advertisers or marketing companies
- Store your data on external servers

---

## Data Security

### Protection Measures
- **Local Storage Encryption**: Credentials are stored using Firefox's secure storage APIs
- **HTTPS Only**: All API communications use encrypted HTTPS connections
- **No Data Retention**: No personal data is retained by the extension beyond local storage
- **Minimal Permissions**: Extension requests only the minimum permissions necessary for functionality

### Your Control
- **View Stored Data**: Check your stored API credentials in the extension settings
- **Delete Data**: Uninstall the extension to remove all stored data
- **Edit Before Sending**: All task content can be reviewed and edited before creation
- **Selective Sharing**: You choose exactly which email content to include in tasks

---

## Your Rights and Choices

### What You Can Do
- **Access**: View your stored API credentials in the extension settings
- **Modify**: Edit or update your API credentials at any time
- **Delete**: Remove all extension data by uninstalling the extension
- **Control**: Choose what email content to include when creating tasks
- **Revoke**: Disable the extension or revoke Trello API access at any time

### Trello Account Control
Since tasks are created in your Trello account, you have full control over that data through Trello's privacy settings and data management tools.

---

## Changes to This Policy

We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. When we do:

- The "Effective Date" at the top will be updated
- Significant changes will be highlighted in extension release notes
- Continued use of the extension constitutes acceptance of any changes

---

## Third-Party Services

### Trello Integration
This extension integrates with Trello's services. Your use of Trello is subject to:
- [Trello's Privacy Policy](https://trello.com/privacy)
- [Trello's Terms of Service](https://trello.com/legal)

When you use this extension, you're authorizing it to interact with your Trello account using credentials you provide.

---

## Technical Details

### Data Flow Summary
1. **Input**: You configure Trello API credentials (stored locally)
2. **Processing**: Extension accesses email content only when you use auto-fill
3. **Transmission**: Task data is sent directly to Trello's API over HTTPS
4. **Storage**: Only API credentials and preferences stored locally

### Open Source Transparency
This extension is open source. You can review the complete source code to verify:
- Exactly what data is collected and how
- Where data is sent (only to Trello's API)
- How your data is protected

---

## Contact Information

If you have questions about this Privacy Policy or the extension's data practices:

- **Extension Issues**: [GitHub Issues](https://github.com/zioalex/thunderbird-trello-integration/issues)
- **Privacy Questions**: Create an issue on GitHub with the "privacy" label
- **General Support**: support@ai4you.sh

---

## Compliance

This extension is designed to comply with:
- Mozilla Add-on Privacy Policies
- EU General Data Protection Regulation (GDPR) principles
- Firefox Extension Privacy Guidelines

**Data Protection Summary:**
- ✅ Minimal data collection (only API credentials)
- ✅ Local storage only (no external databases)
- ✅ User control and transparency
- ✅ Secure data transmission (HTTPS only)
- ✅ No tracking or analytics
- ✅ Open source and auditable

---

*This Privacy Policy was last updated on September 21, 2024. For the most current version, check the extension's documentation.*