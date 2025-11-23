# Monday Night Darts Average Tracker 🎯

A modern, tablet-friendly React web application for tracking darts scores and calculating averages during Monday night matches. Built with a beautiful gradient UI optimized for touch interactions.

## Features ✨

- **Real-time Score Tracking**: Track scores for 3 games per match with customizable darts thrown
- **Live Average Calculation**: Automatic 1-dart average calculation for each game and match
- **Match History**: View and edit completed match history with detailed statistics
- **Overall Statistics**: Comprehensive stats across all matches including total score, darts, tons, and finishes
- **Tablet-Optimized UI**: Large touch targets, gradient designs, and responsive layouts for excellent tablet experience
- **Sit Out Tracking**: Mark matches as "Sat Out" for accurate record keeping
- **Night Reset**: Start fresh nights while preserving historical data

## Technology Stack 🛠️

- **React 18.2.0** - Modern UI framework with hooks
- **Vite 5.0.8** - Fast build tool and dev server
- **Tailwind CSS 3.3.6** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **PostCSS & Autoprefixer** - CSS processing

## Getting Started 🚀

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/monday-night-darts-app.git
cd monday-night-darts-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## How to Use 📖

### Editing Mode
1. Click **"Edit Scores"** to enter editing mode
2. Enter scores for each game by clicking cells
3. Use the on-screen keypad or keyboard to input values
4. Mark tons (180s) by clicking the 🎯 column
5. Set finish type (My Finish, Partner Finish, or Game Lost)
6. Click **"Save Changes"** when done

### Completing Matches
- After completing Game 3, the match is automatically saved to History
- A new Match begins immediately
- View completed matches in the **"History"** tab

### Statistics
- **Current Match**: View live totals at the top of the screen
- **Overall Stats**: Check cumulative statistics across all matches in the **"Overall Stats"** tab

### Special Actions
- **Sit Out**: Mark current match as sat out (archived with S/O status)
- **Night Complete**: Reset to Match #1 while preserving history

## Design Features 🎨

- **Gradient Backgrounds**: Modern gradient color schemes throughout
- **Touch-Friendly**: Minimum 44x44px touch targets for all interactive elements
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Smooth Animations**: fadeInUp animations and scale transitions
- **Custom Scrollbar**: Sleek slate-themed scrollbar
- **Visual Feedback**: Active states, hover effects, and scale feedback

## Project Structure 📁

```
monday-night-darts-app/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles and Tailwind imports
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
└── README.md           # This file
```

## Browser Support 🌐

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Tablet browsers optimized

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments 🙏

- Built with ❤️ for Monday Night Darts
- Icons by [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## Support 💬

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Happy Darting! 🎯**
