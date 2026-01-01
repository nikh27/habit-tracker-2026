// ===================================
// HABIT TRACKER 2026 - JAVASCRIPT
// Production-Quality Application
// ===================================

// === CONSTANTS ===
const STORAGE_KEY = 'habitTracker2026';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_SHORT = {
    monday: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    sunday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
};

// === UTILITY FUNCTIONS ===
const generateId = () => `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDate = (dateStr) => new Date(dateStr + 'T00:00:00');

const isDateInRange = (date, startDate, endDate) => {
    const d = parseDate(date);
    const start = parseDate(startDate);
    const end = endDate ? parseDate(endDate) : new Date('2026-12-31');
    return d >= start && d <= end;
};

// === STATE MANAGEMENT ===
const APP_STATE = {
    habits: {},
    settings: {
        theme: 'dark',
        weekStart: 'monday',
        viewMode: 'comfortable'
    },
    currentView: 'dashboard',
    calendarViewMode: 'yearly',
    selectedDate: formatDate(new Date()),
    currentYear: 2026,
    editingHabitId: null,
    lastAction: null,
    
    // NEW: User Profile
    user: {
        name: '',
        avatar: '🎓',
        goalStatement: 'Become a better student every day',
        dailyGoal: 5,
        joinDate: formatDate(new Date())
    },
    
    // NEW: Theme System
    colorTheme: 'blue', // blue, purple, green, orange, minimal
    
    // NEW: Achievement Badges
    badges: {
        'streak-7': { unlocked: false, unlockedDate: null },
        'tasks-100': { unlocked: false, unlockedDate: null },
        'streak-30': { unlocked: false, unlockedDate: null },
        'perfect-week': { unlocked: false, unlockedDate: null },
        'goal-10': { unlocked: false, unlockedDate: null },
        'reading-50': { unlocked: false, unlockedDate: null },
        'coding-50': { unlocked: false, unlockedDate: null }
    },
    
    // NEW: Pomodoro Timer
    timer: {
        isRunning: false,
        isPaused: false,
        currentTask: null,
        startTime: null,
        remainingTime: 25 * 60, // 25 minutes in seconds
        workDuration: 25 * 60,
        breakDuration: 5 * 60,
        isBreak: false
    },
    
    // NEW: Study Time Tracking (date: minutes)
    studyTime: {},
    
    // NEW: Daily Goal Achievements
    goalAchievements: [],
    
    // NEW: Daily Notes/Diary
    dailyNotes: {}  // { 'YYYY-MM-DD': 'note text' }
};

const isFutureDate = (dateStr) => {
    const date = parseDate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const getFirstDayOfMonth = (year, month, weekStart) => {
    const firstDay = new Date(year, month, 1).getDay();
    if (weekStart === 'monday') {
        return firstDay === 0 ? 6 : firstDay - 1;
    }
    return firstDay;
};

// === LOCAL STORAGE ===
const saveToStorage = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(APP_STATE));
    } catch (error) {
        showToast('Failed to save data', 'error');
        console.error('Storage error:', error);
    }
};

const loadFromStorage = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            APP_STATE.habits = parsed.habits || {};
            APP_STATE.settings = { ...APP_STATE.settings, ...parsed.settings };
            return true;
        }
    } catch (error) {
        console.error('Failed to load data:', error);
    }
    return false;
};

// === HABIT MANAGEMENT ===
const createHabit = (habitData) => {
    const id = generateId();
    const habit = {
        id,
        name: habitData.name,
        description: habitData.description || '',
        category: habitData.category,
        priority: habitData.priority,
        color: habitData.color,
        icon: habitData.icon,
        startDate: habitData.startDate,
        endDate: habitData.endDate || null,
        goalType: habitData.goalType,
        goalValue: habitData.goalValue || null,
        reminderEnabled: habitData.reminderEnabled,
        completions: {},
        createdAt: Date.now()
    };
    
    APP_STATE.habits[id] = habit;
    APP_STATE.lastAction = { type: 'create', habitId: id, data: habit };
    saveToStorage();
    return habit;
};

const updateHabit = (habitId, updates) => {
    if (APP_STATE.habits[habitId]) {
        const oldData = { ...APP_STATE.habits[habitId] };
        APP_STATE.habits[habitId] = { ...APP_STATE.habits[habitId], ...updates };
        APP_STATE.lastAction = { type: 'update', habitId, oldData, newData: updates };
        saveToStorage();
        return true;
    }
    return false;
};

const deleteHabit = (habitId) => {
    if (APP_STATE.habits[habitId]) {
        const deletedHabit = { ...APP_STATE.habits[habitId] };
        delete APP_STATE.habits[habitId];
        APP_STATE.lastAction = { type: 'delete', habitId, data: deletedHabit };
        saveToStorage();
        return true;
    }
    return false;
};

const toggleCompletion = (habitId, date) => {
    const habit = APP_STATE.habits[habitId];
    if (!habit) return false;
    
    // Don't allow completing future dates
    if (isFutureDate(date)) {
        showToast('Cannot complete future dates', 'warning');
        return false;
    }
    
    // Check if date is in habit's active range
    if (!isDateInRange(date, habit.startDate, habit.endDate)) {
        return false;
    }
    
    const oldValue = habit.completions[date];
    habit.completions[date] = !habit.completions[date];
    
    if (!habit.completions[date]) {
        delete habit.completions[date];
    }
    
    APP_STATE.lastAction = { type: 'toggle', habitId, date, oldValue };
    saveToStorage();
    return true;
};

// === ANALYTICS & CALCULATIONS ===
const calculateStreak = (habit) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Get all completion dates sorted
    const completionDates = Object.keys(habit.completions)
        .filter(date => habit.completions[date])
        .map(date => parseDate(date))
        .sort((a, b) => a - b);
    
    if (completionDates.length === 0) {
        return { current: 0, longest: 0 };
    }
    
    // Calculate current streak (working backwards from today)
    let checkDate = new Date(today);
    while (true) {
        const dateStr = formatDate(checkDate);
        if (habit.completions[dateStr]) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    // Calculate longest streak
    for (let i = 0; i < completionDates.length; i++) {
        if (i === 0) {
            tempStreak = 1;
        } else {
            const dayDiff = Math.floor((completionDates[i] - completionDates[i - 1]) / (1000 * 60 * 60 * 24));
            if (dayDiff === 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { current: currentStreak, longest: longestStreak };
};

const calculateProgress = (habit) => {
    const totalDays = Object.keys(habit.completions).filter(date => habit.completions[date]).length;
    const startDate = parseDate(habit.startDate);
    const endDate = habit.endDate ? parseDate(habit.endDate) : new Date('2026-12-31');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const actualEndDate = endDate < today ? endDate : today;
    const daysPassed = Math.max(1, Math.floor((actualEndDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
    
    let percentage = 0;
    
    if (habit.goalType === 'daily') {
        percentage = (totalDays / daysPassed) * 100;
    } else if (habit.goalType === 'weekly' && habit.goalValue) {
        const weeksPassed = Math.ceil(daysPassed / 7);
        const expectedCompletions = weeksPassed * habit.goalValue;
        percentage = (totalDays / expectedCompletions) * 100;
    } else if (habit.goalType === 'total' && habit.goalValue) {
        percentage = (totalDays / habit.goalValue) * 100;
    }
    
    return Math.min(100, Math.round(percentage));
};

const getHabitStats = (habit) => {
    const streak = calculateStreak(habit);
    const totalCompletions = Object.keys(habit.completions).filter(date => habit.completions[date]).length;
    const progress = calculateProgress(habit);
    
    const startDate = parseDate(habit.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const missedDays = Math.max(0, daysPassed - totalCompletions);
    
    return {
        currentStreak: streak.current,
        longestStreak: streak.longest,
        totalCompletions,
        missedDays,
        progress
    };
};

// === UI RENDERING ===
const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-message">${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 200ms reverse';
        setTimeout(() => toast.remove(), 200);
    }, 3000);
};

const switchView = (viewName) => {
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.view === viewName) {
            link.classList.add('active');
        }
    });
    
    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
        APP_STATE.currentView = viewName;
        
        // Render view content
        if (viewName === 'dashboard') renderDashboard();
        else if (viewName === 'calendar') renderCalendar();
        else if (viewName === 'habits') renderHabitsList();
        else if (viewName === 'analytics') renderAnalytics();
    }
};

const renderDashboard = () => {
    const container = document.getElementById('dashboard-content');
    const habits = Object.values(APP_STATE.habits);
    
    if (habits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎯</div>
                <h3 class="empty-title">No Study Tasks Yet</h3>
                <p class="empty-description">Start your study journey by creating your first study task</p>
                <button class="btn btn-primary" onclick="openHabitModal()">
                    <span>➕</span> Add Study Task
                </button>
            </div>
        `;
        return;
    }
    
    const today = formatDate(new Date());
    const todayHabits = habits.filter(h => isDateInRange(today, h.startDate, h.endDate));
    const completedToday = todayHabits.filter(h => h.completions[today]).length;
    const highPriorityHabits = habits.filter(h => h.priority === 'high');
    
    // Calculate overall stats
    let totalCompletions = 0;
    let totalStreaks = 0;
    let activeStreaks = 0;
    habits.forEach(habit => {
        const stats = getHabitStats(habit);
        totalCompletions += stats.totalCompletions;
        totalStreaks += stats.currentStreak;
        if (stats.currentStreak > 0) activeStreaks++;
    });
    
    // Calculate this week's progress
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    let weekCompletions = 0;
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateStr = formatDate(date);
        habits.forEach(habit => {
            if (habit.completions[dateStr]) weekCompletions++;
        });
    }
    
    // Subject breakdown
    const subjectStats = {};
    habits.forEach(habit => {
        if (!subjectStats[habit.category]) {
            subjectStats[habit.category] = { count: 0, completions: 0 };
        }
        subjectStats[habit.category].count++;
        subjectStats[habit.category].completions += Object.keys(habit.completions).filter(d => habit.completions[d]).length;
    });
    
    const bestHabit = habits.reduce((best, habit) => {
        const stats = getHabitStats(habit);
        const bestStats = getHabitStats(best);
        return stats.progress > bestStats.progress ? habit : best;
    }, habits[0]);
    
    const missedToday = todayHabits.length - completedToday;
    const todayNote = APP_STATE.dailyNotes[today] || '';
    
    container.innerHTML = `
        <div class="dashboard-card">
            <div class="card-header">
                <h3 class="card-title">Today's Progress</h3>
                <span class="card-icon">📅</span>
            </div>
            <div class="card-content">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px;">
                    <div style="text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; color: var(--accent-success);">${completedToday}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Completed</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; color: var(--accent-primary);">${todayHabits.length}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Total Tasks</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; color: var(--accent-danger);">${missedToday}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Remaining</div>
                    </div>
                </div>
                <div class="progress-bar-container mt-4">
                    <span class="progress-percentage">${Math.round((completedToday / todayHabits.length) * 100) || 0}%</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${todayHabits.length ? (completedToday / todayHabits.length * 100) : 0}%"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Quick Notes Card -->
        <div class="dashboard-card" style="grid-column: 1 / -1;">
            <div class="card-header">
                <h3 class="card-title">📝 Today's Notes</h3>
                <button class="btn btn-secondary btn-sm" onclick="showDayDetails('${today}')">Open Diary</button>
            </div>
            <div class="card-content">
                <textarea 
                    id="quick-note-input" 
                    placeholder="Quick note for today... (Click 'Open Diary' for full notes)"
                    style="width: 100%; min-height: 80px; padding: 12px; background: var(--bg-elevated); 
                           border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);
                           font-family: inherit; font-size: 14px; resize: vertical;"
                >${todayNote}</textarea>
                <button onclick="saveQuickNote()" class="btn btn-primary" style="margin-top: 8px;">💾 Save Note</button>
            </div>
        </div>
        
        <div class="dashboard-card">
            <div class="card-header">
                <h3 class="card-title">This Week</h3>
                <span class="card-icon">📊</span>
            </div>
            <div class="card-content">
                <div class="stat-large">${weekCompletions}</div>
                <div class="stat-label">Tasks completed this week</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
                    ≈ ${Math.round(weekCompletions * 0.5)} study hours
                </div>
            </div>
        </div>
        
        <div class="dashboard-card">
            <div class="card-header">
                <h3 class="card-title">Active Streaks</h3>
                <span class="card-icon">🔥</span>
            </div>
            <div class="card-content">
                <div class="stat-large">${activeStreaks}</div>
                <div class="stat-label">Tasks with active streaks</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
                    ${totalStreaks} total streak days
                </div>
            </div>
        </div>
        
        <div class="dashboard-card">
            <div class="card-header">
                <h3 class="card-title">Best Performer</h3>
                <span class="card-icon">🏆</span>
            </div>
            <div class="card-content">
                <div style="font-size: 32px; margin-bottom: 8px;">${bestHabit.icon}</div>
                <div style="font-weight: 600; margin-bottom: 4px;">${bestHabit.name}</div>
                <div class="stat-label">${getHabitStats(bestHabit).progress}% progress</div>
            </div>
        </div>
        
        ${highPriorityHabits.length > 0 ? `
        <div class="dashboard-card" style="grid-column: 1 / -1;">
            <div class="card-header">
                <h3 class="card-title">🔥 High Priority Tasks</h3>
            </div>
            <div class="card-content">
                ${highPriorityHabits.map(habit => {
                    const stats = getHabitStats(habit);
                    const isCompletedToday = habit.completions[today];
                    return `
                        <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--bg-elevated); border-radius: 8px; margin-bottom: 8px;">
                            <span style="font-size: 32px;">${habit.icon}</span>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; margin-bottom: 4px;">${habit.name}</div>
                                <div style="font-size: 14px; color: var(--text-secondary);">
                                    🔥 ${stats.currentStreak} day streak • ${stats.progress}% progress
                                </div>
                            </div>
                            <button class="btn ${isCompletedToday ? 'btn-secondary' : 'btn-primary'}" 
                                    onclick="toggleCompletion('${habit.id}', '${today}'); renderDashboard();">
                                ${isCompletedToday ? '✓ Done' : 'Mark Complete'}
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        ` : ''}
    `;
};

const renderCalendar = () => {
    const container = document.getElementById('calendar-content');
    const habits = Object.values(APP_STATE.habits);
    
    if (habits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <h3 class="empty-title">No Habits to Track</h3>
                <p class="empty-description">Create a habit to start tracking your progress on the calendar</p>
                <button class="btn btn-primary" onclick="openHabitModal()">
                    <span>➕</span> Add Habit
                </button>
            </div>
        `;
        return;
    }
    
    const mode = APP_STATE.calendarViewMode;
    
    if (mode === 'yearly') {
        renderYearlyView(container, habits);
    } else if (mode === 'monthly') {
        renderMonthlyView(container, habits);
    } else if (mode === 'weekly') {
        renderWeeklyView(container, habits);
    } else if (mode === 'daily') {
        renderDailyView(container, habits);
    }
};

