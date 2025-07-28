class PeopleCounterDashboard {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.charts = {};

        this.apiUrl = atob('aHR0cHM6Ly9hZmYucmV5dGVjaC5iZS9ncm91cGVk');
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

        deviceFilter.addEventListener('change', () => this.filterData());
        timeRange.addEventListener('change', () => this.filterData());
    }

    async fetchData() {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error('Failed to fetch data');
            
            this.data = await response.json();
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

        let filtered = [...this.data];

        if (deviceFilter !== 'all') {
            filtered = filtered.filter(item => item.apparaat === deviceFilter);
        }

        if (timeRange !== 'all') {
            const now = new Date();
            const timeThreshold = new Date();
            
            switch (timeRange) {
                case '24h':
                    timeThreshold.setHours(now.getHours() - 24);
                    break;
                case '7d':
                    timeThreshold.setDate(now.getDate() - 7);
                    break;
                case '30d':
                    timeThreshold.setDate(now.getDate() - 30);
                    break;
            }

            filtered = filtered.filter(item => 
                new Date(item.timestamp) >= timeThreshold
            );
        }

        this.filteredData = filtered.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );

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
        const latest = this.getLatestByDevice();
        
        const totalInside = Object.values(latest).reduce((sum, item) => sum + item.binnen, 0);
        const totalOutside = Object.values(latest).reduce((sum, item) => sum + item.buiten, 0);
        const netMovement = totalInside - totalOutside;
        const activeDevices = Object.keys(latest).length;

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
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Outside',
                        data: timeData.outside,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
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
                    backgroundColor: ['#3498db', '#e74c3c']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
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
                        backgroundColor: '#3498db'
                    },
                    {
                        label: 'Outside',
                        data: deviceData.outside,
                        backgroundColor: '#e74c3c'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
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
                    backgroundColor: deltaData.values.map(v => v >= 0 ? '#27ae60' : '#e74c3c')
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    prepareTimelineData() {
        const grouped = {};
        
        this.filteredData.forEach(item => {
            const hour = new Date(item.timestamp).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit'
            });
            
            if (!grouped[hour]) {
                grouped[hour] = { inside: 0, outside: 0, count: 0 };
            }
            
            grouped[hour].inside += item.binnen;
            grouped[hour].outside += item.buiten;
            grouped[hour].count++;
        });

        const labels = Object.keys(grouped).slice(-24);
        const inside = labels.map(label => Math.round(grouped[label].inside / grouped[label].count));
        const outside = labels.map(label => Math.round(grouped[label].outside / grouped[label].count));

        return { labels, inside, outside };
    }

    prepareDeviceData() {
        const latest = this.getLatestByDevice();
        
        const labels = Object.keys(latest);
        const inside = labels.map(device => latest[device].binnen);
        const outside = labels.map(device => latest[device].buiten);

        return { labels, inside, outside };
    }

    prepareDeltaData() {
        const recentData = this.filteredData.slice(0, 20);
        
        const labels = recentData.map(item => 
            `${item.apparaat} - ${new Date(item.timestamp).toLocaleTimeString()}`
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
            row.innerHTML = `
                <td>${item.apparaat}</td>
                <td>${new Date(item.timestamp).toLocaleString()}</td>
                <td>${item.binnen.toLocaleString()}</td>
                <td>${item.buiten.toLocaleString()}</td>
                <td class="${item.delta >= 0 ? 'positive' : 'negative'}">${item.delta}</td>
                <td>${item.totaal.toLocaleString()}</td>
            `;
            tbody.appendChild(row);
        });
    }

    updateLastUpdated() {
        document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
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