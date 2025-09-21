# AMO Submission Guide - Trello Task Creator

## 📋 Pre-Submission Checklist

### ✅ Required Files Ready
- [x] `trello-task-creator-extension.zip` - Extension package
- [x] `AMO_LISTING.md` - All listing materials prepared
- [x] Screenshots (need to capture - see list below)
- [x] Privacy policy (included in listing materials)

### 📸 Screenshots to Capture

these screenshots are available in the folder extension_screenshots: 

1. **Main Interface**: Extension popup showing:
   - Board selection dropdown
   - List selection dropdown
   - Task title field
   - Description field
   - Create Task button

2. **Settings Page**: Options page showing:
   - API Key field
   - Token field
   - Test Connection button
   - Save Settings button

3. **Thunderbird Integration**: 
   - Trello icon visible in Thunderbird toolbar
   - Extension popup opened from toolbar

4. **Success States**:
   - "Connection successful" message
   - "Task created successfully" message

5. **Trello Result**: 
   - A task created in Trello showing it came from Thunderbird

### 📝 Account Requirements
- [ ] Create Mozilla Developer account at https://addons.thunderbird.net/developers/
- [ ] Verify your email address
- [ ] Complete developer profile

## 🚀 Step-by-Step Submission Process

### Step 1: Create Developer Account
1. Go to https://addons.thunderbird.net/
2. Click "Developer Hub" or "Submit an Add-on"
3. Sign in with Firefox/Mozilla account or create new one
4. Complete your developer profile

### Step 2: Upload Extension
1. Navigate to "Submit a New Add-on"
2. Choose "On this site" for distribution
3. Upload `trello-task-creator-extension.zip`
4. Wait for automatic validation to complete

### Step 3: Fill Out Listing Information

**Basic Information:**
- Name: Trello Task Creator
- Categories: Productivity, Communication
- Tags: trello, tasks, productivity, project-management, email-integration, workflow, thunderbird, task-management, boards, lists, api-integration
- Summary: (Copy from AMO_LISTING.md - max 250 chars)
- Description: (Copy detailed description from AMO_LISTING.md)

**Version Information:**
- Version: 1.1.12
- License: MIT License
- Release Notes: Initial public release. Full-featured Trello task creation from Thunderbird.

**Support:**
- Homepage: https://www.ai4you.sh
- Support Site: https://github.com/zioalex/thunderbird-trello-integration/issues
- Support Email: support@ai4you.sh

**Privacy Policy:**
- Copy the privacy policy section from AMO_LISTING.md

### Step 4: Upload Screenshots
Upload the 5 screenshots in this order:
1. Main extension popup interface
2. Settings/configuration page  
3. Thunderbird toolbar integration
4. Success messages
5. Trello result showing created task

### Step 5: Distribution Settings
- **Visibility**: Public (recommended)
- **Review Queue**: Choose standard review (faster) unless you need expedited review

### Step 6: Review Process
- AMO will automatically validate your extension
- Address any validation errors or warnings
- Human reviewers will examine the extension (1-7 days typically)
- You'll receive email notifications about status updates

## 🛠️ Common Validation Issues to Avoid

### Extension Structure
- ✅ Manifest.json is at root level (verified)
- ✅ All referenced files exist (verified)
- ✅ Icons are present in correct sizes (verified)
- ✅ No sensitive data in package (verified)

### Permissions
- ✅ Only necessary permissions requested (verified)
- ✅ Permission justifications clear in description

### Code Quality
- ✅ No console.log statements in production code
- ✅ Proper error handling
- ✅ No hardcoded credentials or URLs

## 📞 After Submission

### What Happens Next
1. **Automatic Validation** (immediate)
   - File structure check
   - Manifest validation  
   - Basic security scan

2. **Human Review** (1-7 days)
   - Code review for security/quality
   - Policy compliance check
   - Functionality verification

3. **Approval/Feedback**
   - If approved: Extension goes live immediately
   - If rejected: You'll receive detailed feedback and can resubmit

### Managing Your Extension
- **Updates**: Upload new versions through developer dashboard
- **Statistics**: View download counts and user feedback
- **Support**: Respond to user reviews and support requests

## 🔄 Version Updates

For future updates:
1. Update version in manifest.json
2. Create new ZIP package
3. Upload through "Manage My Submissions" 
4. Provide clear release notes
5. Same review process applies

## ⚠️ Important Notes

- **First-time Review**: Can take up to 7 days
- **Update Reviews**: Usually faster (1-3 days)
- **Beta Channels**: Consider using beta channel for testing major updates
- **User Feedback**: Respond promptly to user reviews and issues
- **Keep Updated**: Maintain compatibility with new Thunderbird versions

## 📧 Support Contacts

- **AMO Support**: amo-developers@mozilla.org
- **Developer Documentation**: https://developer.thunderbird.net/
- **WebExtension APIs**: https://webextension-api.thunderbird.net/

## 🎉 Congratulations!

Once approved, your extension will be available at:
`https://addons.thunderbird.net/addon/trello-task-creator/`

Users can then install it directly from the AMO marketplace!