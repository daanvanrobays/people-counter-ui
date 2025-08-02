/**
 * Configuration constants for the People Counter Dashboard
 */
const CONFIG = {
    // API Configuration
    API: {
        ENDPOINT: atob('aHR0cHM6Ly9hZmYucmV5dGVjaC5iZS9ncm91cGVk'),
        CORS_PROXY: 'https://corsproxy.io/?',
        REFRESH_INTERVAL: 30000, // 30 seconds
        REQUEST_TIMEOUT: 10000   // 10 seconds
    },

    // Device Configuration
    DEVICES: {
        KAMEROTSKI: 'Kamerotski',
        HENK: 'Henk',
        BUTTIN: 'Buttin',
        BUTTOUT: 'Buttout',
        FILTERED_DEVICES: ['Buttin', 'Buttout']
    },

    // Festival Dates
    FESTIVAL_DATES: {
        2024: {
            FULL: { start: '2024-08-02T00:00:00', end: '2024-08-03T23:59:59' },
            FRIDAY: { start: '2024-08-02T00:00:00', end: '2024-08-02T23:59:59' },
            SATURDAY: { start: '2024-08-03T00:00:00', end: '2024-08-03T23:59:59' }
        },
        2025: {
            FULL: { start: '2025-08-01T00:00:00', end: '2025-08-02T23:59:59' },
            FRIDAY: { start: '2025-08-01T00:00:00', end: '2025-08-01T23:59:59' },
            SATURDAY: { start: '2025-08-02T00:00:00', end: '2025-08-02T23:59:59' }
        }
    },

    // Festival Hours
    FESTIVAL_HOURS: {
        FRIDAY: { start: 18, end: 2 },   // 18:00 - 02:00
        SATURDAY: { start: 13, end: 2 }  // 13:00 - 02:00
    },

    // Filter Constants
    FILTERS: {
        DEVICE: {
            ALL: 'all',
            HENK: 'Henk',
            KAMEROTSKI: 'Kamerotski'
        },
        TIME_RANGE: {
            ALL: 'all',
            CUSTOM: 'custom',
            FESTIVAL_2024_FULL: '2024-full',
            FESTIVAL_2024_FRIDAY: '2024-friday',
            FESTIVAL_2024_SATURDAY: '2024-saturday',
            FESTIVAL_2025_FULL: '2025-full',
            FESTIVAL_2025_FRIDAY: '2025-friday',
            FESTIVAL_2025_SATURDAY: '2025-saturday'
        },
        TIME_FILTER: {
            ALL_HOURS: 'all-hours',
            FRIDAY_HOURS: 'friday-hours',
            SATURDAY_HOURS: 'saturday-hours',
            CUSTOM_HOURS: 'custom-hours'
        }
    },

    // UI Configuration
    UI: {
        DEBOUNCE_DELAY: 300,              // milliseconds
        CHART_MAX_HEIGHT: 300,            // pixels
        TABLE_MAX_ROWS: 50,               // rows
        TIMELINE_DATA_POINTS: 288,         // 24 hours of 30-min intervals
        TIME_INTERVAL_MINUTES: 5,        // Chart grouping interval
        COLORS: {
            PRIMARY: '#f3b323',           // AFF orange
            SECONDARY: '#eee7d7',         // Light text
            BACKGROUND: '#245d50',        // Dark green
            ERROR: '#e53e3e',
            SUCCESS: '#38a169'
        }
    },

    // Data Processing
    DATA: {
        BASE_OFFSET: 0,                 // Base people count offset
        TIMEZONE: 'Europe/Brussels'
    },

    // Chart Configuration
    CHARTS: {
        COMMON_OPTIONS: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#eee7d7' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#eee7d7' },
                    grid: { color: 'rgba(238, 231, 215, 0.1)' }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#eee7d7' },
                    grid: { color: 'rgba(238, 231, 215, 0.1)' }
                }
            }
        }
    }
};

// Freeze configuration to prevent accidental modifications
Object.freeze(CONFIG);