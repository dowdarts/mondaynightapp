# Supabase Configuration for Password Reset

## Required Steps to Enable Password Reset Emails

### 1. Add Redirect URL to Supabase Dashboard

You need to add your app's URL to the allowed redirect URLs in Supabase:

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `cfnoqwocyyrtpkihshpy`
3. Navigate to **Authentication** → **URL Configuration**
4. Under **Redirect URLs**, add these URLs:
   - `https://dowdarts.github.io/mondaynightapp/`
   - `http://localhost:8000/` (for local testing)
   - `http://127.0.0.1:8000/` (for local testing)

### 2. Configure Password Reset Email Template

The email template is already created in `password-reset-email-template.html`, but you need to add it to Supabase:

1. Go to **Authentication** → **Email Templates**
2. Select **Reset Password** template
3. Copy the contents of `password-reset-email-template.html`
4. Paste it into the template editor
5. Save the template

### 3. Verify SMTP Settings

Make sure email sending is configured:

1. Go to **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Verify that Supabase's built-in email service is enabled OR configure your own SMTP server

### 4. Test the Password Reset Flow

1. Visit your app
2. Click "Forgot Password?"
3. Enter your email
4. Check your email inbox (and spam folder)
5. Click the reset link
6. You should see the password update form in your app

## Troubleshooting

### Email link gives 404 error
- Make sure the redirect URL is added to Supabase's allowed URLs
- Check that the URL in the email matches your app's URL exactly

### Email not received
- Check spam/junk folder
- Verify SMTP settings in Supabase dashboard
- Check Supabase logs for email delivery errors

### "Invalid redirect URL" error
- The redirect URL must be added to the allowed list in Supabase
- URLs must match exactly (including trailing slash)
