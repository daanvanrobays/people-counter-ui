/**
 * People Counter Dashboard - Enhanced with performance optimizations
 * and improved architecture
 */
class PeopleCounterDashboard {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.charts = {};
        this.debounceTimer = null;
        this.refreshInterval = null;
        
        // Cache DOM elements
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

    /**
     * Cache DOM elements and setup event listeners with debouncing
     */
    setupEventListeners() {
        // Cache DOM elements
        this.elements = {
            deviceFilter: document.getElementById('deviceFilter'),
            timeRange: document.getElementById('timeRange'),
            timeFilter: document.getElementById('timeFilter'),
            startDate: document.getElementById('startDate'),
            endDate: document.getElementById('endDate'),
            startHour: document.getElementById('startHour'),
            endHour: document.getElementById('endHour'),
            customDateRange: document.getElementById('customDateRange'),
            customTimeRange: document.getElementById('customTimeRange'),
            totalInside: document.getElementById('totalInside'),
            totalOutside: document.getElementById('totalOutside'),
            netMovement: document.getElementById('netMovement'),
            activeDevices: document.getElementById('activeDevices'),
            lastUpdated: document.getElementById('lastUpdated'),
            activityTableBody: document.getElementById('activityTableBody')
        };

        // Setup event listeners with debounced filtering
        this.elements.deviceFilter.addEventListener('change', () => this.debouncedFilterData());
        this.elements.timeRange.addEventListener('change', () => {
            this.toggleCustomDateRange();
            this.linkFestivalPeriodToActiveHours();
            this.debouncedFilterData();
        });
        this.elements.timeFilter.addEventListener('change', () => {
            this.toggleCustomTimeRange();
            this.debouncedFilterData();
        });
        this.elements.startDate.addEventListener('change', () => this.debouncedFilterData());
        this.elements.endDate.addEventListener('change', () => this.debouncedFilterData());
        this.elements.startHour.addEventListener('change', () => this.debouncedFilterData());
        this.elements.endHour.addEventListener('change', () => this.debouncedFilterData());
    }