const renderYearlyView = (container, habits) => {
    let html = `
        <div style="margin-bottom: 24px;">
            <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">2026 Study Calendar</h3>
            <p style="color: var(--text-secondary); font-size: 14px;">Click on any day to see all your study tasks and mark them complete</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
    `;
    
    for (let month = 0; month < 12; month++) {
        html += `
            <div class="month-calendar">
                <div class="month-header">${MONTHS[month]}</div>
                <div class="calendar-grid">
                    ${renderUnifiedMonthGrid(habits, APP_STATE.currentYear, month)}
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
};

const renderMonthlyView = (container, habits) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    
    let html = `
        <div style="margin-bottom: 24px; display: flex; justify-content: center; gap: 12px;">
            <button class="btn btn-secondary" onclick="changeMonth(-1)">← Previous</button>
            <h3 style="font-size: 24px; font-weight: 700; min-width: 200px; text-align: center;">${MONTHS[currentMonth]} 2026</h3>
            <button class="btn btn-secondary" onclick="changeMonth(1)">Next →</button>
        </div>
        
        <div class="month-calendar" style="max-width: 900px; margin: 0 auto;">
            <div class="calendar-grid">
                ${renderUnifiedMonthGrid(habits, APP_STATE.currentYear, currentMonth)}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
};

const renderWeeklyView = (container, habits) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = APP_STATE.settings.weekStart === 'monday' 
        ? (day === 0 ? -6 : 1 - day)
        : -day;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        weekDates.push(formatDate(date));
    }
    
    let html = `
        <div style="margin-bottom: 24px; display: flex; justify-content: center; gap: 12px;">
            <button class="btn btn-secondary" onclick="changeWeek(-1)">← Previous Week</button>
            <h3 style="font-size: 24px; font-weight: 700; min-width: 300px; text-align: center;">
                Week View
            </h3>
            <button class="btn btn-secondary" onclick="changeWeek(1)">Next Week →</button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; max-width: 1400px; margin: 0 auto;">
    `;
    
    // Render each day column
    weekDates.forEach((date, index) => {
        const dateObj = new Date(date + 'T00:00:00');
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];
        const dayNum = dateObj.getDate();
        const isToday = date === formatDate(new Date());
        const isFuture = isFutureDate(date);
        
        const activeHabits = habits.filter(h => isDateInRange(date, h.startDate, h.endDate));
        const completedCount = activeHabits.filter(h => h.completions[date]).length;
        
        html += `
            <div style="background: var(--bg-secondary); border-radius: 12px; padding: 16px; border: 2px solid ${isToday ? 'var(--accent-primary)' : 'var(--border-color)'};">
                <div style="text-align: center; margin-bottom: 12px;">
                    <div style="font-size: 14px; font-weight: 600; color: var(--text-secondary);">${dayName}</div>
                    <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">${dayNum}</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                        ${completedCount}/${activeHabits.length} done
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
        `;
        
        activeHabits.forEach(habit => {
            const isCompleted = habit.completions[date];
            html += `
                <div onclick="${!isFuture ? `toggleCompletion('${habit.id}', '${date}'); renderCalendar();` : ''}" 
                     style="background: var(--bg-elevated); padding: 8px; border-radius: 8px; cursor: ${!isFuture ? 'pointer' : 'default'}; 
                            border-left: 4px solid ${isCompleted ? 'var(--accent-success)' : 'var(--border-color)'}; 
                            transition: all 0.2s; ${!isFuture ? 'hover: transform: translateY(-2px);' : ''}"
                     title="${habit.name}">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 20px;">${habit.icon}</span>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 12px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${habit.name}
                            </div>
                        </div>
                        ${!isFuture ? `<span style="font-size: 16px;">${isCompleted ? '✓' : '○'}</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
};

const renderDailyView = (container, habits) => {
    const selectedDate = APP_STATE.selectedDate || formatDate(new Date());
    const date = new Date(selectedDate + 'T00:00:00');
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
    
    const activeHabits = habits.filter(h => isDateInRange(selectedDate, h.startDate, h.endDate));
    const completedCount = activeHabits.filter(h => h.completions[selectedDate]).length;
    
    let html = `
        <div style="margin-bottom: 24px; display: flex; justify-content: center; gap: 12px; align-items: center;">
            <button class="btn btn-secondary" onclick="changeDay(-1)">← Previous</button>
            <div style="text-align: center; min-width: 300px;">
                <h3 style="font-size: 28px; font-weight: 700; margin-bottom: 4px;">${dayName}</h3>
                <p style="font-size: 16px; color: var(--text-secondary);">${selectedDate}</p>
            </div>
            <button class="btn btn-secondary" onclick="changeDay(1)">Next →</button>
        </div>
        
        <div class="dashboard-card" style="max-width: 800px; margin: 0 auto 24px;">
            <div class="card-header">
                <h3 class="card-title">Daily Progress</h3>
                <span class="card-icon">📊</span>
            </div>
            <div class="card-content">
                <div class="stat-large">${completedCount}/${activeHabits.length}</div>
                <div class="stat-label">Habits completed</div>
                <div class="progress-bar mt-4">
                    <div class="progress-fill" style="width: ${activeHabits.length ? (completedCount / activeHabits.length * 100) : 0}%"></div>
                </div>
            </div>
        </div>
        
        <div style="max-width: 800px; margin: 0 auto;">
            <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Your Habits</h3>
            <div class="day-habit-list">
    `;
    
    if (activeHabits.length === 0) {
        html += `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3 class="empty-title">No Habits for This Day</h3>
                <p class="empty-description">No habits are scheduled for this date</p>
            </div>
        `;
    } else {
        activeHabits.forEach(habit => {
            const isCompleted = habit.completions[selectedDate];
            const stats = getHabitStats(habit);
            const isFuture = isFutureDate(selectedDate);
            
            html += `
                <div class="day-habit-item ${isCompleted ? 'completed' : 'incomplete'}">
                    <div class="day-habit-icon">${habit.icon}</div>
                    <div class="day-habit-info">
                        <div class="day-habit-name">${habit.name}</div>
                        <div class="day-habit-status">
                            ${isCompleted ? '✓ Completed' : isFuture ? 'Future date' : '○ Not completed'} • 
                            🔥 ${stats.currentStreak} streak • 
                            ${stats.progress}% progress
                        </div>
                    </div>
                    ${!isFuture ? `
                        <button class="day-habit-toggle ${isCompleted ? 'completed' : ''}" 
                                onclick="toggleCompletion('${habit.id}', '${selectedDate}'); renderCalendar();">
                            ${isCompleted ? '✓' : ''}
                        </button>
                    ` : ''}
                </div>
            `;
        });
    }
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
};

const renderYearCalendar = (habit) => {
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">';
    
    for (let month = 0; month < 12; month++) {
        html += `
            <div>
                <div class="month-header">${MONTHS[month]}</div>
                <div class="calendar-grid">
                    ${renderMonthGrid(habit, APP_STATE.currentYear, month)}
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
};

const renderMonthGrid = (habit, year, month, clickable = false) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month, APP_STATE.settings.weekStart);
    const dayHeaders = DAYS_SHORT[APP_STATE.settings.weekStart];
    
    let html = '';
    
    // Day headers
    dayHeaders.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isCompleted = habit.completions[date];
        const isFuture = isFutureDate(date);
        const isInRange = isDateInRange(date, habit.startDate, habit.endDate);
        
        let className = 'calendar-day';
        if (!isInRange) className += ' empty';
        else if (isFuture) className += ' future';
        else if (isCompleted) className += ' completed';
        
        const clickHandler = clickable && isInRange && !isFuture 
            ? `onclick="showDayDetails('${date}')"` 
            : isInRange && !isFuture 
            ? `onclick="toggleCompletion('${habit.id}', '${date}'); renderCalendar();"` 
            : '';
        
        html += `<div class="${className}" ${clickHandler} title="${date}">${day}</div>`;
    }
    
    return html;
};

const renderUnifiedMonthGrid = (habits, year, month) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month, APP_STATE.settings.weekStart);
    const dayHeaders = DAYS_SHORT[APP_STATE.settings.weekStart];
    
    let html = '';
    
    // Day headers
    dayHeaders.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isFuture = isFutureDate(date);
        
        // Check all habits for this date
        const activeHabits = habits.filter(h => isDateInRange(date, h.startDate, h.endDate));
        const completedCount = activeHabits.filter(h => h.completions[date]).length;
        const totalCount = activeHabits.length;
        
        let className = 'calendar-day unified-day';
        
        if (totalCount === 0) {
            className += ' empty';
        } else if (isFuture) {
            className += ' future';
        } else if (completedCount === totalCount) {
            className += ' completed';
        } else if (completedCount > 0) {
            className += ' partial';
        }
        
        const clickHandler = totalCount > 0 && !isFuture ? `onclick="showDayDetails('${date}')"` : '';
        
        // Show completion indicator
        let indicator = '';
        if (totalCount > 0 && !isFuture) {
            indicator = `<div class="day-indicator">${completedCount}/${totalCount}</div>`;
        }
        
        html += `
            <div class="${className}" ${clickHandler} title="${date} - ${completedCount}/${totalCount} tasks completed">
                <div class="day-number">${day}</div>
                ${indicator}
            </div>
        `;
    }
    
    return html;
};

const renderHabitsList = () => {
    const container = document.getElementById('habits-list');
    let habits = Object.values(APP_STATE.habits);
    
    if (habits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <h3 class="empty-title">No Habits Created</h3>
                <p class="empty-description">Start your journey by creating your first habit</p>
                <button class="btn btn-primary" onclick="openHabitModal()">
                    <span>➕</span> Create Habit
                </button>
            </div>
        `;
        return;
    }
    
    // Apply filters
    const filterPriority = document.getElementById('filter-priority').value;
    if (filterPriority !== 'all') {
        habits = habits.filter(h => h.priority === filterPriority);
    }
    
    // Apply sorting
    const sortBy = document.getElementById('sort-habits').value;
    habits.sort((a, b) => {
        if (sortBy === 'priority') {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        } else if (sortBy === 'progress') {
            return calculateProgress(b) - calculateProgress(a);
        } else if (sortBy === 'streak') {
            return calculateStreak(b).current - calculateStreak(a).current;
        } else if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        }
        return 0;
    });
    
    container.innerHTML = habits.map(habit => {
        const stats = getHabitStats(habit);
        return `
            <div class="habit-card priority-${habit.priority}">
                <div class="habit-icon">${habit.icon}</div>
                <div class="habit-info">
                    <div class="habit-header">
                        <h3 class="habit-name">${habit.name}</h3>
                        <span class="habit-priority ${habit.priority}">
                            ${habit.priority === 'high' ? '🔥' : habit.priority === 'medium' ? '⚡' : '🌱'} ${habit.priority}
                        </span>
                    </div>
                    ${habit.description ? `<p class="habit-description">${habit.description}</p>` : ''}
                    <div class="habit-stats">
                        <div class="habit-stat">
                            <span>🔥</span> <strong>${stats.currentStreak}</strong> streak
                        </div>
                        <div class="habit-stat">
                            <span>🏆</span> <strong>${stats.longestStreak}</strong> best
                        </div>
                        <div class="habit-stat">
                            <span>✅</span> <strong>${stats.totalCompletions}</strong> total
                        </div>
                        <div class="habit-stat">
                            <span>📊</span> <strong>${stats.progress}%</strong> progress
                        </div>
                    </div>
                    <div class="progress-bar mt-4">
                        <div class="progress-fill" style="width: ${stats.progress}%"></div>
                    </div>
                </div>
                <div class="habit-actions">
                    <button class="icon-btn" onclick="editHabit('${habit.id}')" title="Edit habit">✏️</button>
                    <button class="icon-btn" onclick="confirmDeleteHabit('${habit.id}')" title="Delete habit">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
};

const renderAnalytics = () => {
    const container = document.getElementById('analytics-content');
    const habits = Object.values(APP_STATE.habits);
    
    if (habits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📈</div>
                <h3 class="empty-title">No Analytics Yet</h3>
                <p class="empty-description">Create some habits and track them to see your analytics</p>
                <button class="btn btn-primary" onclick="openHabitModal()">
                    <span>➕</span> Add Habit
                </button>
            </div>
        `;
        return;
    }
    
    // Initialize analytics week offset if not exists
    if (!window.analyticsWeekOffset) {
        window.analyticsWeekOffset = 0;
    }
    
    // Get current week based on offset
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - (today.getDay() || 7) + 1 + (window.analyticsWeekOffset * 7));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        weekDates.push(formatDate(date));
    }
    
    // Calculate daily data for the week
    const weekData = weekDates.map(date => {
        const activeHabits = habits.filter(h => isDateInRange(date, h.startDate, h.endDate));
        const completed = activeHabits.filter(h => h.completions[date]).length;
        const total = activeHabits.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return { date, completed, total, percentage };
    });
    
    // Overall stats
    const totalCompleted = weekData.reduce((sum, day) => sum + day.completed, 0);
    const totalTasks = weekData.reduce((sum, day) => sum + day.total, 0);
    const avgCompletion = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    
    // Priority stats
    const priorityStats = { high: 0, medium: 0, low: 0 };
    habits.forEach(habit => {
        priorityStats[habit.priority] += getHabitStats(habit).totalCompletions;
    });
    
    // Top performers
    const topHabits = habits
        .map(h => ({ ...h, stats: getHabitStats(h) }))
        .sort((a, b) => b.stats.progress - a.stats.progress)
        .slice(0, 3);
    
    // Format week range
    const weekStart = new Date(weekDates[0] + 'T00:00:00');
    const weekEnd = new Date(weekDates[6] + 'T00:00:00');
    const weekRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    
    const maxHeight = Math.max(...weekData.map(d => d.total), 1);
    
    container.innerHTML = `
        <!-- Week Navigation -->
        <div class="dashboard-card" style="grid-column: 1 / -1;">
            <div class="card-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <button class="btn btn-secondary" onclick="changeAnalyticsWeek(-1)">
                        ← Previous Week
                    </button>
                    <h3 style="font-size: 18px; font-weight: 600;">${weekRange}</h3>
                    <button class="btn btn-secondary" onclick="changeAnalyticsWeek(1)" ${window.analyticsWeekOffset >= 0 ? 'disabled' : ''}>
                        Next Week →
                    </button>
                </div>
                
                <!-- Weekly Bar Chart -->
                <div style="background: var(--bg-elevated); padding: 24px; border-radius: 12px;">
                    <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; text-align: center;">Daily Task Completion</h4>
                    <div style="display: flex; gap: 12px; align-items: flex-end; height: 250px; padding: 20px 0;">
                        ${weekData.map((day, i) => {
                            const dateObj = new Date(day.date + 'T00:00:00');
                            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];
                            const isToday = day.date === formatDate(new Date());
                            const barHeight = day.total > 0 ? (day.total / maxHeight) * 100 : 0;
                            
                            return `
                                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                                    <!-- Completed count -->
                                    <div style="font-size: 14px; font-weight: 600; color: var(--accent-success); min-height: 20px;">
                                        ${day.completed > 0 ? day.completed : ''}
                                    </div>
                                    
                                    <!-- Bar container -->
                                    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; position: relative;">
                                        <!-- Total tasks bar (background) -->
                                        <div style="width: 100%; background: var(--bg-primary); height: ${barHeight}%; 
                                                    border-radius: 8px 8px 0 0; position: relative; border: 2px solid ${isToday ? 'var(--accent-primary)' : 'var(--border-color)'};">
                                            <!-- Completed tasks bar (foreground) -->
                                            <div style="width: 100%; background: linear-gradient(180deg, var(--accent-success), #059669); 
                                                        height: ${day.total > 0 ? (day.completed / day.total) * 100 : 0}%; 
                                                        border-radius: 6px 6px 0 0; position: absolute; bottom: 0; left: 0;
                                                        transition: all 0.3s;">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Total count -->
                                    <div style="font-size: 12px; color: var(--text-secondary); min-height: 18px;">
                                        ${day.total > 0 ? `/${day.total}` : ''}
                                    </div>
                                    
                                    <!-- Day name -->
                                    <div style="font-size: 13px; font-weight: ${isToday ? '700' : '500'}; 
                                                color: ${isToday ? 'var(--accent-primary)' : 'var(--text-primary)'};">
                                        ${dayName}
                                    </div>
                                    
                                    <!-- Date -->
                                    <div style="font-size: 11px; color: var(--text-secondary);">
                                        ${dateObj.getDate()}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <!-- Legend -->
                    <div style="display: flex; justify-content: center; gap: 24px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color); font-size: 13px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 20px; height: 20px; background: linear-gradient(180deg, var(--accent-success), #059669); border-radius: 4px;"></div>
                            <span>Completed</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 20px; height: 20px; background: var(--bg-primary); border: 2px solid var(--border-color); border-radius: 4px;"></div>
                            <span>Total Tasks</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Summary Cards -->
        <div class="dashboard-card">
            <div class="card-header">
                <h3 class="card-title">Week Average</h3>
                <span class="card-icon">📊</span>
            </div>
            <div class="card-content">
                <div class="stat-large">${avgCompletion}%</div>
                <div class="stat-label">Average completion</div>
            </div>
        </div>
        
        <div class="dashboard-card">
            <div class="card-header">
                <h3 class="card-title">Total Completed</h3>
                <span class="card-icon">✅</span>
            </div>
            <div class="card-content">
                <div class="stat-large">${totalCompleted}</div>
                <div class="stat-label">Tasks this week</div>
            </div>
        </div>
        
        <div class="dashboard-card">
            <div class="card-header">
                <h3 class="card-title">Best Day</h3>
                <span class="card-icon">🏆</span>
            </div>
            <div class="card-content">
                <div class="stat-large">${Math.max(...weekData.map(d => d.percentage))}%</div>
                <div class="stat-label">Peak performance</div>
            </div>
        </div>
        
        <!-- Priority Breakdown -->
        <div class="dashboard-card" style="grid-column: 1 / -1;">
            <div class="card-header">
                <h3 class="card-title">All-Time Priority Stats</h3>
            </div>
            <div class="card-content">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                    ${Object.entries(priorityStats).map(([priority, count]) => {
                        const icon = priority === 'high' ? '🔥' : priority === 'medium' ? '⚡' : '🌱';
                        return `
                            <div style="padding: 20px; background: var(--bg-elevated); border-radius: 12px; text-align: center;">
                                <div style="font-size: 36px; margin-bottom: 12px;">${icon}</div>
                                <div style="font-size: 32px; font-weight: 700; margin-bottom: 8px; color: var(--accent-primary);">${count}</div>
                                <div style="font-size: 14px; color: var(--text-secondary); text-transform: capitalize;">${priority} Priority</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
        
        <!-- Top Performers -->
        <div class="dashboard-card" style="grid-column: 1 / -1;">
            <div class="card-header">
                <h3 class="card-title">🏆 Top Performers</h3>
            </div>
            <div class="card-content">
                ${topHabits.map((habit, i) => `
                    <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--bg-elevated); border-radius: 8px; margin-bottom: 8px;">
                        <div style="font-size: 24px; font-weight: 700; color: var(--text-secondary); width: 32px;">#${i + 1}</div>
                        <span style="font-size: 32px;">${habit.icon}</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; margin-bottom: 4px;">${habit.name}</div>
                            <div style="font-size: 14px; color: var(--text-secondary);">
                                ${habit.stats.progress}% progress • 🔥 ${habit.stats.currentStreak} streak
                            </div>
                        </div>
                        <div style="font-size: 24px; font-weight: 700; color: var(--accent-success);">${habit.stats.progress}%</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

// Analytics week navigation
const changeAnalyticsWeek = (direction) => {
    if (!window.analyticsWeekOffset) {
        window.analyticsWeekOffset = 0;
    }
    window.analyticsWeekOffset += direction;
    
    // Don't go into future
    if (window.analyticsWeekOffset > 0) {
        window.analyticsWeekOffset = 0;
    }
    
    renderAnalytics();
};

// === MODAL MANAGEMENT ===
const openHabitModal = (habitId = null) => {
    const modal = document.getElementById('habit-modal');
    const form = document.getElementById('habit-form');
    const title = document.getElementById('modal-title');
    
    APP_STATE.editingHabitId = habitId;
    
    if (habitId) {
        const habit = APP_STATE.habits[habitId];
        title.textContent = 'Edit Habit';
        document.getElementById('habit-name').value = habit.name;
        document.getElementById('habit-description').value = habit.description;
        document.getElementById('habit-category').value = habit.category;
        document.getElementById('habit-priority').value = habit.priority;
        document.getElementById('selected-icon').textContent = habit.icon;
        document.getElementById('habit-color').value = habit.color;
        document.getElementById('habit-start-date').value = habit.startDate;
        document.getElementById('habit-end-date').value = habit.endDate || '';
        document.querySelector(`input[name="goal-type"][value="${habit.goalType}"]`).checked = true;
        if (habit.goalValue) {
            document.getElementById('goal-value').value = habit.goalValue;
            document.getElementById('goal-value-container').classList.remove('hidden');
        }
        document.getElementById('habit-reminder').checked = habit.reminderEnabled;
    } else {
        title.textContent = 'Add New Habit';
        form.reset();
        document.getElementById('habit-start-date').value = formatDate(new Date());
        document.getElementById('selected-icon').textContent = '💪';
        document.getElementById('goal-value-container').classList.add('hidden');
    }
    
    modal.classList.add('active');
};

const closeHabitModal = () => {
    document.getElementById('habit-modal').classList.remove('active');
    APP_STATE.editingHabitId = null;
};

const confirmDeleteHabit = (habitId) => {
    const habit = APP_STATE.habits[habitId];
    showConfirmModal(
        `Are you sure you want to delete "${habit.name}"? This action cannot be undone.`,
        () => {
            deleteHabit(habitId);
            showToast('Habit deleted successfully', 'success');
            renderHabitsList();
        }
    );
};

const showConfirmModal = (message, onConfirm) => {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-message').textContent = message;
    
    const confirmBtn = modal.querySelector('.confirm-ok');
    const cancelBtn = modal.querySelector('.confirm-cancel');
    
    const handleConfirm = () => {
        onConfirm();
        modal.classList.remove('active');
        cleanup();
    };
    
    const handleCancel = () => {
        modal.classList.remove('active');
        cleanup();
    };
    
    const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    
    modal.classList.add('active');
};

const editHabit = (habitId) => {
    openHabitModal(habitId);
};

// === EVENT HANDLERS ===
const handleHabitFormSubmit = (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('habit-name').value.trim(),
        description: document.getElementById('habit-description').value.trim(),
        category: document.getElementById('habit-category').value,
        priority: document.getElementById('habit-priority').value,
        icon: document.getElementById('selected-icon').textContent,
        color: document.getElementById('habit-color').value,
        startDate: document.getElementById('habit-start-date').value,
        endDate: document.getElementById('habit-end-date').value || null,
        goalType: document.querySelector('input[name="goal-type"]:checked').value,
        goalValue: document.getElementById('goal-value').value || null,
        reminderEnabled: document.getElementById('habit-reminder').checked
    };
    
    // Validation
    if (!formData.name) {
        document.getElementById('name-error').textContent = 'Habit name is required';
        return;
    }
    
    if (APP_STATE.editingHabitId) {
        updateHabit(APP_STATE.editingHabitId, formData);
        showToast('Habit updated successfully', 'success');
    } else {
        createHabit(formData);
        showToast('Habit created successfully', 'success');
    }
    
    closeHabitModal();
    
    // Refresh current view
    if (APP_STATE.currentView === 'dashboard') renderDashboard();
    else if (APP_STATE.currentView === 'calendar') renderCalendar();
    else if (APP_STATE.currentView === 'habits') renderHabitsList();
};

const handleThemeToggle = () => {
    const newTheme = APP_STATE.settings.theme === 'dark' ? 'light' : 'dark';
    APP_STATE.settings.theme = newTheme;
    document.body.setAttribute('data-theme', newTheme);
    document.getElementById('theme-label').textContent = newTheme === 'dark' ? 'Dark' : 'Light';
    
    const track = document.querySelector('.toggle-track');
    if (newTheme === 'light') {
        track.classList.add('active');
    } else {
        track.classList.remove('active');
    }
    
    saveToStorage();
};

const handleWeekStartChange = (e) => {
    APP_STATE.settings.weekStart = e.target.value;
    saveToStorage();
    if (APP_STATE.currentView === 'calendar') {
        renderCalendar();
    }
};

const handleViewModeChange = (e) => {
    APP_STATE.settings.viewMode = e.target.value;
    saveToStorage();
};

const handleExportData = () => {
    const dataStr = JSON.stringify(APP_STATE, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habit-tracker-${formatDate(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully', 'success');
};

const handleResetData = () => {
    showConfirmModal(
        'Are you sure you want to reset all data? This will delete all your habits and cannot be undone.',
        () => {
            APP_STATE.habits = {};
            saveToStorage();
            showToast('All data has been reset', 'success');
            renderDashboard();
        }
    );
};

// === INITIALIZATION ===
const init = () => {
    // Load data from storage
    loadFromStorage();
    
    // Set theme
    document.body.setAttribute('data-theme', APP_STATE.settings.theme);
    if (APP_STATE.settings.theme === 'light') {
        document.querySelector('.toggle-track').classList.add('active');
    }
    document.getElementById('theme-label').textContent = APP_STATE.settings.theme === 'dark' ? 'Dark' : 'Light';
    
    // Set settings
    document.getElementById('week-start').value = APP_STATE.settings.weekStart;
    document.getElementById('view-mode').value = APP_STATE.settings.viewMode;
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => switchView(link.dataset.view));
    });
    
    // Habit modal
    document.querySelectorAll('#add-habit-btn, #add-habit-btn-2').forEach(btn => {
        btn.addEventListener('click', () => openHabitModal());
    });
    
    document.querySelector('.modal-close').addEventListener('click', closeHabitModal);
    document.querySelector('.modal-cancel').addEventListener('click', closeHabitModal);
    document.querySelector('.modal-overlay').addEventListener('click', closeHabitModal);
    
    // Habit form
    document.getElementById('habit-form').addEventListener('submit', handleHabitFormSubmit);
    
    // Goal type change
    document.querySelectorAll('input[name="goal-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const container = document.getElementById('goal-value-container');
            if (e.target.value === 'daily') {
                container.classList.add('hidden');
            } else {
                container.classList.remove('hidden');
                if (e.target.value === 'weekly') {
                    document.getElementById('goal-value').max = 7;
                    document.getElementById('goal-value').placeholder = 'Days per week (1-7)';
                } else {
                    document.getElementById('goal-value').max = 365;
                    document.getElementById('goal-value').placeholder = 'Total days';
                }
            }
        });
    });
    
    // Emoji picker
    const iconBtn = document.getElementById('habit-icon');
    const emojiPicker = document.getElementById('emoji-picker');
    
    iconBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        emojiPicker.classList.toggle('hidden');
    });
    
    document.querySelectorAll('.emoji-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const emoji = btn.getAttribute('data-emoji');
            document.getElementById('selected-icon').textContent = emoji;
            emojiPicker.classList.add('hidden');
        });
    });
    
    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
        if (!iconBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
            emojiPicker.classList.add('hidden');
        }
    });
    
    // Settings
    document.getElementById('theme-toggle').addEventListener('click', handleThemeToggle);
    document.getElementById('week-start').addEventListener('change', handleWeekStartChange);
    document.getElementById('view-mode').addEventListener('change', handleViewModeChange);
    document.getElementById('export-data-btn').addEventListener('click', handleExportData);
    document.getElementById('reset-data-btn').addEventListener('click', handleResetData);
    
    // Filters and sorting
    document.getElementById('filter-priority').addEventListener('change', renderHabitsList);
    document.getElementById('sort-habits').addEventListener('change', renderHabitsList);
    
    // Calendar view mode switching
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => switchCalendarView(btn.dataset.mode));
    });
    
    // Day details modal
    document.querySelector('.day-details-close').addEventListener('click', closeDayDetailsModal);
    document.getElementById('day-details-modal').querySelector('.modal-overlay').addEventListener('click', closeDayDetailsModal);
    
    // Render initial view
    renderDashboard();
};

