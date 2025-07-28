# AFF People Counter Dashboard

A real-time dashboard for visualizing people counter data from the Absolutely Free Festival (AFF). This web application provides interactive charts, statistics, and filtering capabilities to analyze festival attendance patterns.

![AFF Dashboard](https://img.shields.io/badge/Status-Live-brightgreen) ![GitHub Pages](https://img.shields.io/badge/Deployment-GitHub%20Pages-blue) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)

## 🚀 Live Demo

Visit the live dashboard: [https://daanvanrobays.github.io/people-counter-ui/](https://daanvanrobays.github.io/people-counter-ui/)

## 📊 Features

### **Real-time Data Visualization**
- **Timeline Chart**: Movement patterns over time with 30-minute intervals
- **Distribution Chart**: Inside vs Outside ratio visualization
- **Device Activity**: Individual device performance metrics
- **Delta Changes**: Real-time change tracking

### **Advanced Filtering**
- **Device Filtering**: Filter by specific counter devices (Kamerotski IN, Henk OUT)
- **Festival Periods**: Pre-configured date ranges for AFF 2024 & 2025
- **Active Hours**: Festival-specific time filters (Friday 18:00-02:00, Saturday 13:00-02:00)
- **Custom Ranges**: Flexible date and time range selection

### **Smart User Experience**
- **Linked Filters**: Festival period automatically suggests appropriate active hours
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Auto-refresh**: Real-time data updates every 30 seconds
- **Performance Optimized**: Debounced filtering and efficient chart updates

## 🛠 Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Charts**: Chart.js for interactive visualizations
- **Styling**: Custom CSS with AFF brand colors
- **Deployment**: GitHub Pages with automated CI/CD
- **Architecture**: Modular, performance-optimized design

## 📁 Project Structure

```
people-counter-ui/
├── index.html              # Main dashboard HTML
├── script.js               # Core dashboard logic
├── config.js               # Configuration constants
├── styles.css              # AFF-branded styling
├── README.md               # Project documentation
├── CLAUDE.md               # Development improvements log
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Pages deployment
└── example.json            # Sample data format
```

## 🚀 Quick Start

### **Local Development**

1. **Clone the repository**:
   ```bash
   git clone https://github.com/daanvanrobays/people-counter-ui.git
   cd people-counter-ui
   ```

2. **Serve locally** (due to CORS restrictions):
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**:
   ```
   http://localhost:8000
   ```

### **GitHub Pages Deployment**

The project automatically deploys to GitHub Pages when changes are pushed to the `main` branch. The deployment workflow is configured in `.github/workflows/deploy.yml`.

## ⚙️ Configuration

### **Festival Dates** (`config.js`)
```javascript
FESTIVAL_DATES: {
    2024: {
        FULL: { start: '2024-08-02T00:00:00', end: '2024-08-03T23:59:59' },
        FRIDAY: { start: '2024-08-02T00:00:00', end: '2024-08-02T23:59:59' },
        SATURDAY: { start: '2024-08-03T00:00:00', end: '2024-08-03T23:59:59' }
    }
}
```

### **API Configuration**
```javascript
API: {
    ENDPOINT: '',
    REFRESH_INTERVAL: 30000, // 30 seconds
    REQUEST_TIMEOUT: 10000   // 10 seconds
}
```

### **UI Customization**
```javascript
UI: {
    DEBOUNCE_DELAY: 300,              // Filter debounce
    TIMELINE_DATA_POINTS: 48,         // Chart data points
    TIME_INTERVAL_MINUTES: 30,        // Grouping interval
    COLORS: {
        PRIMARY: '#f3b323',           // AFF orange
        SECONDARY: '#eee7d7',         // Light text
        BACKGROUND: '#245d50'         // Dark green
    }
}
```


## 🎯 Festival-Specific Features

### **Device Logic**
- **Kamerotski**: IN counter (people entering)
- **Henk**: OUT counter (people leaving)
- **Base Offset**: +0 people (pre-festival attendance)

### **Festival Hours**
- **Friday**: 18:00 - 02:00 (next day)
- **Saturday**: 13:00 - 02:00 (next day)

### **Data Processing**
- Filters out maintenance devices (Buttin, Buttout)
- Applies cutoff date logic for accurate calculations
- Europe/Brussels timezone formatting

### **Development Guidelines**
- Follow existing code style and structure
- Update configuration in `config.js` for new features
- Add JSDoc documentation for new methods
- Test across different screen sizes and browsers

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👥 Authors

- **Daan van Robays** - *Initial work* - [@daanvanrobays](https://github.com/daanvanrobays)
- **Claude Code** - *Performance optimizations and architecture improvements*

## 🙏 Acknowledgments

- **Absolutely Free Festival** for the event and data
- **Chart.js** for excellent charting capabilities
- **GitHub Pages** for free hosting
- The open source community for inspiration and tools

---

**Built with ❤️ for the Absolutely Free Festival community**