/**
 * Dashboard JavaScript
 * Frontend functionality for the dashboard page
 */

class DashboardManager {
    constructor() {
        this.socket = null;
        this.statisticsCache = {};
        this.refreshInterval = 30000; // 30 seconds
        this.charts = {};
        
        this.initializeWebSocket();
        this.initializeEventListeners();
        this.loadInitialData();
    }
    
    initializeWebSocket() {
        if (typeof io !== 'undefined') {
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('Dashboard WebSocket connected');
                this.socket.emit('authenticate', {
                    userId: 'current-user',
                    token: null
                });
            });
            
            this.socket.on('authenticated', (data) => {
                console.log('Dashboard socket authenticated:', data);
                this.loadInitialData();
            });
            
            // Listen for real-time updates
            this.socket.on('call-status-update', (data) => {
                this.handleCallUpdate(data);
            });
            
            this.socket.on('broadcast-status-update', (data) => {
                this.handleBroadcastUpdate(data);
            });
            
            this.socket.on('system-notification', (data) => {
                this.showNotification(data.message, data.type);
            });
            
            this.socket.on('disconnect', () => {
                console.log('Dashboard WebSocket disconnected');
                this.showNotification('Real-time ulanish uzildi', 'warning');
            });
            
            this.socket.on('reconnect', () => {
                console.log('Dashboard WebSocket reconnected');
                this.showNotification('Real-time ulanish tiklandi', 'success');
                this.loadInitialData();
            });
        }
    }
    
    initializeEventListeners() {
        // Auto-refresh data
        setInterval(() => {
            this.refreshStatistics();
        }, this.refreshInterval);
        
        // Handle visibility change to pause/resume updates
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseUpdates();
            } else {
                this.resumeUpdates();
            }
        });
    }
    
    async loadInitialData() {
        try {
            await Promise.all([
                this.loadCallStatistics(),
                this.loadBroadcastStatistics(), 
                this.loadEmployeeStatistics(),
                this.loadSipStatus(),
                this.loadRecentActivities()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Ma\'lumot yuklanishida xatolik', 'error');
        }
    }
    
    async loadCallStatistics() {
        try {
            const response = await fetch('/api/sip/stats?period=today');
            const data = await response.json();
            
            if (data.success) {
                this.statisticsCache.calls = data.data;
                this.updateCallStatisticsDisplay(data.data);
            }
        } catch (error) {
            console.error('Error loading call statistics:', error);
        }
    }
    
    async loadBroadcastStatistics() {
        try {
            const response = await fetch('/api/broadcast');
            const data = await response.json();
            
            if (data.success) {
                const activeBroadcasts = data.data.broadcasts.filter(b => 
                    b.status === 'in_progress' || b.status === 'pending'
                ).length;
                
                this.statisticsCache.broadcasts = {
                    active: activeBroadcasts,
                    total: data.data.broadcasts.length
                };
                
                this.updateBroadcastStatisticsDisplay(this.statisticsCache.broadcasts);
            }
        } catch (error) {
            console.error('Error loading broadcast statistics:', error);
        }
    }
    
    async loadEmployeeStatistics() {
        try {
            const response = await fetch('/api/employee');
            const data = await response.json();
            
            if (data.success) {
                const activeEmployees = data.data.employees.filter(e => e.isActive).length;
                
                this.statisticsCache.employees = {
                    active: activeEmployees,
                    total: data.data.employees.length
                };
                
                this.updateEmployeeStatisticsDisplay(this.statisticsCache.employees);
            }
        } catch (error) {
            console.error('Error loading employee statistics:', error);
        }
    }
    
    async loadSipStatus() {
        try {
            const response = await fetch('/api/sip/health');
            const data = await response.json();
            
            const sipStatus = {
                connected: data.success && data.data.services.sip === 'connected',
                status: data.success ? data.data.services.sip : 'error'
            };
            
            this.statisticsCache.sipStatus = sipStatus;
            this.updateSipStatusDisplay(sipStatus);
        } catch (error) {
            console.error('Error loading SIP status:', error);
            this.updateSipStatusDisplay({ connected: false, status: 'error' });
        }
    }
    
    async loadRecentActivities() {
        try {
            const response = await fetch('/api/sip/calls?limit=10');
            const data = await response.json();
            
            if (data.success) {
                this.statisticsCache.recentCalls = data.data.calls;
                this.updateRecentActivitiesDisplay(data.data.calls);
            }
        } catch (error) {
            console.error('Error loading recent activities:', error);
        }
    }
    
    // Update Display Methods
    updateCallStatisticsDisplay(stats) {
        const countElement = document.getElementById('todayCallsCount');
        if (countElement) {
            countElement.textContent = stats.totalCalls || 0;
            
            // Add animation effect
            countElement.classList.add('updated');
            setTimeout(() => countElement.classList.remove('updated'), 500);
        }
    }
    
    updateBroadcastStatisticsDisplay(stats) {
        const countElement = document.getElementById('activeBroadcastsCount');
        if (countElement) {
            countElement.textContent = stats.active || 0;
            
            // Add animation effect
            countElement.classList.add('updated');
            setTimeout(() => countElement.classList.remove('updated'), 500);
        }
    }
    
    updateEmployeeStatisticsDisplay(stats) {
        const countElement = document.getElementById('activeEmployeesCount');
        if (countElement) {
            countElement.textContent = stats.active || 0;
            
            // Add animation effect
            countElement.classList.add('updated');
            setTimeout(() => countElement.classList.remove('updated'), 500);
        }
    }
    
    updateSipStatusDisplay(status) {
        const indicator = document.getElementById('sipStatusIndicator');
        const text = document.getElementById('sipStatusText');
        
        if (indicator && text) {
            if (status.connected) {
                indicator.style.background = 'var(--md-sys-color-primary)';
                text.textContent = 'Ulangan';
                text.style.color = 'var(--md-sys-color-primary)';
            } else {
                indicator.style.background = 'var(--md-sys-color-error)';
                text.textContent = status.status === 'error' ? 'Xatolik' : 'Ulanmagan';
                text.style.color = 'var(--md-sys-color-error)';
            }
            
            // Add pulse animation for status changes
            indicator.classList.add('pulse');
            setTimeout(() => indicator.classList.remove('pulse'), 1000);
        }
    }
    
    updateRecentActivitiesDisplay(activities) {
        const tbody = document.querySelector('#recentActivitiesTable tbody');
        
        if (!tbody) return;
        
        if (!activities || activities.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="md-typescale-body-medium" style="text-align: center; padding: var(--md-sys-spacing-8); color: var(--md-sys-color-on-surface-variant);">
                        Faoliyat topilmadi
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = activities.map((activity, index) => `
            <tr style="border-bottom: 1px solid var(--md-sys-color-outline-variant); animation: fadeIn 0.3s ease-in-out ${index * 0.1}s backwards;">
                <td class="md-typescale-body-medium" style="padding: var(--md-sys-spacing-4);">
                    ${this.formatDateTime(activity.startTime)}
                </td>
                <td class="md-typescale-body-medium" style="padding: var(--md-sys-spacing-4);">
                    <div style="display: flex; align-items: center;">
                        <span class="material-symbols-outlined activity-type-icon" style="font-size: 16px; margin-right: var(--md-sys-spacing-2); color: var(--md-sys-color-${this.getActivityColor(activity.type)});">
                            ${this.getActivityIcon(activity.type)}
                        </span>
                        ${this.getActivityTypeText(activity.type)}
                    </div>
                </td>
                <td class="md-typescale-body-medium" style="padding: var(--md-sys-spacing-4);">
                    <div>
                        <div>${activity.from} → ${activity.to}</div>
                        ${activity.duration ? `<small style="color: var(--md-sys-color-on-surface-variant);">${this.formatDuration(activity.duration)}</small>` : ''}
                    </div>
                </td>
                <td class="md-typescale-body-medium" style="padding: var(--md-sys-spacing-4);">
                    <span class="status-badge status-${activity.status}" style="background: var(--md-sys-color-${this.getStatusColor(activity.status)}-container); color: var(--md-sys-color-on-${this.getStatusColor(activity.status)}-container);">
                        ${this.getStatusText(activity.status)}
                    </span>
                </td>
            </tr>
        `).join('');
    }
    
    // Real-time Event Handlers
    handleCallUpdate(data) {
        console.log('Call update received:', data);
        
        // Update statistics if it affects today's stats
        const today = new Date().toDateString();
        const callDate = new Date(data.timestamp).toDateString();
        
        if (today === callDate) {
            this.loadCallStatistics();
        }
        
        // Update recent activities
        this.loadRecentActivities();
        
        // Show real-time notification for important events
        if (data.status === 'answered') {
            this.showRealTimeUpdate('Qo\'ng\'iroq qabul qilindi', 'success');
        } else if (data.status === 'failed') {
            this.showRealTimeUpdate('Qo\'ng\'iroq muvaffaqiyatsiz', 'warning');
        }
    }
    
    handleBroadcastUpdate(data) {
        console.log('Broadcast update received:', data);
        
        // Update broadcast statistics
        this.loadBroadcastStatistics();
        
        // Show progress updates
        if (data.progress !== undefined) {
            this.showRealTimeUpdate(`Xabar yuborish: ${data.progress}%`, 'info');
        }
    }
    
    // Refresh Methods
    async refreshStatistics() {
        if (document.hidden) return; // Don't refresh if page is hidden
        
        try {
            await Promise.all([
                this.loadCallStatistics(),
                this.loadBroadcastStatistics(),
                this.loadSipStatus()
            ]);
        } catch (error) {
            console.error('Error refreshing statistics:', error);
        }
    }
    
    pauseUpdates() {
        // Implementation for pausing updates when page is hidden
        console.log('Dashboard updates paused');
    }
    
    resumeUpdates() {
        // Implementation for resuming updates when page becomes visible
        console.log('Dashboard updates resumed');
        this.loadInitialData();
    }
    
    // Utility Methods
    formatDateTime(timestamp) {
        const date = new Date(timestamp);
        const today = new Date();
        
        if (date.toDateString() === today.toDateString()) {
            return date.toLocaleTimeString('uz-UZ', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else {
            return date.toLocaleDateString('uz-UZ', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    getActivityIcon(type) {
        const icons = {
            'broadcast': 'campaign',
            'direct': 'phone',
            'emergency': 'emergency',
            'test': 'science'
        };
        return icons[type] || 'phone';
    }
    
    getActivityColor(type) {
        const colors = {
            'broadcast': 'secondary',
            'direct': 'primary',
            'emergency': 'error',
            'test': 'tertiary'
        };
        return colors[type] || 'primary';
    }
    
    getActivityTypeText(type) {
        const texts = {
            'broadcast': 'Xabar',
            'direct': 'Qo\'ng\'iroq',
            'emergency': 'Favqulodda',
            'test': 'Test'
        };
        return texts[type] || 'Qo\'ng\'iroq';
    }
    
    getStatusText(status) {
        const statusTexts = {
            'completed': 'Yakunlandi',
            'answered': 'Javob berildi',
            'failed': 'Muvaffaqiyatsiz',
            'busy': 'Band',
            'no_answer': 'Javob yo\'q',
            'cancelled': 'Bekor qilindi',
            'in_progress': 'Jarayonda',
            'pending': 'Kutilmoqda'
        };
        return statusTexts[status] || status;
    }
    
    getStatusColor(status) {
        const colors = {
            'completed': 'primary',
            'answered': 'primary',
            'failed': 'error',
            'busy': 'error',
            'no_answer': 'error',
            'cancelled': 'surface-variant',
            'in_progress': 'secondary',
            'pending': 'tertiary'
        };
        return colors[status] || 'surface-variant';
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `dashboard-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="material-symbols-outlined notification-icon">
                    ${this.getNotificationIcon(type)}
                </span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
        `;
        
        // Add to notifications container or body
        const container = document.getElementById('notificationsContainer') || document.body;
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
    }
    
    showRealTimeUpdate(message, type = 'info') {
        // Show a less intrusive real-time update
        const update = document.createElement('div');
        update.className = `realtime-update update-${type}`;
        update.innerHTML = `
            <div class="update-content">
                <span class="update-indicator"></span>
                <span class="update-message">${message}</span>
            </div>
        `;
        
        const container = document.getElementById('realtimeUpdates') || document.body;
        container.appendChild(update);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (update.parentElement) {
                update.classList.add('fade-out');
                setTimeout(() => update.remove(), 300);
            }
        }, 3000);
    }
    
    getNotificationIcon(type) {
        const icons = {
            'success': 'check_circle',
            'error': 'error',
            'warning': 'warning',
            'info': 'info'
        };
        return icons[type] || 'info';
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardManager = new DashboardManager();
});

// Global functions for external access
function refreshDashboard() {
    if (window.dashboardManager) {
        window.dashboardManager.loadInitialData();
    }
}