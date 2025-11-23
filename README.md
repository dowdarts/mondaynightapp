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

**Note**: This app stores data in browser memory only. Data is not saved between sessions. To preserve your scores:
- Take screenshots of your stats
- Export data manually if needed
- Consider adding a backend for persistent storage (future enhancement)

## Future Enhancements

Potential features for future versions:
- Local storage persistence between sessions
- Export to CSV or PDF
- Print-friendly score sheets
- Player profiles and comparison
- Season-long statistics
- Cloud backup integration

## License

This project is open source and available for personal use.

## Support

For issues or questions about using the app, please refer to the game flow instructions above or check the code comments in `app.js`.

---

**Version**: 1.0  
**Last Updated**: November 2025
