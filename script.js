class PeopleCounterDashboard {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.charts = {};

        const endpoint = atob('aHR0cHM6Ly9hZmYucmV5dGVjaC5iZS9ncm91cGVk');
        this.apiUrl = 'https://corsproxy.io/?' + endpoint;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.fetchData();
        this.renderDashboard();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        const deviceFilter = document.getElementById('deviceFilter');
        const timeRange = document.getElementById('timeRange');
        const timeFilter = document.getElementById('timeFilter');
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        const startHour = document.getElementById('startHour');
        const endHour = document.getElementById('endHour');

        deviceFilter.addEventListener('change', () => this.filterData());
        timeRange.addEventListener('change', () => {
            this.toggleCustomDateRange();
            this.linkFestivalPeriodToActiveHours();
            this.filterData();
        });
        timeFilter.addEventListener('change', () => {
            this.toggleCustomTimeRange();
            this.filterData();
        });
        startDate.addEventListener('change', () => this.filterData());
        endDate.addEventListener('change', () => this.filterData());
        startHour.addEventListener('change', () => this.filterData());
        endHour.addEventListener('change', () => this.filterData());
    }

    toggleCustomDateRange() {
        const timeRange = document.getElementById('timeRange').value;
        const customDateRange = document.getElementById('customDateRange');
        
        if (timeRange === 'custom') {
            customDateRange.style.display = 'flex';
            customDateRange.style.gap = '10px';
            customDateRange.style.alignItems = 'center';
        } else {
            customDateRange.style.display = 'none';
        }
    }

    toggleCustomTimeRange() {
        const timeFilter = document.getElementById('timeFilter').value;
        const customTimeRange = document.getElementById('customTimeRange');
        
        if (timeFilter === 'custom-hours') {
            customTimeRange.style.display = 'flex';
            customTimeRange.style.gap = '10px';
            customTimeRange.style.alignItems = 'center';
        } else {
            customTimeRange.style.display = 'none';
        }
    }

    linkFestivalPeriodToActiveHours() {
        const timeRange = document.getElementById('timeRange').value;
        const timeFilter = document.getElementById('timeFilter');
        
        // Update options based on selected period
        this.updateActiveHoursOptions(timeRange);
        
        // Auto-select appropriate festival hours based on selected period
        switch (timeRange) {
            case '2024-friday':
            case '2025-friday':
                timeFilter.value = 'friday-hours';
                break;
            case '2024-saturday':
            case '2025-saturday':
                timeFilter.value = 'saturday-hours';
                break;
            case '2024-full':
            case '2025-full':
                // For full festival, keep current selection or default to all hours
                if (timeFilter.value === 'friday-hours' || timeFilter.value === 'saturday-hours') {
                    // Keep the current specific day selection
                } else {
                    timeFilter.value = 'all-hours';
                }
                break;
            default:
                // For custom or all time, don't change time filter automatically
                break;
        }
        
        // Update the custom time range visibility
        this.toggleCustomTimeRange();
    }

    updateActiveHoursOptions(timeRange) {
        const timeFilter = document.getElementById('timeFilter');
        const currentValue = timeFilter.value;
        
        // Clear existing options
        timeFilter.innerHTML = '';
        
        // Add base option
        timeFilter.appendChild(new Option('All Hours', 'all-hours'));
        
        // Add contextual options based on selected period
        switch (timeRange) {
            case '2024-friday':
            case '2025-friday':
                timeFilter.appendChild(new Option('Festival Hours (18:00-02:00) - Recommended', 'friday-hours'));
                timeFilter.appendChild(new Option('Custom Time Range', 'custom-hours'));
                break;
            case '2024-saturday':
            case '2025-saturday':
                timeFilter.appendChild(new Option('Festival Hours (13:00-02:00) - Recommended', 'saturday-hours'));
                timeFilter.appendChild(new Option('Custom Time Range', 'custom-hours'));
                break;
            case '2024-full':
            case '2025-full':
                timeFilter.appendChild(new Option('Friday Hours (18:00-02:00)', 'friday-hours'));
                timeFilter.appendChild(new Option('Saturday Hours (13:00-02:00)', 'saturday-hours'));
                timeFilter.appendChild(new Option('Custom Time Range', 'custom-hours'));
                break;
            default:
                // For custom or all time, show all options
                timeFilter.appendChild(new Option('Friday Festival Hours (18:00-02:00)', 'friday-hours'));
                timeFilter.appendChild(new Option('Saturday Festival Hours (13:00-02:00)', 'saturday-hours'));
                timeFilter.appendChild(new Option('Custom Time Range', 'custom-hours'));
                break;
        }
        
        // Restore previous selection if still valid
        const options = Array.from(timeFilter.options);
        const validOption = options.find(option => option.value === currentValue);
        if (validOption) {
            timeFilter.value = currentValue;
        }
    }

    async fetchData() {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error('Failed to fetch data');
            
            const rawData = await response.json();
            
            // Handle different data formats
            let processedData;
            if (Array.isArray(rawData)) {
                processedData = rawData;
            } else if (rawData && typeof rawData === 'object') {
                // If data is grouped by device, flatten it
                processedData = Object.values(rawData).flat();
            } else {
                throw new Error('Invalid data format received');
            }
            
            // Filter out Buttin and Buttout devices
            this.data = processedData.filter(item => 
                item.apparaat !== 'Buttin' && item.apparaat !== 'Buttout'
            );
            
            this.filterData();
            this.updateLastUpdated();
        } catch (error) {
            console.error('Error fetching data:', error);
            this.showError('Failed to load data. Please try again later.');
        }
    }

    filterData() {
        const deviceFilter = document.getElementById('deviceFilter').value;
        const timeRange = document.getElementById('timeRange').value;
        const timeFilter = document.getElementById('timeFilter').value;

        let filtered = [...this.data];

        // Filter by device
        if (deviceFilter !== 'all') {
            filtered = filtered.filter(item => item.apparaat === deviceFilter);
        }

        // Filter by date range
        if (timeRange !== 'all') {
            let startDate, endDate;
            
            switch (timeRange) {
                // 2024 Festival Options
                case '2024-full':
                    startDate = new Date('2024-08-02T00:00:00');
                    endDate = new Date('2024-08-03T23:59:59');
                    break;
                case '2024-friday':
                    startDate = new Date('2024-08-02T00:00:00');
                    endDate = new Date('2024-08-02T23:59:59');
                    break;
                case '2024-saturday':
                    startDate = new Date('2024-08-03T00:00:00');
                    endDate = new Date('2024-08-03T23:59:59');
                    break;
                
                // 2025 Festival Options
                case '2025-full':
                    startDate = new Date('2025-08-01T00:00:00');
                    endDate = new Date('2025-08-02T23:59:59');
                    break;
                case '2025-friday':
                    startDate = new Date('2025-08-01T00:00:00');
                    endDate = new Date('2025-08-01T23:59:59');
                    break;
                case '2025-saturday':
                    startDate = new Date('2025-08-02T00:00:00');
                    endDate = new Date('2025-08-02T23:59:59');
                    break;
                
                // Custom Range
                case 'custom':
                    const startInput = document.getElementById('startDate').value;
                    const endInput = document.getElementById('endDate').value;
                    startDate = new Date(startInput + 'T00:00:00');
                    endDate = new Date(endInput + 'T23:59:59');
                    break;
            }

            if (startDate && endDate) {
                filtered = filtered.filter(item => {
                    const itemDate = new Date(item.timestamp);
                    return itemDate >= startDate && itemDate <= endDate;
                });
            }
        }

        // Filter by time of day
        if (timeFilter !== 'all-hours') {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.timestamp);
                const hour = itemDate.getHours();
                
                switch (timeFilter) {
                    case 'friday-hours':
                        // Friday: 18:00 - 02:00 (next day)
                        return hour >= 18 || hour < 2;
                    case 'saturday-hours':
                        // Saturday: 13:00 - 02:00 (next day)
                        return hour >= 13 || hour < 2;
                    case 'custom-hours':
                        const startHour = document.getElementById('startHour').value;
                        const endHour = document.getElementById('endHour').value;
                        const startTime = parseInt(startHour.split(':')[0]) + parseInt(startHour.split(':')[1]) / 60;
                        const endTime = parseInt(endHour.split(':')[0]) + parseInt(endHour.split(':')[1]) / 60;
                        const itemTime = hour + itemDate.getMinutes() / 60;
                        
                        if (startTime <= endTime) {
                            return itemTime >= startTime && itemTime < endTime;
                        } else {
                            // Handle overnight ranges (e.g., 18:00 to 02:00)
                            return itemTime >= startTime || itemTime < endTime;
                        }
                    default:
                        return true;
                }
            });
        }

        // Sort by timestamp descending (newest first)
        this.filteredData = filtered.sort((a, b) => {
            const dateA = new Date(a.timestamp);
            const dateB = new Date(b.timestamp);
            return dateB - dateA;
        });

        this.renderDashboard();
    }

    renderDashboard() {
        this.updateStats();
        this.renderCharts();
        this.renderTable();
    }

    updateStats() {
        const stats = this.calculateStats();
        
        document.getElementById('totalInside').textContent = stats.totalInside.toLocaleString();
        document.getElementById('totalOutside').textContent = stats.totalOutside.toLocaleString();
        document.getElementById('netMovement').textContent = stats.netMovement.toLocaleString();
        document.getElementById('activeDevices').textContent = stats.activeDevices;
    }

    calculateStats() {
        // Calculate totals based on device logic: Kamerotski = IN, Henk = OUT
        const kamerotskiData = this.filteredData.filter(item => item.apparaat === 'Kamerotski');
        const henkData = this.filteredData.filter(item => item.apparaat === 'Henk');
        
        // Sum deltas for each device (after 2024-08-03)
        const filteredAfter = this.filteredData.filter(item => 
            new Date(item.timestamp) > new Date('2024-08-03')
        );
        
        const camIn = filteredAfter
            .filter(item => item.apparaat === 'Kamerotski')
            .reduce((sum, item) => sum + (item.delta || 0), 0);
            
        const camOut = filteredAfter
            .filter(item => item.apparaat === 'Henk')
            .reduce((sum, item) => sum + (item.delta || 0), 0);
        
        // Apply the same logic as the backend
        const totalInside = camIn;
        const totalOutside = camOut;
        const netMovement = (camIn - camOut);
        const activeDevices = new Set(this.filteredData.map(item => item.apparaat)).size;

        return { totalInside, totalOutside, netMovement, activeDevices };
    }

    getLatestByDevice() {
        const latest = {};
        
        this.filteredData.forEach(item => {
            if (!latest[item.apparaat] || 
                new Date(item.timestamp) > new Date(latest[item.apparaat].timestamp)) {
                latest[item.apparaat] = item;
            }
        });

        return latest;
    }

    renderCharts() {
        this.renderTimelineChart();
        this.renderDistributionChart();
        this.renderDeviceChart();
        this.renderDeltaChart();
    }

    renderTimelineChart() {
        const ctx = document.getElementById('timelineChart').getContext('2d');
        
        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }

        const timeData = this.prepareTimelineData();

        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeData.labels,
                datasets: [
                    {
                        label: 'Inside',
                        data: timeData.inside,
                        borderColor: '#f3b323',
                        backgroundColor: 'rgba(243, 179, 35, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Outside',
                        data: timeData.outside,
                        borderColor: '#eee7d7',
                        backgroundColor: 'rgba(238, 231, 215, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#eee7d7'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#eee7d7'
                        },
                        grid: {
                            color: 'rgba(238, 231, 215, 0.1)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#eee7d7'
                        },
                        grid: {
                            color: 'rgba(238, 231, 215, 0.1)'
                        }
                    }
                }
            }
        });
    }

    renderDistributionChart() {
        const ctx = document.getElementById('distributionChart').getContext('2d');
        
        if (this.charts.distribution) {
            this.charts.distribution.destroy();
        }

        const stats = this.calculateStats();

        this.charts.distribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Inside', 'Outside'],
                datasets: [{
                    data: [stats.totalInside, stats.totalOutside],
                    backgroundColor: ['#f3b323', '#eee7d7']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#eee7d7'
                        }
                    }
                }
            }
        });
    }

    renderDeviceChart() {
        const ctx = document.getElementById('deviceChart').getContext('2d');
        
        if (this.charts.device) {
            this.charts.device.destroy();
        }

        const deviceData = this.prepareDeviceData();

        this.charts.device = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: deviceData.labels,
                datasets: [
                    {
                        label: 'Inside',
                        data: deviceData.inside,
                        backgroundColor: '#f3b323'
                    },
                    {
                        label: 'Outside',
                        data: deviceData.outside,
                        backgroundColor: '#eee7d7'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#eee7d7'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#eee7d7'
                        },
                        grid: {
                            color: 'rgba(238, 231, 215, 0.1)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#eee7d7'
                        },
                        grid: {
                            color: 'rgba(238, 231, 215, 0.1)'
                        }
                    }
                }
            }
        });
    }

    renderDeltaChart() {
        const ctx = document.getElementById('deltaChart').getContext('2d');
        
        if (this.charts.delta) {
            this.charts.delta.destroy();
        }

        const deltaData = this.prepareDeltaData();

        this.charts.delta = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: deltaData.labels,
                datasets: [{
                    label: 'Delta Changes',
                    data: deltaData.values,
                    backgroundColor: deltaData.values.map(v => v >= 0 ? '#f3b323' : '#eee7d7')
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#eee7d7'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#eee7d7'
                        },
                        grid: {
                            color: 'rgba(238, 231, 215, 0.1)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#eee7d7'
                        },
                        grid: {
                            color: 'rgba(238, 231, 215, 0.1)'
                        }
                    }
                }
            }
        });
    }

    prepareTimelineData() {
        const grouped = {};
        
        // Sort filtered data by timestamp first
        const sortedData = [...this.filteredData].sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        sortedData.forEach(item => {
            const date = new Date(item.timestamp);
            
            // Create a unique key that includes both date and hour for proper grouping
            const dateKey = date.toLocaleDateString('en-GB', {
                timeZone: 'Europe/Brussels',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const hour = date.getHours();
            const minute = Math.floor(date.getMinutes() / 30) * 30; // Group by 30-minute intervals
            
            const timeKey = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const fullKey = `${dateKey} ${timeKey}`;
            
            if (!grouped[fullKey]) {
                grouped[fullKey] = { 
                    inside: 0, 
                    outside: 0, 
                    count: 0, 
                    timestamp: date.getTime(),
                    displayLabel: date.toLocaleString('en-GB', {
                        timeZone: 'Europe/Brussels',
                        weekday: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                };
            }
            
            grouped[fullKey].inside += (item.binnen || 0);
            grouped[fullKey].outside += (item.buiten || 0);
            grouped[fullKey].count++;
        });

        // Sort by actual timestamp
        const sortedEntries = Object.entries(grouped).sort((a, b) => 
            a[1].timestamp - b[1].timestamp
        );

        // Take last 48 data points (24 hours worth of 30-min intervals)
        const recentEntries = sortedEntries.slice(-48);
        
        const labels = recentEntries.map(([key, data]) => data.displayLabel);
        const inside = recentEntries.map(([key, data]) => 
            data.count > 0 ? Math.round(data.inside / data.count) : 0
        );
        const outside = recentEntries.map(([key, data]) => 
            data.count > 0 ? Math.round(data.outside / data.count) : 0
        );

        return { labels, inside, outside };
    }

    prepareDeviceData() {
        const latest = this.getLatestByDevice();
        
        const labels = Object.keys(latest);
        const inside = labels.map(device => latest[device].binnen || 0);
        const outside = labels.map(device => latest[device].buiten || 0);

        return { labels, inside, outside };
    }

    prepareDeltaData() {
        const recentData = this.filteredData.slice(0, 20);
        
        const labels = recentData.map(item => 
            `${new Date(item.timestamp).toLocaleString('en-GB', {
                timeZone: 'Europe/Brussels',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })}`
        );
        const values = recentData.map(item => item.delta);

        return { labels, values };
    }

    renderTable() {
        const tbody = document.getElementById('activityTableBody');
        tbody.innerHTML = '';

        const recentData = this.filteredData.slice(0, 50);

        recentData.forEach(item => {
            const row = document.createElement('tr');
            const date = new Date(item.timestamp);
            const dateStr = date.toLocaleDateString('en-GB', {
                timeZone: 'Europe/Brussels',
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            });
            const timeStr = date.toLocaleTimeString('en-GB', {
                timeZone: 'Europe/Brussels',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            row.innerHTML = `
                <td>${item.apparaat}</td>
                <td>
                    <div style="font-size: 0.8em; color: rgba(238, 231, 215, 0.7);">${dateStr}</div>
                    <div style="font-weight: bold; font-size: 1.1em;">${timeStr}</div>
                </td>
                <td>${(item.binnen || 0).toLocaleString()}</td>
                <td>${(item.buiten || 0).toLocaleString()}</td>
                <td class="${item.delta >= 0 ? 'positive' : 'negative'}">${item.delta}</td>
                <td>${(item.totaal || 0).toLocaleString()}</td>
            `;
            tbody.appendChild(row);
        });
    }

    updateLastUpdated() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB', {
            timeZone: 'Europe/Brussels',
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('en-GB', {
            timeZone: 'Europe/Brussels',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('lastUpdated').textContent = `${dateStr} at ${timeStr}`;
    }

    showError(message) {
        const container = document.querySelector('.container');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        container.insertBefore(errorDiv, container.firstChild);
    }

    startAutoRefresh() {
        setInterval(() => {
            this.fetchData();
        }, 30000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PeopleCounterDashboard();
});