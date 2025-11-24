# Complete Setup Instructions for Password Reset

## ✅ Already Done in Code
- Password reset flow is implemented
- Email template is ready
- URL detection works for both hash and query parameters
- Debug logging is added

## 🔧 Supabase Configuration (YOU MUST DO THIS)

### Step 1: Configure Redirect URLs
1. Go to https://app.supabase.com
2. Select your project (`cfnoqwocyyrtpkihshpy`)
3. Click **Authentication** in the left sidebar
4. Click **URL Configuration**
5. Set these values:

   **Site URL:**
   ```
   https://dowdarts.github.io/mondaynightapp/
   ```

   **Redirect URLs (add all of these):**
   ```
   https://dowdarts.github.io/mondaynightapp/
   https://dowdarts.github.io/mondaynightapp/index.html
   http://localhost:8000/
   http://127.0.0.1:8000/
   ```

6. Click **Save**

### Step 2: Configure Password Reset Email Template
1. Still in **Authentication**, click **Email Templates**
2. Find and click **Reset Password** (or "Change Password Recovery" depending on your Supabase version)
3. Copy the entire template below and paste it in:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; background-color:#f3f4f6;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
    
    <!-- Header -->
    <div style="background:#1f2937; padding:24px; text-align:center;">
      <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">🎯 Monday Night Darts</h1>
    </div>

    <!-- Content -->
    <div style="padding:32px 24px;">
      <h2 style="margin:0 0 16px 0; color:#1f2937; font-size:20px; font-weight:600;">Reset Your Password</h2>
      
      <p style="margin:0 0 16px 0; color:#4b5563; line-height:1.6;">
        Hi there,
      </p>
      
      <p style="margin:0 0 24px 0; color:#4b5563; line-height:1.6;">
        We received a request to reset your password for your Monday Night Darts account. Click the button below to create a new password:
      </p>

      <!-- Reset Button -->
      <div style="text-align:center; margin:24px 0;">
        <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:6px; font-weight:600;">
          Reset Password
        </a>
      </div>

      <!-- Fallback plain link -->
      <p style="margin:0 0 16px 0; color:#6b7280; word-break:break-all; font-size:14px;">
        If the button doesn't work, copy and paste this link into your browser:
        <br />
        <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;">{{ .ConfirmationURL }}</a>
      </p>

      <p style="margin:0 0 8px 0; color:#6b7280; font-size:14px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>

      <hr style="border:none; border-top:1px solid #e5e7eb; margin:20px 0;" />

      <p style="font-size:12px; color:#9ca3af; margin:0 0 4px 0;">
        This link expires in 1 hour and can only be used once.
      </p>
      <p style="font-size:12px; color:#9ca3af; margin:0;">
        &copy; {{ .Year }} Monday Night Darts
      </p>
    </div>
  </div>
</body>
</html>
```

4. Click **Save**

### Step 3: Verify Email Settings
1. Go to **Project Settings** (gear icon in sidebar)
2. Click **Auth** tab
3. Scroll down to check:
   - **Enable email confirmations** should be ON
   - **Enable email change confirmations** should be ON
   - **SMTP Settings** - Supabase's built-in email should be enabled (or configure your own)

### Step 4: Test Password Reset Flow
1. Go to https://dowdarts.github.io/mondaynightapp/
2. Click "Forgot Password?"
3. Enter your email address
4. Check your email (and spam folder)
5. Click the reset link in the email
6. You should see a password update form
7. Enter your new password twice
8. Submit

### Step 5: Check Debugging (If It Doesn't Work)
If the password reset form doesn't appear:
1. Press F12 to open browser console
2. Look for these debug messages:
   - `🔍 Full URL:`
   - `🔍 Hash:`
   - `🔍 Type:`
   - `✅ Password recovery detected` (if working)

3. Share the console output to troubleshoot

## 📋 Verification Checklist
- [ ] Site URL set to `https://dowdarts.github.io/mondaynightapp/`
- [ ] Redirect URLs added (at least the main one)
- [ ] Email template updated with the code above
- [ ] Email settings verified
- [ ] Tested password reset and it works

## 🚨 Common Issues

### "Invalid redirect URL" error
- The redirect URL must be in the allowed list exactly
- Make sure there are no extra spaces
- The URL must match exactly (including trailing slash)

### Email link goes to 404
- Redirect URL not configured in Supabase
- Email template still has wrong URL

### Password form doesn't appear
- Check browser console for debug messages
- Verify email link has `#access_token=...&type=recovery` in URL
- Make sure app code is deployed to GitHub Pages

### Email not received
- Check spam folder
- Verify SMTP is configured in Supabase
- Check Supabase logs for email delivery errors

## 📞 Support
If you're still having issues after following all steps, check the browser console logs and Supabase logs for specific error messages.
