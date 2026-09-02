# Setting Up Google Cloud Logging for Feedback Form

To log the feedback into your Google Cloud (Google Workspace / Google Sheets) and get notified at **shiyunn.dream@gmail.com**, we will use a **Google Apps Script Web App**. It's completely free, serverless, and doesn't require complex GCP service accounts.

## Step 1: Create the Google Sheet
1. Log into Google Drive with `shiyunn.dream@gmail.com`
2. Create a new Google Sheet and name it `SG DataViz Feedback Logs`.
3. In the first row, add these headers: 
   - A1: `Timestamp`
   - B1: `Type`
   - C1: `Email`
   - D1: `Message`

## Step 2: Add the Apps Script
1. In your new Google Sheet, click on **Extensions** -> **Apps Script**.
2. Delete the default `myFunction()` code and paste the following script:

```javascript
function doPost(e) {
  try {
    // Parse the incoming JSON payload from Next.js
    var payload = JSON.parse(e.postData.contents);
    
    // Select the active sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Append the row to your Google Sheet
    sheet.appendRow([
      payload.timestamp,
      payload.type,
      payload.email,
      payload.message
    ]);
    
    // Send email notification to yourself
    var emailSubject = "[SG DataViz] New " + payload.type + " received!";
    var emailBody = "You have received new feedback for SG DataViz:\n\n" +
                    "Type: " + payload.type + "\n" +
                    "From: " + payload.email + "\n\n" +
                    "Message:\n" + payload.message + "\n\n" +
                    "Logged at: " + payload.timestamp;
                    
    MailApp.sendEmail("shiyunn.dream@gmail.com", emailSubject, emailBody);
    
    // Return success to the API
    return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "error": error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Step 3: Deploy the Web App
1. Click the **Deploy** button (top right) -> **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Description: `Feedback Webhook`
4. Web app -> Execute as: **Me (shiyunn.dream@gmail.com)**
5. Who has access: **Anyone**
6. Click **Deploy**. (You will be prompted to Authorize Access to let it write to the sheet and send emails).
7. Copy the **Web app URL** generated.

## Step 4: Add to your Next.js project
1. In your VM deployment or `.env.local` file, add the URL you copied:
```env
GOOGLE_FEEDBACK_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
```

*Note: Until you set the `GOOGLE_FEEDBACK_WEBHOOK_URL`, the Feedback Form has a built-in fallback that will automatically open the user's default email client pre-filled with the feedback data sent to `shiyunn.dream@gmail.com`.*