// === CALENDAR NAVIGATION HELPERS ===
const changeDay = (offset) => {
    const currentDate = new Date(APP_STATE.selectedDate + 'T00:00:00');
    currentDate.setDate(currentDate.getDate() + offset);
    APP_STATE.selectedDate = formatDate(currentDate);
    renderCalendar();
};

const changeWeek = (offset) => {
    const currentDate = new Date(APP_STATE.selectedDate + 'T00:00:00');
    currentDate.setDate(currentDate.getDate() + (offset * 7));
    APP_STATE.selectedDate = formatDate(currentDate);
    renderCalendar();
};

const changeMonth = (offset) => {
    const currentDate = new Date(APP_STATE.selectedDate + 'T00:00:00');
    currentDate.setMonth(currentDate.getMonth() + offset);
    APP_STATE.selectedDate = formatDate(currentDate);
    renderCalendar();
};

const switchCalendarView = (mode) => {
    APP_STATE.calendarViewMode = mode;
    
    // Update button states
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });
    
    renderCalendar();
};

const showDayDetails = (date) => {
    const modal = document.getElementById('day-details-modal');
    const content = document.getElementById('day-details-content');
    const title = document.getElementById('day-details-title');
    
    const dateObj = new Date(date + 'T00:00:00');
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];
    const monthName = MONTHS[dateObj.getMonth()];
    const day = dateObj.getDate();
    
    title.textContent = `${dayName}, ${monthName} ${day}`;
    
    const habits = Object.values(APP_STATE.habits).filter(h => isDateInRange(date, h.startDate, h.endDate));
    const completedCount = habits.filter(h => h.completions[date]).length;
    const currentNote = APP_STATE.dailyNotes[date] || '';
    
    let html = `
        <div class="day-detail-header">
            <div class="day-detail-date">${date}</div>
            <div class="day-detail-stats">
                <span><strong>${completedCount}/${habits.length}</strong> completed</span>
                <span>•</span>
                <span><strong>${Math.round((completedCount / habits.length) * 100) || 0}%</strong> progress</span>
            </div>
        </div>
        
        <!-- Daily Notes Section -->
        <div style="background: var(--bg-elevated); padding: 16px; border-radius: 12px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                    📝 Daily Notes
                </h3>
            </div>
            <textarea 
                id="daily-note-input" 
                placeholder="Write your thoughts, learnings, or reflections for this day..."
                style="width: 100%; min-height: 100px; padding: 12px; background: var(--bg-primary); 
                       border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);
                       font-family: inherit; font-size: 14px; resize: vertical;"
            >${currentNote}</textarea>
            <button 
                onclick="saveDailyNote('${date}')" 
                class="btn btn-primary" 
                style="margin-top: 8px; width: 100%;">
                💾 Save Note
            </button>
        </div>
        
        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">📋 Tasks for this day</h3>
        <div class="day-habit-list">
    `;
    
    if (habits.length === 0) {
        html += `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3 class="empty-title">No Habits for This Day</h3>
                <p class="empty-description">No habits are scheduled for this date</p>
            </div>
        `;
    } else {
        habits.forEach(habit => {
            const isCompleted = habit.completions[date];
            const stats = getHabitStats(habit);
            const isFuture = isFutureDate(date);
            
            html += `
                <div class="day-habit-item ${isCompleted ? 'completed' : 'incomplete'}">
                    <div class="day-habit-icon">${habit.icon}</div>
                    <div class="day-habit-info">
                        <div class="day-habit-name">${habit.name}</div>
                        <div class="day-habit-status">
                            ${isCompleted ? '✓ Completed' : isFuture ? 'Future date' : '○ Not completed'} • 
                            🔥 ${stats.currentStreak} streak • 
                            <span class="habit-priority ${habit.priority}">${habit.priority === 'high' ? '🔥' : habit.priority === 'medium' ? '⚡' : '🌱'} ${habit.priority}</span>
                        </div>
                    </div>
                    ${!isFuture ? `
                        <button class="day-habit-toggle ${isCompleted ? 'completed' : ''}" 
                                onclick="toggleCompletion('${habit.id}', '${date}'); showDayDetails('${date}'); renderCalendar();">
                            ${isCompleted ? '✓' : ''}
                        </button>
                    ` : ''}
                </div>
            `;
        });
    }
    
    html += '</div>';
    content.innerHTML = html;
    modal.classList.add('active');
};

