# 📚 Study Tracker 2026

> A beautiful, feature-rich study habit tracker with screen-time style analytics and daily journaling.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://nikh27.github.io/habit-tracker-2026/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Made with Love](https://img.shields.io/badge/made%20with-❤️-red.svg)](https://github.com/nikh27/habit-tracker-2026)

## ✨ Features

### 📊 **Screen-Time Style Analytics**
- Weekly bar chart visualization (just like iPhone screen time!)
- Navigate through weeks with ← Previous / Next → buttons
- Color-coded completion rates (green/orange/red)
- Real-time progress tracking

### 📝 **Daily Notes & Journaling**
- Write notes for any day
- Quick notes from dashboard
- Full diary view in calendar
- Perfect for tracking learnings and reflections

### 📅 **Multiple Calendar Views**
- **Yearly** - Overview of entire year
- **Monthly** - Unified calendar with all tasks
- **Weekly** - 7-day box layout with task cards
- **Daily** - Detailed day view with notes

### 🎯 **Smart Task Management**
- Priority system (� High, ⚡ Medium, 🌱 Low)
- Study-focused categories (DSA, Programming, Theory, etc.)
- Icon picker with 20+ study emojis
- Streak tracking with 🔥 fire indicators

### 📈 **Advanced Analytics**
- Week average completion rate
- Best day performance
- Priority breakdown (all-time stats)
- Top 3 performing habits
- Interactive charts

### 🎨 **Beautiful UI**
- Dark/Light theme toggle
- Smooth animations
- Responsive design (mobile-friendly)
- Modern glassmorphism effects
- Color-coded progress indicators

## 🚀 Quick Start

### Option 1: Use Online (Recommended)
1. Visit the [Live Demo](https://nikh27.github.io/habit-tracker-2026/)
2. Start tracking immediately!

### Option 2: Run Locally
```bash
# Clone the repository
git clone https://github.com/nikh27/habit-tracker-2026.git

# Navigate to folder
cd habit-tracker-2026

# Open in browser
# Just double-click index.html or:
start index.html  # Windows
open index.html   # Mac
xdg-open index.html  # Linux
```

No build process needed! Pure vanilla JavaScript.

## 📖 How to Use

### Creating Your First Habit
1. Click **"➕ Add Habit"** button
2. Fill in:
   - Name (e.g., "DSA Practice")
   - Description (why it matters)
   - Category (DSA, Programming, etc.)
   - Priority (High/Medium/Low)
   - Icon (choose from 20+ options)
3. Click **"Save Habit"**

### Tracking Progress
1. Go to **Dashboard** or **Calendar**
2. Click on a task to mark complete ✓
3. Watch your streak grow! 🔥

### Writing Daily Notes
**From Dashboard:**
- Type in "Today's Notes" card
- Click "💾 Save Note"

**From Calendar:**
- Click any day
- Write in the notes section
- Click "� Save Note"

### Viewing Analytics
1. Go to **Analytics** tab
2. See weekly bar chart
3. Use ← → to navigate weeks
4. View summary cards and stats

## 💾 Data Storage

### Local Storage
- All data saved in browser's localStorage
- Persists after page reload
- No server required
- 100% private

### Backup & Export
1. Go to **Settings**
2. Click **"Export Data"**
3. Save JSON file to cloud (Google Drive, OneDrive, etc.)

### Import Data
1. Open exported JSON file
2. Copy content
3. Browser console (F12):
```javascript
localStorage.setItem('habitTrackerState', 'PASTE_JSON_HERE');
location.reload();
```

## �️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: Pure CSS3 with custom properties
- **Storage**: localStorage API
- **Icons**: Emoji (no external dependencies)
- **Build**: None! Just HTML/CSS/JS

### Why Vanilla JS?
- ⚡ Lightning fast
- 📦 Zero dependencies
- 🎯 Simple deployment
- 🔧 Easy to understand
- 💪 Great for learning

## � Project Structure

```
study-tracker-2026/
├── index.html          # Main HTML file
├── style.css           # All styles & themes
├── script.js           # App logic & state management
└── README.md           # This file
```

## 🎨 Customization

### Change Theme
Settings → Toggle Dark/Light

### Add Custom Categories
Edit `script.js` line ~232:
```javascript
<option value="your-category">Your Category</option>
```

### Add Custom Icons
Edit `script.js` line ~262:
```javascript
<button type="button" class="emoji-option" data-emoji="🎓">🎓</button>
```

## 🌟 Key Features Explained

### Screen-Time Analytics
- **Dual-layer bars**: Gray = total tasks, Green = completed
- **Navigation**: Go back unlimited weeks
- **Today indicator**: Blue border on current day
- **Hover details**: See exact completion count

### Daily Notes
- **Persistent**: Saved automatically
- **Accessible**: From dashboard or calendar
- **Flexible**: Write as much or as little as you want
- **Private**: Stored locally

### Streak Tracking
- **Current streak**: Days in a row
- **Best streak**: Personal record
- **Visual indicator**: 🔥 fire emoji
- **Motivation**: See progress grow

## 📱 Mobile Support

Fully responsive design:
- ✅ Touch-friendly buttons
- ✅ Swipe-friendly calendars
- ✅ Readable on small screens
- ✅ Optimized layouts

## 🔒 Privacy

- **No tracking**: Zero analytics
- **No server**: Everything local
- **No accounts**: No sign-up needed
- **Your data**: Stays on your device

## 🤝 Contributing

Contributions welcome! Feel free to:
- 🐛 Report bugs
- 💡 Suggest features
- 🔧 Submit pull requests
- ⭐ Star the repo

## 📄 License

MIT License - feel free to use for personal or commercial projects!

## 🙏 Acknowledgments

- Inspired by iOS Screen Time
- Built for students, by students
- Made with ❤️ and ☕

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/nikh27/habit-tracker-2026/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nikh27/habit-tracker-2026/discussions)

## 🎯 Roadmap

- [ ] Cloud sync (Firebase/Supabase)
- [ ] Pomodoro timer integration
- [ ] Export to PDF
- [ ] Habit templates
- [ ] Reminders/notifications
- [ ] Dark theme variations

---

**Made with ❤️ for students who want to track their study progress**

⭐ Star this repo if you find it helpful!
