# Supabase Setup Instructions

Follow these steps to enable persistent data storage for your Dart League Scoring App:

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account (if you don't have one)
3. Create a new project
   - Enter a project name (e.g., "dart-league-app")
   - Create a strong database password
   - Choose a region closest to you
   - Wait for the project to be created (~2 minutes)

## Step 2: Set Up Database Tables

1. In your Supabase project dashboard, click on the **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the entire contents of `supabase-setup.sql` file
4. Paste it into the SQL editor
5. Click **Run** to execute the SQL commands
6. You should see a success message

This creates two tables:
- `dart_sessions`: Stores current game state
- `match_history`: Stores completed match data

## Step 3: Get Your API Credentials

1. In your Supabase project dashboard, click on the **Settings** icon (gear) in the left sidebar
2. Click on **API** under Project Settings
3. Find these two values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** API key (a long string starting with `eyJ...`)

## Step 4: Configure Your App

1. Open the `supabase-config.js` file in your app folder
2. Replace the placeholder values with your actual credentials:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your Project URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your anon public key
```

For example:
```javascript
const SUPABASE_URL = 'https://abcdefghijk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

3. Save the file

## Step 5: Test Your App

1. Open `index.html` in your browser
2. Open the browser console (F12) to check for any errors
3. You should see: "Supabase initialized successfully"
4. Enter some scores and complete a match
5. Close and reopen the browser - your data should persist!

## Features

### Auto-Save
The app automatically saves to Supabase after:
- Entering a score
- Ending a game
- Completing a match
- Sitting out a match

### Data Persistence
Your data persists across:
- Browser refreshes
- Browser closes and reopens
- Different sessions (same device/browser)

### Reset for New Night
After completing all 5 matches:
1. View the nightly totals modal
2. Click **"All Done for Night"** button
3. Confirm to clear all data and start fresh

This creates a new session ID and clears all previous data from the database.

## Security Notes

**Important:** The current setup uses anonymous access policies, meaning anyone with access to your app can read/write data. This is fine for:
- Personal use
- Local network use
- Testing

For production use with multiple users, consider:
1. Implementing user authentication
2. Updating the RLS policies to restrict access by user
3. Using Supabase Auth to manage user sessions

## Troubleshooting

### "Supabase not initialized" error
- Check that your credentials are correct in `supabase-config.js`
- Verify your internet connection
- Check the browser console for detailed error messages

### Data not saving
- Open browser console and check for errors
- Verify the SQL setup ran successfully in Supabase
- Check that RLS policies are enabled

### Old data still showing
- The app uses localStorage to maintain session ID
- To completely reset: Clear browser localStorage or use the "All Done for Night" button

## Support

For Supabase-specific issues:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
