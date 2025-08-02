class PeopleCounterDashboard {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.charts = {};
        this.debounceTimer = null;
        this.refreshInterval = null;
        
        this.elements = {};
        
        // API Configuration
        this.apiUrl = CONFIG.API.CORS_PROXY + CONFIG.API.ENDPOINT;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.fetchData();
        this.renderDashboard();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        this.elements = {
            deviceFilter: document.getElementById('deviceFilter'),
            timePeriod: document.getElementById('timePeriod'),
            startDate: document.getElementById('startDate'),
            endDate: document.getElementById('endDate'),
            startTime: document.getElementById('startTime'),
            endTime: document.getElementById('endTime'),
            customRange: document.getElementById('customRange'),
            totalInside: document.getElementById('totalInside'),
            totalOutside: document.getElementById('totalOutside'),
            netMovement: document.getElementById('netMovement'),
            activeDevices: document.getElementById('activeDevices'),
            lastUpdated: document.getElementById('lastUpdated'),
            activityTableBody: document.getElementById('activityTableBody')
        };

        // Setup event listeners with debounced filtering
        this.elements.deviceFilter.addEventListener('change', () => this.debouncedFilterData());
        this.elements.timePeriod.addEventListener('change', () => {
            this.toggleCustomRange();
            this.debouncedFilterData();
        });
        this.elements.startDate.addEventListener('change', () => this.debouncedFilterData());
        this.elements.endDate.addEventListener('change', () => this.debouncedFilterData());
        this.elements.startTime.addEventListener('change', () => this.debouncedFilterData());
        this.elements.endTime.addEventListener('change', () => this.debouncedFilterData());
    }

    debouncedFilterData() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.filterData();
        }, CONFIG.UI.DEBOUNCE_DELAY);
    }

    toggleCustomRange() {
        const timePeriod = this.elements.timePeriod.value;
        const customRange = this.elements.customRange;
        
        if (timePeriod === 'custom') {
            customRange.style.display = 'block';
        } else {
            customRange.style.display = 'none';
        }
    }


    async fetchData() {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error('Failed to fetch data');
            
            const rawData = await response.json();
            
            let processedData;
            if (Array.isArray(rawData)) {
                processedData = rawData;
            } else if (rawData && typeof rawData === 'object') {
                // If data is grouped by device, flatten it
                processedData = Object.values(rawData).flat();
            } else {
                throw new Error('Invalid data format received');
            }
            
            // Filter out unwanted devices using config
            this.data = processedData.filter(item => 
                !CONFIG.DEVICES.FILTERED_DEVICES.includes(item.apparaat)
            );
            
            this.filterData();
            this.updateLastUpdated();
        } catch (error) {
            console.error('Error fetching data:', error);
            this.showError('Failed to load data. Please try again later.');
        }
    }

    filterData() {
        const deviceFilter = this.elements.deviceFilter.value;
        const timePeriod = this.elements.timePeriod.value;

        let filtered = [...this.data];

        // Apply filters in sequence
        filtered = this._filterByDevice(filtered, deviceFilter);
        filtered = this._filterByTimePeriod(filtered, timePeriod);

        // Sort by timestamp descending (newest first)
        this.filteredData = this._sortByTimestamp(filtered);

        this.renderDashboard();
    }

    _filterByDevice(data, deviceFilter) {
        if (deviceFilter === CONFIG.FILTERS.DEVICE.ALL) {
            return data;
        }
        return data.filter(item => item.apparaat === deviceFilter);
    }

    _filterByTimePeriod(data, timePeriod) {
        if (timePeriod === 'all') {
            return data;
        }

        const timeRange = this._getTimePeriodRange(timePeriod);
        if (!timeRange) {
            return data;
        }

        return data.filter(item => {
            const itemDate = new Date(item.timestamp);
            return this._isWithinTimeRange(itemDate, timeRange);
        });
    }

    _getTimePeriodRange(timePeriod) {
        const now = new Date();
        
        switch (timePeriod) {
            case '2024-friday-festival':
                return {
                    type: 'friday-festival',
                    year: 2024,
                    startDate: '2024-08-02',
                    endDate: '2024-08-02', // Friday only
                    festivalHours: 'friday'
                };
            case '2024-saturday-festival':
                return {
                    type: 'saturday-festival',
                    year: 2024,
                    startDate: '2024-08-03',
                    endDate: '2024-08-03', // Saturday only
                    festivalHours: 'saturday'
                };
            case '2024-full-festival':
                return {
                    type: 'full-festival',
                    year: 2024,
                    startDate: '2024-08-02',
                    endDate: '2024-08-03',
                    festivalHours: 'both'
                };
                
            case '2025-friday-festival':
                return {
                    type: 'friday-festival',
                    year: 2025,
                    startDate: '2025-08-01',
                    endDate: '2025-08-01', // Friday only
                    festivalHours: 'friday'
                };
            case '2025-saturday-festival':
                return {
                    type: 'saturday-festival', 
                    year: 2025,
                    startDate: '2025-08-02',
                    endDate: '2025-08-02', // Saturday only
                    festivalHours: 'saturday'
                };
            case '2025-full-festival':
                return {
                    type: 'full-festival',
                    year: 2025,
                    startDate: '2025-08-01',
                    endDate: '2025-08-02',
                    festivalHours: 'both'
                };
                
            case 'last-24h':
                const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                return {
                    type: 'recent',
                    startDate: yesterday.toISOString().split('T')[0],
                    endDate: now.toISOString().split('T')[0],
                    allDay: true
                };

            case 'last-1h':
                const hourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
                return {
                    type: 'recent',
                    startDate: hourAgo.toISOString().split('T')[0],
                    endDate: now.toISOString().split('T')[0],
                    allDay: true
                };
                
            case 'custom':
                const startDate = this.elements.startDate.value;
                const endDate = this.elements.endDate.value;
                const startTime = this.elements.startTime.value;
                const endTime = this.elements.endTime.value;
                
                if (startDate && endDate) {
                    const hasTimeRange = startTime && endTime && (startTime !== '00:00' || endTime !== '23:59');
                    return {
                        type: 'custom',
                        startDate: startDate,
                        endDate: endDate,
                        timeStart: hasTimeRange ? startTime : null,
                        timeEnd: hasTimeRange ? endTime : null,
                        allDay: !hasTimeRange,
                        custom: true
                    };
                }
                break;
        }
        return null;
    }

    _isWithinTimeRange(itemDate, timeRange) {
        const itemDateStr = itemDate.toISOString().split('T')[0];
        const itemHour = itemDate.getHours();
        const itemMinute = itemDate.getMinutes();
        
        // Check basic date range first
        if (itemDateStr < timeRange.startDate || itemDateStr > timeRange.endDate) {
            // Special case: for overnight festival hours, we need to check the next day for early morning hours
            if (timeRange.festivalHours && itemHour < 6) { // Early morning hours (00:00-06:00)
                const prevDay = new Date(itemDate.getTime() - 24 * 60 * 60 * 1000);
                const prevDateStr = prevDay.toISOString().split('T')[0];
                if (prevDateStr < timeRange.startDate || prevDateStr > timeRange.endDate) {
                    return false;
                }
            } else {
                return false;
            }
        }
        
        // All day filter
        if (timeRange.allDay) {
            return true;
        }
        
        // Festival hours logic
        if (timeRange.festivalHours) {
            return this._isWithinFestivalHours(itemDate, timeRange);
        }
        
        // Custom time range
        if (timeRange.timeStart && timeRange.timeEnd) {
            const startTime = this._parseTimeToDecimal(timeRange.timeStart);
            const endTime = this._parseTimeToDecimal(timeRange.timeEnd);
            
            if (timeRange.custom && startTime > endTime) {
                // Handle overnight custom ranges
                const itemTime = itemHour + itemMinute / 60;
                return itemTime >= startTime || itemTime <= endTime;
            } else {
                const itemTime = itemHour + itemMinute / 60;
                return itemTime >= startTime && itemTime <= endTime;
            }
        }
        
        return true;
    }

    _isWithinFestivalHours(itemDate, timeRange) {
        const itemHour = itemDate.getHours();
        const itemDateStr = itemDate.toISOString().split('T')[0];
        
        // Determine which day this is relative to festival dates
        const isFridayDate = (timeRange.year === 2024 && itemDateStr === '2024-08-02') ||
                           (timeRange.year === 2025 && itemDateStr === '2025-08-01');
        const isSaturdayDate = (timeRange.year === 2024 && itemDateStr === '2024-08-03') ||
                             (timeRange.year === 2025 && itemDateStr === '2025-08-02');
        
        // Handle early morning hours (00:00-06:00) - these belong to the previous day's festival
        const isEarlyMorning = itemHour >= 0 && itemHour < 6;
        
        switch (timeRange.festivalHours) {
            case 'friday':
                if (isFridayDate) {
                    // Friday 18:00-23:59
                    return itemHour >= 18;
                }
                if (isSaturdayDate && isEarlyMorning) {
                    // Saturday 00:00-02:00 (continuation of Friday festival)
                    return itemHour < 2;
                }
                return false;
                
            case 'saturday':
                if (isSaturdayDate) {
                    // Saturday 13:00-23:59
                    return itemHour >= 13;
                }
                if (timeRange.year === 2024 && itemDateStr === '2024-08-04' && isEarlyMorning) {
                    // Sunday 00:00-02:00 (continuation of Saturday festival)
                    return itemHour < 2;
                }
                if (timeRange.year === 2025 && itemDateStr === '2025-08-03' && isEarlyMorning) {
                    // Sunday 00:00-02:00 (continuation of Saturday festival)
                    return itemHour < 2;
                }
                return false;
                
            case 'both':
                // Friday festival hours
                if (isFridayDate && itemHour >= 18) return true;
                if (isSaturdayDate && itemHour < 2) return true; // Early morning continuation
                
                // Saturday festival hours  
                if (isSaturdayDate && itemHour >= 13) return true;
                
                // Sunday early morning (continuation of Saturday)
                if (timeRange.year === 2024 && itemDateStr === '2024-08-04' && itemHour < 2) return true;
                if (timeRange.year === 2025 && itemDateStr === '2025-08-03' && itemHour < 2) return true;
                
                return false;
        }
        
        return false;
    }


    _parseTimeToDecimal(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours + minutes / 60;
    }

    _sortByTimestamp(data) {
        return data.sort((a, b) => {
            const dateA = new Date(a.timestamp);
            const dateB = new Date(b.timestamp);
            return dateB - dateA; // Newest first
        });
    }

    renderDashboard() {
        this.updateStats();
        this.renderCharts();
        this.renderTable();
    }

    updateStats() {
        const stats = this.calculateStats();
        
        this.elements.totalInside.textContent = stats.totalInside.toLocaleString();
        this.elements.totalOutside.textContent = stats.totalOutside.toLocaleString();
        this.elements.netMovement.textContent = stats.netMovement.toLocaleString();
        this.elements.activeDevices.textContent = stats.activeDevices;
        
    }

    calculateStats() {
        // Calculate totals based on device logic: Kamerotski = IN, Henk = OUT

        const camIn = this.filteredData
            .filter(item => item.apparaat === CONFIG.DEVICES.KAMEROTSKI)
            .reduce((sum, item) => sum + (item.delta || 0), 0);
        const camOut = this.filteredData
            .filter(item => item.apparaat === CONFIG.DEVICES.HENK)
            .reduce((sum, item) => sum + (item.delta || 0), 0);
        
        return {
            totalInside: camIn,
            totalOutside: camOut,
            netMovement: camIn + camOut,
            activeDevices: new Set(this.filteredData.map(item => item.apparaat)).size
        };
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
        const timeData = this.prepareTimelineData();

        if (this.charts.timeline) {
            // Update existing chart data
            this.charts.timeline.data.labels = timeData.labels;
            this.charts.timeline.data.datasets[0].data = timeData.inside;
            this.charts.timeline.data.datasets[1].data = timeData.outside;
            this.charts.timeline.update('none'); // Skip animations for better performance
        } else {
            // Create new chart
            this.charts.timeline = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: timeData.labels,
                    datasets: [
                        {
                            label: 'Inside',
                            data: timeData.inside,
                            borderColor: CONFIG.UI.COLORS.PRIMARY,
                            backgroundColor: CONFIG.UI.COLORS.PRIMARY + '1a', // 10% opacity
                            tension: 0.4
                        },
                        {
                            label: 'Outside',
                            data: timeData.outside,
                            borderColor: CONFIG.UI.COLORS.SECONDARY,
                            backgroundColor: CONFIG.UI.COLORS.SECONDARY + '1a', // 10% opacity
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    ...CONFIG.CHARTS.COMMON_OPTIONS,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        }
    }

    renderDistributionChart() {
        const ctx = document.getElementById('distributionChart').getContext('2d');
        const stats = this.calculateStats();

        if (this.charts.distribution) {
            // Update existing chart data
            this.charts.distribution.data.datasets[0].data = [stats.totalInside, stats.totalOutside];
            this.charts.distribution.update('none');
        } else {
            // Create new chart
            this.charts.distribution = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Inside', 'Outside'],
                    datasets: [{
                        data: [stats.totalInside, stats.totalOutside],
                        backgroundColor: [CONFIG.UI.COLORS.PRIMARY, CONFIG.UI.COLORS.SECONDARY]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: CONFIG.UI.COLORS.SECONDARY
                            }
                        }
                    }
                }
            });
        }
    }

    renderDeviceChart() {
        const ctx = document.getElementById('deviceChart').getContext('2d');
        const deviceData = this.prepareDeviceData();

        if (this.charts.device) {
            // Update existing chart data
            this.charts.device.data.labels = deviceData.labels;
            this.charts.device.data.datasets[0].data = deviceData.inside;
            this.charts.device.data.datasets[1].data = deviceData.outside;
            this.charts.device.update('none');
        } else {
            // Create new chart
            this.charts.device = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: deviceData.labels,
                    datasets: [
                        {
                            label: 'Inside',
                            data: deviceData.inside,
                            backgroundColor: CONFIG.UI.COLORS.PRIMARY
                        },
                        {
                            label: 'Outside',
                            data: deviceData.outside,
                            backgroundColor: CONFIG.UI.COLORS.SECONDARY
                        }
                    ]
                },
                options: CONFIG.CHARTS.COMMON_OPTIONS
            });
        }
    }

    renderDeltaChart() {
        const ctx = document.getElementById('deltaChart').getContext('2d');
        const deltaData = this.prepareDeltaData();

        if (this.charts.delta) {
            // Update existing chart data
            this.charts.delta.data.labels = deltaData.labels;
            this.charts.delta.data.datasets[0].data = deltaData.values;
            this.charts.delta.data.datasets[0].backgroundColor = deltaData.values.map(v => 
                v >= 0 ? CONFIG.UI.COLORS.PRIMARY : CONFIG.UI.COLORS.SECONDARY
            );
            this.charts.delta.update('none');
        } else {
            // Create new chart
            this.charts.delta = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: deltaData.labels,
                    datasets: [{
                        label: 'Delta Changes',
                        data: deltaData.values,
                        backgroundColor: deltaData.values.map(v => 
                            v >= 0 ? CONFIG.UI.COLORS.PRIMARY : CONFIG.UI.COLORS.SECONDARY
                        )
                    }]
                },
                options: CONFIG.CHARTS.COMMON_OPTIONS
            });
        }
    }

    prepareTimelineData() {
        const grouped = {};
        const sortedData = [...this.filteredData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        sortedData.forEach(item => {
            const date = new Date(item.timestamp);
            const dateKey = date.toLocaleDateString('en-GB', {
                timeZone: CONFIG.DATA.TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit'
            });
            const hour = date.getHours();
            const minute = Math.floor(date.getMinutes() / CONFIG.UI.TIME_INTERVAL_MINUTES) * CONFIG.UI.TIME_INTERVAL_MINUTES;
            const fullKey = `${dateKey} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            
            if (!grouped[fullKey]) {
                grouped[fullKey] = { 
                    inside: 0, outside: 0, count: 0, timestamp: date.getTime(),
                    displayLabel: date.toLocaleString('en-GB', {
                        timeZone: CONFIG.DATA.TIMEZONE, weekday: 'short', hour: '2-digit', minute: '2-digit'
                    })
                };
            }
            
            grouped[fullKey].inside += (item.binnen || 0);
            grouped[fullKey].outside += (item.buiten || 0);
            grouped[fullKey].count++;
        });

        const recentEntries = Object.entries(grouped)
            .sort((a, b) => a[1].timestamp - b[1].timestamp)
            .slice(-CONFIG.UI.TIMELINE_DATA_POINTS);
        
        return {
            labels: recentEntries.map(([, data]) => data.displayLabel),
            inside: recentEntries.map(([, data]) => data.count > 0 ? Math.round(data.inside / data.count) : 0),
            outside: recentEntries.map(([, data]) => data.count > 0 ? Math.round(data.outside / data.count) : 0)
        };
    }

    prepareDeviceData() {
        const latest = this.getLatestByDevice();
        const labels = Object.keys(latest);
        return {
            labels,
            inside: labels.map(device => latest[device].binnen || 0),
            outside: labels.map(device => latest[device].buiten || 0)
        };
    }

    prepareDeltaData() {
        const recentData = this.filteredData.slice(0, CONFIG.UI.TABLE_MAX_ROWS);
        return {
            labels: recentData.map(item => 
                new Date(item.timestamp).toLocaleString('en-GB', {
                    timeZone: CONFIG.DATA.TIMEZONE, weekday: 'short', hour: '2-digit', minute: '2-digit'
                })
            ),
            values: recentData.map(item => item.delta)
        };
    }

    renderTable() {
        const tbody = this.elements.activityTableBody;
        tbody.innerHTML = '';

        const recentData = this.filteredData.slice(0, CONFIG.UI.TABLE_MAX_ROWS);

        recentData.forEach(item => {
            const row = document.createElement('tr');
            const date = new Date(item.timestamp);
            const dateStr = date.toLocaleDateString('en-GB', {
                timeZone: CONFIG.DATA.TIMEZONE, weekday: 'short', day: 'numeric', month: 'short'
            });
            const timeStr = date.toLocaleTimeString('en-GB', {
                timeZone: CONFIG.DATA.TIMEZONE, hour: '2-digit', minute: '2-digit', second: '2-digit'
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
            timeZone: CONFIG.DATA.TIMEZONE, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('en-GB', {
            timeZone: CONFIG.DATA.TIMEZONE, hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        this.elements.lastUpdated.textContent = `${dateStr} at ${timeStr}`;
    }

    showError(message) {
        const container = document.querySelector('.container');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        container.insertBefore(errorDiv, container.firstChild);
    }

    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        this.refreshInterval = setInterval(() => {
            this.fetchData().catch(error => {
                console.error('Auto-refresh failed:', error);
                this.showError('Failed to refresh data automatically.');
            });
        }, CONFIG.API.REFRESH_INTERVAL);
    }

    destroy() {
        // Clear intervals
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        
        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
        
        // Clear data
        this.data = [];
        this.filteredData = [];
    }
}

// Global dashboard instance for cleanup
let dashboardInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    dashboardInstance = new PeopleCounterDashboard();
    
});

// Clean up resources on page unload
window.addEventListener('beforeunload', () => {
    if (dashboardInstance && typeof dashboardInstance.destroy === 'function') {
        dashboardInstance.destroy();
    }
});

