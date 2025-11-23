# Monday Night Average App

A mobile-friendly dart league scoring application designed to track player averages and performance across multiple matches.

## Features

### Scoring System
- **3-Game Match Format**: Track scores across 3 games per match
- **7 Dart Boxes**: Score entry for 3, 6, 9, 12, 15, 18, and 21 dart columns
- **Automatic Calculations**: Real-time calculation of totals, dart counts, and averages
- **High Score Highlighting**: Scores of 95+ are automatically circled in green

### Match Management
- **5 Matches Per Night**: Complete tracking for all 5 rounds
- **Sit-Out Functionality**: Mark matches you didn't play with automatic scratching
- **Finish Tracking**: Record wins, losses, and partner finishes for each game

### Data & History
- **History Tab**: View all previous matches with full score details
- **Overall Stats Tab**: Cumulative statistics across all matches
- **Edit Capability**: Click any historical score to correct mistakes
- **Nightly Totals**: Comprehensive summary at the end of each night

## How to Use

### Score Entry
1. **Number Pad**: Click numbers or use your keyboard to enter scores
2. **Enter Key**: Press Enter or click the Enter button to confirm and move to the next dart box
3. **End Score (/)**: When below 100, press `/` or click the `/` button to end scoring
4. **Undo**: Remove the last entered score if needed

### Keyboard Shortcuts
- `0-9`: Enter score digits
- `Enter`: Confirm score and advance to next box
- `/`: Mark end of score (when under 100)
- `Backspace`: Delete current input or undo last score

### Game Flow
1. Enter scores for each dart box (3, 6, 9, 12, 15, 18, 21)
2. When finished scoring, press `/` to end the game
3. Choose finish result: Win (✓), Loss (✗), or Partner Win (✓)
4. Complete all 3 games in the match
5. Click "NEXT MATCH" to move to the next round
6. After Match 5, click "END NIGHT" to view nightly totals

### Special Actions
- **Sit Out**: Skip a match if you're not playing
- **Edit History**: Click on any score in the History tab to edit
- **View Stats**: Check your overall performance in the Stats tab

## Installation

### Quick Start
1. Download or clone this repository
2. Open `index.html` in any modern web browser
3. Start scoring!

### No Installation Required
This is a standalone web application that runs entirely in your browser. No server, database, or internet connection needed.

## Technical Details

### Technology Stack
- **HTML5**: Semantic structure
- **CSS3**: Responsive mobile-first design
- **Vanilla JavaScript**: No frameworks or dependencies
- **Local Storage**: All data stored in browser memory

### Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

### Files
- `index.html` - Main application structure
- `app.js` - Scoring logic and state management
- `styles.css` - Responsive styling

## Mobile Optimization

The app is fully optimized for mobile devices with:
- Touch-friendly buttons (minimum 48px height)
- Horizontal scrolling tables for small screens
- Compact spacing for maximum screen usage
- Large, easy-to-tap number pad
- Responsive text sizing

## Data Management

### Persistent Storage with Supabase

This app now supports persistent data storage using Supabase! Your scores and match history will be automatically saved and restored even after closing the browser.

**Setup Required:** Follow the instructions in `SUPABASE_SETUP.md` to:
1. Create a free Supabase account
2. Set up the database tables
3. Configure your API credentials

**Features:**
- ✅ Auto-save after every action
- ✅ Data persists across browser sessions
- ✅ "All Done for Night" button to clear data and start fresh
- ✅ No data loss from accidental browser closes

**Without Supabase:** The app will still work but data will only persist during the current browser session (stored in memory only)

## Progressive Web App (PWA)

This app can be installed on your phone like a native app!

### Installation Benefits
- 📱 **Add to Home Screen**: Appears as an app icon on your phone
- 🚀 **Full-Screen Mode**: Runs without browser UI for immersive experience
- 📶 **Works Offline**: Access your app even without internet connection
- ⚡ **Fast Loading**: Cached for instant startup
- 🔄 **Auto-Updates**: Always get the latest version

### How to Install

**Android (Chrome/Edge):**
1. Open the app in Chrome or Edge browser
2. Tap the menu (⋮) → "Add to Home screen" or "Install app"
3. Confirm installation
4. Tap the new icon on your home screen to launch

**iPhone/iPad (Safari):**
1. Open the app in Safari
2. Tap the Share button (□↑) → "Add to Home Screen"
3. Confirm and tap "Add"
4. Launch from your home screen

**Desktop (Chrome/Edge):**
- Look for the install icon (⊕) in the address bar
- Click to install as a desktop app

**Detailed Instructions:** See `PWA_INSTALLATION.md` for full setup guide, including:
- Creating app icons from SVG template
- Testing PWA functionality
- Serving the app on your local network
- Production deployment options

## Future Enhancements

Potential features for future versions:
- Export to CSV or PDF
- Print-friendly score sheets
- Player profiles and comparison
- Season-long statistics
- Push notifications for match reminders
- Share scores via social media

## License

This project is open source and available for personal use.

## Support

For issues or questions about using the app, please refer to the game flow instructions above or check the code comments in `app.js`.

---

**Version**: 2.0 (PWA Enabled)  
**Last Updated**: January 2025
