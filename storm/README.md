# Storm Chat Application

A modern AI chat interface with voice recognition, file uploads, and memory management.

## 📁 Project Structure

```
DonnaSite/
├── index.html                 # Main landing page
├── Storm.html                 # Legacy redirect to /storm/
└── storm/                     # Storm application folder
    ├── index.html             # Main entry point
    ├── css/
    │   ├── styles.css         # All application styles
    │   └── prism-theme.css    # Code syntax highlighting
    ├── js/
    │   ├── config.js          # Configuration & constants
    │   ├── state.js           # Global application state
    │   ├── ui.js              # UI rendering & updates
    │   ├── socket.js          # Socket.IO handlers
    │   ├── features.js        # Chat features (voice, files, brain)
    │   └── app.js             # Main initialization
    ├── visuals/
    │   └── favicon.png
    └── README.md              # This file
```

## 🔧 Module Overview

### **config.js**
- Backend URL configuration
- Authentication password
- Default settings
- SVG constants

### **state.js**
- Centralized application state
- DOM element caching
- Message history
- Namespace management
- Voice recognition state

### **ui.js**
- Message rendering
- Code block handling
- Syntax highlighting integration
- System messages
- UI utilities (scroll, copy, etc.)

### **socket.js**
- Socket.IO connection management
- Event listeners (connect, disconnect, messages)
- Message sending logic
- Model indicator display
- Brain memory socket events

### **features.js**
- **Voice Recognition**: Speech-to-text functionality
- **File Handling**: Upload and process multiple file types
- **Brain Memory**: AI-powered memory extraction and storage
- **Memory Suggestions**: Smart suggestions from conversations
- **Namespace Management**: Multi-select namespace UI

### **app.js**
- Application initialization
- Authentication flow
- Chat history management
- Namespace multi-select setup
- Event binding

## 🚀 Getting Started

### Requirements
- Modern web browser with ES6 support
- Backend server running at `CONFIG.SOCKET_URL`

### Setup
1. Place the entire `storm/` folder on your web server
2. Update `CONFIG.SOCKET_URL` in `js/config.js` if needed
3. Access via `https://yoursite.com/storm/`

### Configuration
Edit `js/config.js` to customize:
```javascript
const CONFIG = {
    SOCKET_URL: 'https://storm-backend-wqd0.onrender.com',
    PASSWORD: 'hemmelig',  // Change this!
    DEFAULT_MODEL: 'moderate',
    // ...
};
```

## 📦 Dependencies

### External Libraries (CDN)
- **Socket.IO** (4.0.0): Real-time communication
- **Marked.js**: Markdown parsing
- **Prism.js**: Syntax highlighting

### Fonts
- **Inter**: Main UI font
- **Fira Code**: Monospace code font

## 🎨 Features

### Chat Interface
- Real-time messaging with Socket.IO
- Message history persistence
- Multiple chat sessions
- Markdown support with code highlighting

### Voice Features
- Speech-to-text input
- Text-to-speech output
- Voice command: "stop listening"

### File Support
- **Text files**: .txt, .md, .py, .js, .html, .css, .json
- **PDFs**: Basic text extraction
- **Images**: Base64 encoding for AI analysis

### Brain Memory System
- AI-powered memory refinement
- Context-aware extraction
- Namespace organization
- Quick-save suggestions

### Multi-Namespace Support
- Organize conversations by topic
- Select multiple namespaces
- Visual namespace indicators

## 🔄 Migrating from Legacy Storm.html

The monolithic `Storm.html` file has been split into:

| Old Location | New Location | Purpose |
|-------------|--------------|---------|
| Inline `<style>` | `css/styles.css` | Main styles |
| Inline `<style>` | `css/prism-theme.css` | Code highlighting |
| Inline `<script>` (config) | `js/config.js` | Configuration |
| Inline `<script>` (state) | `js/state.js` | State management |
| Inline `<script>` (UI) | `js/ui.js` | Rendering |
| Inline `<script>` (socket) | `js/socket.js` | Network |
| Inline `<script>` (features) | `js/features.js` | Features |
| Inline `<script>` (init) | `js/app.js` | Bootstrap |

## 🛠️ Development

### File Loading Order
Scripts must load in this sequence:
1. External libraries (Socket.IO, Marked, Prism)
2. `config.js` - Constants first
3. `state.js` - State container
4. `ui.js` - UI utilities
5. `socket.js` - Network layer
6. `features.js` - Feature modules
7. `app.js` - Initialization

### Adding New Features
1. Add configuration to `config.js`
2. Add state variables to `state.js`
3. Create UI functions in `ui.js`
4. Handle socket events in `socket.js`
5. Implement feature logic in `features.js`
6. Wire everything up in `app.js`

## 📱 Mobile Support
- Responsive design
- Touch-optimized controls
- Slide-out sidebar navigation
- Adaptive button layouts

## 🔐 Security Notes
- **Change the default password** in `config.js`
- Consider implementing proper authentication
- Sanitize user inputs server-side
- Use HTTPS in production

## 🐛 Debugging

### Common Issues
1. **"Socket not initialized"**: Check `CONFIG.SOCKET_URL`
2. **Speech recognition not working**: Browser compatibility (Chrome/Edge recommended)
3. **Files not uploading**: Check file size limits and CORS headers
4. **Brain modal not appearing**: Verify backend `/brain_request` endpoint

### Console Logging
Key log messages to watch for:
- `"Socket.IO client initialized"` - Connection started
- `"✅ Connected to socket server"` - Connection successful
- `"Selected namespaces: [...]"` - Namespace changes

## 📊 Performance

### Optimizations
- DOM element caching in `AppState.elements`
- Lazy-loaded syntax highlighting
- Efficient message rendering
- Debounced voice recognition

### Browser Support
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ⚠️ Mobile browsers (limited voice features)

## 📄 License
No use without permission from Nikolaj Storm Petersen

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support
For issues or questions, please [open an issue](your-repo-url) or contact [your-email].

---

**Built with ❤️ by Nikolaj Storm Petersen**