    /**
     * Debounced version of filterData to prevent excessive calls
     */
    debouncedFilterData() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.filterData();
        }, CONFIG.UI.DEBOUNCE_DELAY);
    }

    /**
     * Toggle custom date range visibility
     */
    toggleCustomDateRange() {
        const timeRange = this.elements.timeRange.value;
        const customDateRange = this.elements.customDateRange;
        
        if (timeRange === CONFIG.FILTERS.TIME_RANGE.CUSTOM) {
            customDateRange.style.display = 'flex';
            customDateRange.style.gap = '10px';
            customDateRange.style.alignItems = 'center';
        } else {
            customDateRange.style.display = 'none';
        }
    }

    /**
     * Toggle custom time range visibility
     */
    toggleCustomTimeRange() {
        const timeFilter = this.elements.timeFilter.value;
        const customTimeRange = this.elements.customTimeRange;
        
        if (timeFilter === CONFIG.FILTERS.TIME_FILTER.CUSTOM_HOURS) {
            customTimeRange.style.display = 'flex';
            customTimeRange.style.gap = '10px';
            customTimeRange.style.alignItems = 'center';
        } else {
            customTimeRange.style.display = 'none';
        }
    }

    /**
     * Link festival period selection to appropriate active hours
     */
    linkFestivalPeriodToActiveHours() {
        const timeRange = this.elements.timeRange.value;
        const timeFilter = this.elements.timeFilter;
        
        // Update options based on selected period
        this.updateActiveHoursOptions(timeRange);
        
        // Auto-select appropriate festival hours based on selected period
        switch (timeRange) {
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2024_FRIDAY:
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2025_FRIDAY:
                timeFilter.value = CONFIG.FILTERS.TIME_FILTER.FRIDAY_HOURS;
                break;
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2024_SATURDAY:
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2025_SATURDAY:
                timeFilter.value = CONFIG.FILTERS.TIME_FILTER.SATURDAY_HOURS;
                break;
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2024_FULL:
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2025_FULL:
                // For full festival, keep current selection or default to all hours
                if (timeFilter.value === CONFIG.FILTERS.TIME_FILTER.FRIDAY_HOURS || 
                    timeFilter.value === CONFIG.FILTERS.TIME_FILTER.SATURDAY_HOURS) {
                    // Keep the current specific day selection
                } else {
                    timeFilter.value = CONFIG.FILTERS.TIME_FILTER.ALL_HOURS;
                }
                break;
            default:
                // For custom or all time, don't change time filter automatically
                break;
        }
        
        // Update the custom time range visibility
        this.toggleCustomTimeRange();
    }

    /**
     * Update active hours options based on selected festival period
     */
    updateActiveHoursOptions(timeRange) {
        const timeFilter = this.elements.timeFilter;
        const currentValue = timeFilter.value;
        
        // Clear existing options
        timeFilter.innerHTML = '';
        
        // Add base option
        timeFilter.appendChild(new Option('All Hours', CONFIG.FILTERS.TIME_FILTER.ALL_HOURS));
        
        // Add contextual options based on selected period
        switch (timeRange) {
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2024_FRIDAY:
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2025_FRIDAY:
                timeFilter.appendChild(new Option('Festival Hours (18:00-02:00) - Recommended', CONFIG.FILTERS.TIME_FILTER.FRIDAY_HOURS));
                timeFilter.appendChild(new Option('Custom Time Range', CONFIG.FILTERS.TIME_FILTER.CUSTOM_HOURS));
                break;
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2024_SATURDAY:
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2025_SATURDAY:
                timeFilter.appendChild(new Option('Festival Hours (13:00-02:00) - Recommended', CONFIG.FILTERS.TIME_FILTER.SATURDAY_HOURS));
                timeFilter.appendChild(new Option('Custom Time Range', CONFIG.FILTERS.TIME_FILTER.CUSTOM_HOURS));
                break;
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2024_FULL:
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2025_FULL:
                timeFilter.appendChild(new Option('Friday Hours (18:00-02:00)', CONFIG.FILTERS.TIME_FILTER.FRIDAY_HOURS));
                timeFilter.appendChild(new Option('Saturday Hours (13:00-02:00)', CONFIG.FILTERS.TIME_FILTER.SATURDAY_HOURS));
                timeFilter.appendChild(new Option('Custom Time Range', CONFIG.FILTERS.TIME_FILTER.CUSTOM_HOURS));
                break;
            default:
                // For custom or all time, show all options
                timeFilter.appendChild(new Option('Friday Festival Hours (18:00-02:00)', CONFIG.FILTERS.TIME_FILTER.FRIDAY_HOURS));
                timeFilter.appendChild(new Option('Saturday Festival Hours (13:00-02:00)', CONFIG.FILTERS.TIME_FILTER.SATURDAY_HOURS));
                timeFilter.appendChild(new Option('Custom Time Range', CONFIG.FILTERS.TIME_FILTER.CUSTOM_HOURS));
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

    /**
     * Main filtering method that orchestrates all filters
     */
    filterData() {
        const deviceFilter = this.elements.deviceFilter.value;
        const timeRange = this.elements.timeRange.value;
        const timeFilter = this.elements.timeFilter.value;

        let filtered = [...this.data];

        // Apply filters in sequence
        filtered = this._filterByDevice(filtered, deviceFilter);
        filtered = this._filterByDateRange(filtered, timeRange);
        filtered = this._filterByTimeOfDay(filtered, timeFilter);

        // Sort by timestamp descending (newest first)
        this.filteredData = this._sortByTimestamp(filtered);

        this.renderDashboard();
    }

    /**
     * Filter data by device type
     */
    _filterByDevice(data, deviceFilter) {
        if (deviceFilter === CONFIG.FILTERS.DEVICE.ALL) {
            return data;
        }
        return data.filter(item => item.apparaat === deviceFilter);
    }

    /**
     * Filter data by date range
     */
    _filterByDateRange(data, timeRange) {
        if (timeRange === CONFIG.FILTERS.TIME_RANGE.ALL) {
            return data;
        }

        const dateRange = this._getDateRange(timeRange);
        if (!dateRange) {
            return data;
        }

        return data.filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= dateRange.start && itemDate <= dateRange.end;
        });
    }

    /**
     * Get date range object based on filter selection
     */
    _getDateRange(timeRange) {
        switch (timeRange) {
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2024_FULL:
                return {
                    start: new Date(CONFIG.FESTIVAL_DATES[2024].FULL.start),
                    end: new Date(CONFIG.FESTIVAL_DATES[2024].FULL.end)
                };
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2024_FRIDAY:
                return {
                    start: new Date(CONFIG.FESTIVAL_DATES[2024].FRIDAY.start),
                    end: new Date(CONFIG.FESTIVAL_DATES[2024].FRIDAY.end)
                };
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2024_SATURDAY:
                return {
                    start: new Date(CONFIG.FESTIVAL_DATES[2024].SATURDAY.start),
                    end: new Date(CONFIG.FESTIVAL_DATES[2024].SATURDAY.end)
                };
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2025_FULL:
                return {
                    start: new Date(CONFIG.FESTIVAL_DATES[2025].FULL.start),
                    end: new Date(CONFIG.FESTIVAL_DATES[2025].FULL.end)
                };
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2025_FRIDAY:
                return {
                    start: new Date(CONFIG.FESTIVAL_DATES[2025].FRIDAY.start),
                    end: new Date(CONFIG.FESTIVAL_DATES[2025].FRIDAY.end)
                };
            case CONFIG.FILTERS.TIME_RANGE.FESTIVAL_2025_SATURDAY:
                return {
                    start: new Date(CONFIG.FESTIVAL_DATES[2025].SATURDAY.start),
                    end: new Date(CONFIG.FESTIVAL_DATES[2025].SATURDAY.end)
                };
            case CONFIG.FILTERS.TIME_RANGE.CUSTOM:
                const startInput = this.elements.startDate.value;
                const endInput = this.elements.endDate.value;
                if (startInput && endInput) {
                    return {
                        start: new Date(startInput + 'T00:00:00'),
                        end: new Date(endInput + 'T23:59:59')
                    };
                }
                break;
        }
        return null;
    }

    /**
     * Filter data by time of day
     */
    _filterByTimeOfDay(data, timeFilter) {
        if (timeFilter === CONFIG.FILTERS.TIME_FILTER.ALL_HOURS) {
            return data;
        }

        return data.filter(item => {
            const itemDate = new Date(item.timestamp);
            const hour = itemDate.getHours();
            
            switch (timeFilter) {
                case CONFIG.FILTERS.TIME_FILTER.FRIDAY_HOURS:
                    return this._isWithinFestivalHours(hour, CONFIG.FESTIVAL_HOURS.FRIDAY);
                case CONFIG.FILTERS.TIME_FILTER.SATURDAY_HOURS:
                    return this._isWithinFestivalHours(hour, CONFIG.FESTIVAL_HOURS.SATURDAY);
                case CONFIG.FILTERS.TIME_FILTER.CUSTOM_HOURS:
                    return this._isWithinCustomHours(itemDate);
                default:
                    return true;
            }
        });
    }

    /**
     * Check if hour is within festival hours (handles overnight ranges)
     */
    _isWithinFestivalHours(hour, festivalHours) {
        const { start, end } = festivalHours;
        if (start <= end) {
            return hour >= start && hour < end;
        } else {
            // Handle overnight ranges (e.g., 18:00 to 02:00)
            return hour >= start || hour < end;
        }
    }

    /**
     * Check if time is within custom time range
     */
    _isWithinCustomHours(itemDate) {
        const startHour = this.elements.startHour.value;
        const endHour = this.elements.endHour.value;
        
        if (!startHour || !endHour) return true;
        
        const startTime = this._parseTimeToDecimal(startHour);
        const endTime = this._parseTimeToDecimal(endHour);
        const itemTime = itemDate.getHours() + itemDate.getMinutes() / 60;
        
        if (startTime <= endTime) {
            return itemTime >= startTime && itemTime < endTime;
        } else {
            // Handle overnight ranges
            return itemTime >= startTime || itemTime < endTime;
        }
    }

    /**
     * Convert time string (HH:MM) to decimal hours
     */
    _parseTimeToDecimal(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours + minutes / 60;
    }

    /**
     * Sort data by timestamp
     */
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

    /**
     * Update statistics display using cached DOM elements
     */
    updateStats() {
        const stats = this.calculateStats();
        
        this.elements.totalInside.textContent = stats.totalInside.toLocaleString();
        this.elements.totalOutside.textContent = stats.totalOutside.toLocaleString();
        this.elements.netMovement.textContent = stats.netMovement.toLocaleString();
        this.elements.activeDevices.textContent = stats.activeDevices;
    }

    calculateStats() {
        // Calculate totals based on device logic: Kamerotski = IN, Henk = OUT
        const kamerotskiData = this.filteredData.filter(item => item.apparaat === 'Kamerotski');
        const henkData = this.filteredData.filter(item => item.apparaat === 'Henk');
        
        // Sum deltas for each device (after cutoff date)
        const filteredAfter = this.filteredData.filter(item => 
            new Date(item.timestamp) > new Date(CONFIG.DATA.CUTOFF_DATE)
        );
        
        const camIn = filteredAfter
            .filter(item => item.apparaat === CONFIG.DEVICES.KAMEROTSKI)
            .reduce((sum, item) => sum + (item.delta || 0), 0);
            
        const camOut = filteredAfter
            .filter(item => item.apparaat === CONFIG.DEVICES.HENK)
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

    /**
     * Render timeline chart with optimized updates
     */
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

    /**
     * Render distribution chart with optimized updates
     */
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

    /**
     * Render device chart with optimized updates
     */
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

    /**
     * Render delta chart with optimized updates
     */
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
        
        // Sort filtered data by timestamp first
        const sortedData = [...this.filteredData].sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        sortedData.forEach(item => {
            const date = new Date(item.timestamp);
            
            // Create a unique key that includes both date and hour for proper grouping
            const dateKey = date.toLocaleDateString('en-GB', {
                timeZone: CONFIG.DATA.TIMEZONE,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const hour = date.getHours();
            const minute = Math.floor(date.getMinutes() / CONFIG.UI.TIME_INTERVAL_MINUTES) * CONFIG.UI.TIME_INTERVAL_MINUTES;
            
            const timeKey = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const fullKey = `${dateKey} ${timeKey}`;
            
            if (!grouped[fullKey]) {
                grouped[fullKey] = { 
                    inside: 0, 
                    outside: 0, 
                    count: 0, 
                    timestamp: date.getTime(),
                    displayLabel: date.toLocaleString('en-GB', {
                        timeZone: CONFIG.DATA.TIMEZONE,
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

        // Take recent data points based on configuration
        const recentEntries = sortedEntries.slice(-CONFIG.UI.TIMELINE_DATA_POINTS);
        
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
                timeZone: CONFIG.DATA.TIMEZONE,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })}`
        );
        const values = recentData.map(item => item.delta);

        return { labels, values };
    }

    /**
     * Render activity table with cached elements
     */
    renderTable() {
        const tbody = this.elements.activityTableBody;
        tbody.innerHTML = '';

        const recentData = this.filteredData.slice(0, CONFIG.UI.TABLE_MAX_ROWS);

        recentData.forEach(item => {
            const row = document.createElement('tr');
            const date = new Date(item.timestamp);
            const dateStr = date.toLocaleDateString('en-GB', {
                timeZone: CONFIG.DATA.TIMEZONE,
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            });
            const timeStr = date.toLocaleTimeString('en-GB', {
                timeZone: CONFIG.DATA.TIMEZONE,
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
            timeZone: CONFIG.DATA.TIMEZONE,
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('en-GB', {
            timeZone: CONFIG.DATA.TIMEZONE,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
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

    /**
     * Start auto-refresh with proper cleanup
     */
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

    /**
     * Clean up resources and event listeners
     */
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

    /**
     * Enhanced error display with better UX
     */
    showError(message, isTemporary = true) {
        // Remove existing error messages
        const existingErrors = document.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());
        
        const container = document.querySelector('.container');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: rgba(229, 62, 62, 0.1);
            color: ${CONFIG.UI.COLORS.PRIMARY};
            padding: 15px 20px;
            border-radius: 6px;
            border: 1px solid ${CONFIG.UI.COLORS.ERROR};
            margin: 20px 0;
            text-align: center;
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add close button for persistent errors
        if (!isTemporary) {
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = `
                float: right;
                background: none;
                border: none;
                color: ${CONFIG.UI.COLORS.PRIMARY};
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                margin-left: 10px;
            `;
            closeBtn.onclick = () => errorDiv.remove();
            errorDiv.appendChild(closeBtn);
        }
        
        errorDiv.appendChild(document.createTextNode(message));
        container.insertBefore(errorDiv, container.firstChild);
        
        // Auto-remove temporary errors
        if (isTemporary) {
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.style.animation = 'slideOut 0.3s ease-in';
                    setTimeout(() => errorDiv.remove(), 300);
                }
            }, 5000);
        }
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

// Add CSS animations for error messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
`;
document.head.appendChild(style);