const saveDailyNote = (date) => {
    const noteInput = document.getElementById('daily-note-input');
    const noteText = noteInput.value.trim();
    
    if (noteText) {
        APP_STATE.dailyNotes[date] = noteText;
        showToast('Note saved successfully! 📝', 'success');
    } else {
        delete APP_STATE.dailyNotes[date];
        showToast('Note deleted', 'success');
    }
    
    saveToStorage();
};

const saveQuickNote = () => {
    const today = formatDate(new Date());
    const noteInput = document.getElementById('quick-note-input');
    const noteText = noteInput.value.trim();
    
    if (noteText) {
        APP_STATE.dailyNotes[today] = noteText;
        showToast('Note saved! 📝', 'success');
    } else {
        delete APP_STATE.dailyNotes[today];
    }
    
    saveToStorage();
};

const closeDayDetailsModal = () => {
    document.getElementById('day-details-modal').classList.remove('active');
};

// Make functions globally accessible
window.openHabitModal = openHabitModal;
window.closeHabitModal = closeHabitModal;
window.editHabit = editHabit;
window.confirmDeleteHabit = confirmDeleteHabit;
window.toggleCompletion = toggleCompletion;
window.changeDay = changeDay;
window.changeWeek = changeWeek;
window.changeMonth = changeMonth;
window.showDayDetails = showDayDetails;
window.saveDailyNote = saveDailyNote;
window.saveQuickNote = saveQuickNote;
window.changeAnalyticsWeek = changeAnalyticsWeek;

// Start the app
document.addEventListener('DOMContentLoaded', init);
