# SmartQuiz Chrome Extension 🧠

A smart quiz extension to help you learn and test your knowledge directly from your browser. SmartQuiz offers interactive quizzes across multiple categories and the ability to create custom quizzes from web content.

## Features

✨ **Multiple Quiz Categories**: General Knowledge, Science, History, Technology, and Sports  
🎯 **Interactive Interface**: Clean, modern popup interface with smooth animations  
📊 **Progress Tracking**: Keep track of your quiz scores and statistics  
🔍 **Content Integration**: Create quizzes from selected text on any webpage  
💾 **Local Storage**: All your progress is saved locally in your browser  
🎨 **Beautiful Design**: Modern gradient design with responsive layout  

## Installation

### Method 1: Load Unpacked Extension (Development)

1. **Download or Clone** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by clicking the toggle in the top right corner
4. **Click "Load unpacked"** button
5. **Select** the SmartQuiz folder containing the `manifest.json` file
6. **The extension icon** should now appear in your Chrome toolbar

### Method 2: Chrome Web Store (Coming Soon)
The extension will be available on the Chrome Web Store for easy installation.

## Usage

### Taking a Quiz

1. **Click the SmartQuiz icon** in your Chrome toolbar
2. **Select a category** from the dropdown menu
3. **Click "Start Quiz"** to begin
4. **Answer questions** by clicking on the options
5. **View your results** and performance feedback
6. **Take another quiz** or return to the main menu

### Creating Custom Quizzes

1. **Select text** on any webpage
2. **Click the "🧠 Quiz" button** that appears near your selection
3. The extension will analyze the content (feature in development)

### Context Menu Features

- **Right-click** on any webpage to access quick quiz options
- **"Start Quick Quiz"** - Opens the extension popup
- **"Quiz about this page topic"** - Analyzes page content for quiz creation

## Extension Structure

```
SmartQuiz/
├── manifest.json          # Extension configuration
├── popup.html            # Main interface HTML
├── popup.css             # Styling for the interface
├── popup.js              # Quiz logic and functionality
├── background.js         # Background service worker
├── content.js            # Content script for webpage interaction
├── icons/                # Extension icons (to be added)
│   └── README.md         # Icon guidelines
└── README.md             # This file
```

## File Descriptions

- **`manifest.json`**: Defines extension permissions, scripts, and metadata
- **`popup.html/css/js`**: The main quiz interface that appears when clicking the extension icon
- **`background.js`**: Handles extension lifecycle, storage, and cross-tab communication
- **`content.js`**: Runs on web pages to enable text selection and page analysis features

## Quiz Categories

- **General Knowledge**: Basic facts about the world
- **Science**: Physics, chemistry, biology, and general science
- **History**: Historical events and figures
- **Technology**: Computing, internet, and modern technology
- **Sports**: Sports facts and trivia

## Privacy & Data

- **No data collection**: All quiz data and scores are stored locally
- **No external servers**: The extension works completely offline
- **Minimal permissions**: Only requests necessary permissions for functionality

## Development

### Adding New Questions

Edit the `quizData` object in `popup.js` to add new questions:

```javascript
const quizData = {
    categoryName: [
        {
            question: "Your question here?",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correct: 0 // Index of correct answer (0-3)
        }
    ]
};
```

### Customizing Styles

Modify `popup.css` to change the appearance:
- Colors: Update the gradient values and color variables
- Layout: Adjust padding, margins, and flexbox properties
- Animations: Modify the CSS animations and transitions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## Future Features

- 🎮 More quiz categories and question types
- 🤖 AI-powered quiz generation from webpage content
- 🏆 Achievement system and badges
- 📈 Advanced statistics and progress tracking
- 🌓 Dark/light theme toggle
- 📱 Mobile-responsive design
- 🔄 Quiz sharing and import/export

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have suggestions:
1. Check the browser console for error messages
2. Ensure you have the latest version of Chrome
3. Try reloading the extension from `chrome://extensions/`
4. Open an issue on the GitHub repository

---

**Made with ❤️ for learning and knowledge sharing**
