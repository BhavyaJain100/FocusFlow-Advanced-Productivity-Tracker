document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let appState = {
        currentDate: new Date(),
        tasks: {},
        dailyStreak: { count: 0, lastCompletionDate: null },
        journalEntries: {},
        customThemes: {},
        pomodoro: {
            timerId: null,
            mode: 'pomodoro',
            timeLeft: 25 * 60,
            isRunning: false,
            session: 'work',
            sessionStartTime: 25 * 60,
        },
        currentEditingDate: null,
    };

    // --- CHART INSTANCES ---
    let chartInstances = {};

    // --- PRESET THEMES ---
    const presetThemes = {
        default: {
            name: 'Default Blue', isPreset: true,
            colors: {
                '--primary': '#4361ee', '--secondary': '#3f37c9', '--background': '#ffffff',
                '--card-bg': '#f1f7fe', '--text': '#333333', '--border': '#dee2e6'
            }
        },
        cute: {
            name: 'Cute Pink', isPreset: true, className: 'cute-theme',
            colors: {
                '--primary': '#f72585', '--secondary': '#b5179e', '--background': '#fff0f3',
                '--card-bg': '#ffffff', '--text': '#571030', '--border': '#fbc4d1'
            }
        },
        fierce: {
            name: 'Fierce Red', isPreset: true, className: 'fierce-theme',
            colors: {
                '--primary': '#d00000', '--secondary': '#9d0208', '--background': '#03071e',
                '--card-bg': '#14213d', '--text': '#ffffff', '--border': '#370617'
            }
        },
        dark: {
            name: 'Dark Mode', isPreset: true, className: 'dark-theme',
            colors: {
                '--primary': '#4361ee', '--secondary': '#3f37c9', '--background': '#121826',
                '--card-bg': '#1a2438', '--text': '#e0e0e0', '--border': '#2d3748'
            }
        }
    };
    
    const affirmationsList = [
        "I am capable of achieving my goals.", "I am focused and productive.", "Every day, I am getting better and better.",
        "I believe in my ability to succeed.", "I am creating the life of my dreams.", "I am worthy of all the good things that come my way.",
        "My potential to succeed is infinite.", "I am a powerhouse of creativity and intelligence.", "I am confident in my skills and abilities.",
        "I attract success and prosperity.", "My focus is a powerful tool for creation.", "I release all resistance to my goals.",
        "I am organized, efficient, and on top of my game.", "Challenges are opportunities for growth.", "I am disciplined and committed.",
        "My positive thoughts create my positive reality.", "I am a magnet for brilliant ideas.", "I complete my tasks with joy and enthusiasm.",
        "I am proud of the progress I make every day.", "My work makes a positive difference.", "I am building a future I am excited about.",
        "I easily overcome distractions.", "My mind is clear and my thoughts are focused.", "I am the architect of my life.",
        "Every small step I take leads to massive success.", "I am energized and ready to tackle my day.", "I trust my intuition to guide me.",
        "I celebrate my accomplishments, big and small.", "I learn and grow from every experience.", "I am persistent in the pursuit of my dreams.",
        "I am a creator of my own destiny.", "My ability to conquer my challenges is limitless.", "Today, I am victorious.",
        "I am motivated by my purpose, not my problems.", "I radiate confidence, certainty, and optimism.", "I am at peace with my past and excited for my future.",
        "My dedication is unwavering.", "I choose to be happy and to love myself today.", "I transform obstacles into stepping stones.",
        "I am worthy of respect and admiration.", "I am a leader and a positive influence.", "My workflow is smooth and efficient.",
        "I am grateful for my unique talents.", "I am a lifelong learner, always growing.", "My efforts are being supported by the universe."
    ];

    // --- DATA & UTILITY FUNCTIONS ---
    const getISODateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const createDateFromISO = (isoString) => {
        const parts = isoString.split('-').map(part => parseInt(part, 10));
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function saveData() {
        localStorage.setItem('productivityTasks_v8', JSON.stringify(appState.tasks));
        localStorage.setItem('dailyStreak_v8', JSON.stringify(appState.dailyStreak));
        localStorage.setItem('journalEntries_v8', JSON.stringify(appState.journalEntries));
        localStorage.setItem('customThemes_v8', JSON.stringify(appState.customThemes));
        localStorage.setItem('selectedTheme_v8', document.body.dataset.theme || 'default');
    }

    function loadData() {
        appState.tasks = JSON.parse(localStorage.getItem('productivityTasks_v8')) || {};
        appState.dailyStreak = JSON.parse(localStorage.getItem('dailyStreak_v8')) || { count: 0, lastCompletionDate: null };
        appState.journalEntries = JSON.parse(localStorage.getItem('journalEntries_v8')) || {};
        appState.customThemes = JSON.parse(localStorage.getItem('customThemes_v8')) || {};
        const savedTheme = localStorage.getItem('selectedTheme_v8') || 'default';
        applyTheme(savedTheme);
    }

    function renderAll() {
        renderHeader();
        renderDashboard();
        renderTimetable();
        if (document.getElementById('analysis').classList.contains('active')) {
           renderAnalysis();
        }
        renderJournalPage();
        renderStreaksAndAchievements();
        renderOverallAnalysis();
        renderThemeSelectors();
    }
    
    // --- THEME MANAGEMENT ---
    function applyTheme(themeKey) {
        const allThemes = { ...presetThemes, ...appState.customThemes };
        const theme = allThemes[themeKey] || presetThemes.default;
        document.body.className = '';
        if (theme.className) document.body.classList.add(theme.className);
        
        Object.entries(theme.colors).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));
        document.body.dataset.theme = themeKey;

        const isDark = theme.colors['--background'] < '#888888';
        document.querySelector('#themeToggle i').className = `fas ${isDark ? 'fa-sun' : 'fa-moon'}`;
        
        updateColorPickers(theme.colors);
        if (Object.keys(chartInstances).length > 0) renderAnalysis();
    }
    
    function updateColorPickers(colors) {
        document.getElementById('primary-color').value = colors['--primary'];
        document.getElementById('background-color').value = colors['--background'];
        document.getElementById('card-bg-color').value = colors['--card-bg'];
        document.getElementById('text-color').value = colors['--text'];
    }

    function saveCustomTheme() {
        const nameInput = document.getElementById('custom-theme-name');
        const name = nameInput.value.trim();
        if (!name) {
            alert("Please enter a name for your custom theme.");
            return;
        }
        const themeKey = `custom_${name.replace(/\s+/g, '_').toLowerCase()}`;

        appState.customThemes[themeKey] = {
            name: name,
            isPreset: false,
            colors: {
                '--primary': document.getElementById('primary-color').value,
                '--secondary': document.getElementById('primary-color').value,
                '--background': document.getElementById('background-color').value,
                '--card-bg': document.getElementById('card-bg-color').value,
                '--text': document.getElementById('text-color').value,
                '--border': document.getElementById('text-color').value + '33',
            }
        };
        
        nameInput.value = '';
        applyTheme(themeKey);
        renderThemeSelectors();
        saveData();
        renderStreaksAndAchievements();
        alert(`Theme "${name}" saved!`);
    }

    function deleteTheme(themeKey) {
        if (confirm(`Are you sure you want to delete the theme "${appState.customThemes[themeKey].name}"?`)) {
            delete appState.customThemes[themeKey];
            if (document.body.dataset.theme === themeKey) applyTheme('default');
            renderThemeSelectors();
            saveData();
        }
    }
    
    function renderThemeSelectors() {
        const container = document.getElementById('preset-themes-container');
        container.innerHTML = '';
        const allThemes = { ...presetThemes, ...appState.customThemes };
        const presetsUnlocked = Object.keys(appState.customThemes).length > 0;

        Object.entries(allThemes).forEach(([key, theme]) => {
            const swatch = document.createElement('div');
            swatch.className = 'theme-swatch';
            swatch.dataset.theme = key;
            swatch.style.background = `linear-gradient(135deg, ${theme.colors['--primary']}, ${theme.colors['--card-bg']})`;
            
            if (theme.isPreset && !presetsUnlocked) {
                swatch.classList.add('locked');
            }
            
            let innerHTML = `<div class="theme-label">${theme.name}</div>`;
            if (!theme.isPreset) {
                innerHTML += `<button class="delete-theme-btn" data-theme-key="${key}"><i class="fas fa-times"></i></button>`;
            }
            swatch.innerHTML = innerHTML;
            container.appendChild(swatch);
        });
    }

    // --- HEADER & DASHBOARD ---
    function renderHeader() {
        document.getElementById('currentDateHeader').textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const todayStr = getISODateString(new Date());
        const todayTasks = appState.tasks[todayStr]?.filter(t => t.text) || [];
        const completed = todayTasks.filter(t => t.completed).length;
        const productivity = todayTasks.length > 0 ? Math.round((completed / todayTasks.length) * 100) : 0;
        
        document.getElementById('productivityPercent').textContent = `${productivity}%`;
        document.getElementById('motivationalQuote').textContent = `"${affirmationsList[new Date().getDate() % affirmationsList.length]}"`;
    }

    function renderDashboard() {
        renderTodaysChecklist();
        const todayStr = getISODateString(new Date());
        document.getElementById('journal-textarea').value = appState.journalEntries[todayStr] || '';
        renderAffirmation();
    }

    function renderAffirmation() {
        document.getElementById('daily-affirmation').textContent = `"${affirmationsList[Math.floor(Math.random() * affirmationsList.length)]}"`;
    }

    function renderTodaysChecklist() {
        const container = document.getElementById('todaysChecklist');
        const todayStr = getISODateString(new Date());
        const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
        const todayTasks = (appState.tasks[todayStr] || []).filter(t => t.text).sort((a, b) => (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4));

        if (todayTasks.length === 0) {
            container.innerHTML = '<p>No tasks scheduled for today. Click on today in the timetable to add some!</p>';
            return;
        }
        
        container.innerHTML = '';
        todayTasks.forEach(task => {
            const item = document.createElement('div');
            item.className = `checklist-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;
            item.innerHTML = `
                <input type="checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${task.text}</span>
                <span class="task-time">${task.time}</span>
            `;
            item.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
                const taskToUpdate = appState.tasks[todayStr].find(t => t.id == e.target.dataset.id);
                if (taskToUpdate) {
                    taskToUpdate.completed = e.target.checked;
                    updateDailyStreak(todayStr);
                    saveData();
                    renderAll();
                }
            });
            container.appendChild(item);
        });
    }
    
     // --- TIMETABLE & MODAL ---
    function renderTimetable() {
        const calendarEl = document.getElementById('calendar');
        calendarEl.innerHTML = '';
        const { currentDate, tasks } = appState;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        document.getElementById('calendar-title').innerHTML = `<i class="fas fa-calendar-alt"></i> ${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
        
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayStr = getISODateString(new Date());

        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-header';
            dayEl.textContent = day;
            calendarEl.appendChild(dayEl);
        });

        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarEl.appendChild(document.createElement('div'));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = getISODateString(date);
            const dayTasks = tasks[dateStr]?.filter(t => t.text) || [];
            const completed = dayTasks.filter(t => t.completed).length;
            const percent = dayTasks.length > 0 ? (completed / dayTasks.length) * 100 : 0;
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            if(dateStr === todayStr) dayDiv.classList.add('today');
            dayDiv.dataset.date = dateStr;
            dayDiv.innerHTML = `
                <div class="day-number">${day}</div>
                <div class="day-tasks">${dayTasks.slice(0, 3).map(t => `<p>${t.text}</p>`).join('')}</div>
                <div class="day-progress"><div class="day-progress-bar" style="width: ${percent}%"></div></div>
            `;
            dayDiv.addEventListener('click', () => openTaskModal(dateStr));
            calendarEl.appendChild(dayDiv);
        }
    }

    function openTaskModal(dateStr) {
        appState.currentEditingDate = dateStr;
        const dateObj = createDateFromISO(dateStr);
        document.getElementById('modalTitle').textContent = `Schedule for ${dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
        
        const tableBody = document.getElementById('modalTableBody');
        tableBody.innerHTML = '';
        const dayTasks = appState.tasks[dateStr] || [];
        if (dayTasks.length > 0) {
            dayTasks.forEach(task => addTaskRowToModal(task));
        } else {
            addTaskRowToModal();
        }
        document.getElementById('taskModal').style.display = 'block';
    }
    
    function addTaskRowToModal(task = {}) {
        const { id = Date.now(), time = '', text = '', completed = false, priority = 'medium', category = 'personal' } = task;
        const tableBody = document.getElementById('modalTableBody');
        const row = tableBody.insertRow();
        row.dataset.id = id;
        row.innerHTML = `
            <td><input type="time" class="time-input" value="${time}"></td>
            <td><input type="text" class="task-input" value="${text}" placeholder="Task description..."></td>
            <td>
                <select class="category-select">
                    <option value="study" ${category === 'study' ? 'selected' : ''}>Study</option>
                    <option value="work" ${category === 'work' ? 'selected' : ''}>Work</option>
                    <option value="health" ${category === 'health' ? 'selected' : ''}>Health</option>
                    <option value="personal" ${category === 'personal' ? 'selected' : ''}>Personal</option>
                </select>
            </td>
            <td>
                <select class="priority-select">
                    <option value="high" ${priority === 'high' ? 'selected' : ''}>High</option>
                    <option value="medium" ${priority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="low" ${priority === 'low' ? 'selected' : ''}>Low</option>
                </select>
            </td>
            <td><input type="checkbox" class="task-checkbox" ${completed ? 'checked' : ''}></td>
            <td><button class="remove-task-btn btn btn-danger" style="padding: 5px 10px;">&times;</button></td>
        `;
        row.querySelector('.remove-task-btn').addEventListener('click', () => row.remove());
        const newTextInput = row.querySelector('.task-input');
        newTextInput.focus();
        newTextInput.selectionStart = newTextInput.selectionEnd = newTextInput.value.length;
    }

    function saveTasksAndCloseModal() {
        const { currentEditingDate } = appState;
        if (!currentEditingDate) return;

        const newTasks = [];
        document.querySelectorAll('#modalTableBody tr').forEach(row => {
            const text = row.querySelector('.task-input').value.trim();
            if (text) {
                const existingTask = (appState.tasks[currentEditingDate] || []).find(t => t.id == row.dataset.id) || {};
                newTasks.push({
                    id: row.dataset.id,
                    time: row.querySelector('.time-input').value,
                    text: text,
                    category: row.querySelector('.category-select').value,
                    priority: row.querySelector('.priority-select').value,
                    completed: row.querySelector('.task-checkbox').checked,
                    pomodoroTime: existingTask.pomodoroTime || 0
                });
            }
        });
        
        appState.tasks[currentEditingDate] = newTasks.sort((a, b) => a.time.localeCompare(b.time));
        updateDailyStreak(currentEditingDate);
        saveData();
        closeTaskModal();
        renderAll();
    }

    function cloneTodayRoutine() {
        const today = new Date();
        const todayStr = getISODateString(today);
        const todayTasks = appState.tasks[todayStr];

        if (!todayTasks || todayTasks.length === 0) {
            alert('Please set up tasks for today first!');
            return;
        }
        
        if (!confirm("This will overwrite tasks for all future days in the current month. Are you sure?")) return;

        const { currentDate } = appState;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = today.getDate() + 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            if (date.getMonth() === month) {
                const dateStr = getISODateString(date);
                appState.tasks[dateStr] = JSON.parse(JSON.stringify(todayTasks)).map(t => ({
                    ...t,
                    completed: false,
                    id: Date.now() + Math.random()
                }));
            }
        }
        saveData();
        renderTimetable();
        alert(`Today's routine has been cloned to all future days in ${currentDate.toLocaleString('default', { month: 'long' })}!`);
    }

    function uncloneMonth() {
        const today = new Date();
        if (!confirm("This will clear all tasks scheduled for future days in the current month. Are you sure?")) return;
        
        const { currentDate } = appState;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let day = today.getDate() + 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
             if (date.getMonth() === month) {
                const dateStr = getISODateString(date);
                delete appState.tasks[dateStr];
            }
        }
        saveData();
        renderTimetable();
        alert('All future tasks in the current month have been cleared!');
    }
    
     function clonePreviousDay() {
        const { currentEditingDate } = appState;
        if (!currentEditingDate) return;
        
        const currentDay = createDateFromISO(currentEditingDate);
        const prevDay = new Date(currentDay);
        prevDay.setDate(prevDay.getDate() - 1);
        const prevDayStr = getISODateString(prevDay);
        const prevDayTasks = appState.tasks[prevDayStr];

        if (!prevDayTasks || prevDayTasks.length === 0) {
            alert('No tasks on the previous day to clone!');
            return;
        }
        
        document.getElementById('modalTableBody').innerHTML = '';
        prevDayTasks.forEach(task => addTaskRowToModal({ ...task, completed: false }));
    }

    function closeTaskModal() {
        document.getElementById('taskModal').style.display = 'none';
        appState.currentEditingDate = null;
    }

    // --- POMODORO TIMER ---
    function updatePomodoroDisplay() {
        const { timeLeft } = appState.pomodoro;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('pomodoro-time').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function logPomodoroTime() {
        const { pomodoro } = appState;
        if (pomodoro.session !== 'work') return;
        
        const timeWorked = pomodoro.sessionStartTime - pomodoro.timeLeft;
        if (timeWorked <= 0) return;

        const taskName = document.getElementById('pomodoro-task-input').value.trim() || "Miscellaneous";
        const todayStr = getISODateString(new Date());
        if (!appState.tasks[todayStr]) appState.tasks[todayStr] = [];

        let task = appState.tasks[todayStr].find(t => t.text.toLowerCase() === taskName.toLowerCase());
        if (!task) {
            task = {
                id: Date.now(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                text: taskName,
                completed: false,
                priority: 'medium',
                category: taskName === "Miscellaneous" ? 'personal' : 'study',
                pomodoroTime: 0
            };
            appState.tasks[todayStr].push(task);
        }
        task.pomodoroTime = (task.pomodoroTime || 0) + (timeWorked);
        saveData();
        renderAll();
    }

    function startPomodoro() {
        const { pomodoro } = appState;
        if (pomodoro.isRunning) return;
        pomodoro.isRunning = true;
        pomodoro.sessionStartTime = pomodoro.timeLeft;

        document.getElementById('pomodoro-start').style.display = 'none';
        document.getElementById('pomodoro-pause').style.display = 'inline-flex';

        pomodoro.timerId = setInterval(() => {
            pomodoro.timeLeft--;
            updatePomodoroDisplay();
            if (pomodoro.timeLeft <= 0) {
                pomodoroSessionComplete();
            }
        }, 1000);
    }

    function pausePomodoro() {
        const { pomodoro } = appState;
        if (!pomodoro.isRunning) return;
        
        clearInterval(pomodoro.timerId);
        pomodoro.isRunning = false;
        logPomodoroTime();

        document.getElementById('pomodoro-start').style.display = 'inline-flex';
        document.getElementById('pomodoro-pause').style.display = 'none';
    }

    function resetPomodoro() {
        pausePomodoro();
        const { pomodoro } = appState;
        pomodoro.session = 'work';
        const times = { pomodoro: 25 * 60, 'long-pomodoro': 50 * 60 };
        pomodoro.timeLeft = times[pomodoro.mode];
        updatePomodoroDisplay();
    }

    function setPomodoroMode(mode) {
        appState.pomodoro.mode = mode;
        resetPomodoro();
    }
    
    function pomodoroSessionComplete() {
        const { pomodoro } = appState;
        clearInterval(pomodoro.timerId);
        pomodoro.isRunning = false;
        logPomodoroTime();
        
        const isWorkSession = pomodoro.session === 'work';
        pomodoro.session = isWorkSession ? 'break' : 'work';
        
        const times = {
            pomodoro: { work: 25 * 60, break: 5 * 60 },
            'long-pomodoro': { work: 50 * 60, break: 10 * 60 }
        };
        
        pomodoro.timeLeft = times[pomodoro.mode][pomodoro.session];
        
        updatePomodoroDisplay();
        document.getElementById('pomodoro-start').style.display = 'inline-flex';
        document.getElementById('pomodoro-pause').style.display = 'none';
        
        if (Notification.permission === "granted") {
            new Notification('Pomodoro Timer', { body: `Time for your ${isWorkSession ? 'break' : 'next work session'}!` });
        }
        alert(`Session complete! Time for a ${isWorkSession ? 'break' : 'work session'}.`);
    }
    
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    function renderJournalPage() {
        const container = document.getElementById('journal-history-container');
        const entries = Object.entries(appState.journalEntries);

        if (entries.length === 0) {
            container.innerHTML = '<p>No journal entries found. Use the journal on the dashboard to add one!</p>';
            return;
        }

        entries.sort((a, b) => new Date(b[0]) - new Date(a[0]));

        container.innerHTML = entries.map(([dateStr, text]) => {
            const date = createDateFromISO(dateStr).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            return `
                <div class="journal-entry">
                    <div class="journal-date">${date}</div>
                    <p>${text.replace(/\n/g, '<br>')}</p>
                </div>
            `;
        }).join('');
    }
    
    // --- ANALYSIS ---
    function renderAnalysis() {
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text');
        const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border');

        const chartOptions = (yLabel) => ({
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true, 
                    ticks: { color: textColor },
                    grid: { color: gridColor },
                    title: { display: true, text: yLabel, color: textColor }
                },
                x: { ticks: { color: textColor }, grid: { color: gridColor } }
            },
            plugins: { legend: { labels: { color: textColor } } }
        });
        
        Object.values(chartInstances).forEach(chart => { if(chart) chart.destroy(); });

        renderWeeklyCharts(chartOptions);
        renderCurrentMonthChartsForDailyTab(chartOptions);
        renderYearlyByMonthAnalysis(chartOptions);
        populateTaskSelector();
        renderTaskSpecificLog();
    }

    function renderWeeklyCharts(chartOptions) {
        const labels = [];
        const productivityData = [];
        const timeData = [];
        const tasksCompletedData = [];
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary');
        const successColor = getComputedStyle(document.documentElement).getPropertyValue('--success');

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            const dateStr = getISODateString(date);
            
            const dayTasks = appState.tasks[dateStr]?.filter(t => t.text) || [];
            const completed = dayTasks.filter(t => t.completed).length;
            const time = dayTasks.reduce((sum, task) => sum + (task.pomodoroTime || 0), 0) / 3600;

            productivityData.push(dayTasks.length > 0 ? (completed / dayTasks.length) * 100 : 0);
            timeData.push(time.toFixed(2));
            tasksCompletedData.push(completed);
        }

        chartInstances.weeklyChart = new Chart(document.getElementById('weeklyChart'), {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Productivity (%)', data: productivityData, backgroundColor: primaryColor, yAxisID: 'y' },
                    { label: 'Hours Studied', data: timeData, backgroundColor: successColor, yAxisID: 'y1' }
                ]
            },
            options: { ...chartOptions(), scales: {
                y: { type: 'linear', position: 'left', min: 0, max: 100, title: { display: true, text: 'Productivity (%)', color: chartOptions().scales.y.ticks.color } },
                y1: { type: 'linear', position: 'right', min: 0, title: { display: true, text: 'Hours', color: chartOptions().scales.y.ticks.color }, grid: { drawOnChartArea: false } },
                x: { ticks: { color: chartOptions().scales.y.ticks.color } }
            }}
        });

        chartInstances.weeklyTasksChart = new Chart(document.getElementById('weeklyTasksChart'), {
            type: 'line',
            data: { labels, datasets: [{ label: 'Tasks Completed', data: tasksCompletedData, borderColor: primaryColor, tension: 0.3, fill: true }] },
            options: chartOptions('Tasks Completed')
        });
    }
    
    function renderCurrentMonthChartsForDailyTab(lineChartOptions) {
        const { currentDate, tasks } = appState;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text');
        
        const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const productivityData = [];
        const categoryTime = { study: 0, work: 0, health: 0, personal: 0, miscellaneous: 0 };
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = getISODateString(new Date(year, month, day));
            const dayTasks = tasks[dateStr]?.filter(t => t.text) || [];
            const completed = dayTasks.filter(t => t.completed).length;
            productivityData.push(dayTasks.length > 0 ? (completed / dayTasks.length) * 100 : 0);
            dayTasks.forEach(t => {
                const category = t.text.toLowerCase() === 'miscellaneous' ? 'miscellaneous' : t.category || 'personal';
                const time = t.pomodoroTime || 0;
                if (categoryTime.hasOwnProperty(category)) {
                    categoryTime[category] += time;
                }
            });
        }
        
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary');
        chartInstances.monthlyLogChart = new Chart(document.getElementById('monthlyLogChart'), {
            type: 'line',
            data: { labels, datasets: [{ label: 'Daily Productivity', data: productivityData, borderColor: primaryColor, tension: 0.3, fill: true }] },
            options: lineChartOptions('Productivity (%)')
        });

        chartInstances.monthlyTimeChart = new Chart(document.getElementById('monthlyTimeChart'), {
            type: 'doughnut',
            data: {
                labels: ['Study', 'Work', 'Health', 'Personal', 'Misc'],
                datasets: [{ 
                    data: Object.values(categoryTime).map(s => s / 60),
                    backgroundColor: ['var(--study)', 'var(--work)', 'var(--health)', 'var(--personal)', 'var(--border)']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: textColor } } }
            }
        });
    }

    function renderYearlyByMonthAnalysis(chartOptions) {
        const year = new Date().getFullYear();
        document.getElementById('monthly-analysis-year').textContent = year;

        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyProductivity = Array(12).fill(0);
        const monthlyHours = Array(12).fill(0);
        const tasksByMonth = Array.from({ length: 12 }, () => []);

        for (const dateStr in appState.tasks) {
            const taskYear = parseInt(dateStr.substring(0, 4));
            if (taskYear === year) {
                const monthIndex = parseInt(dateStr.substring(5, 7)) - 1;
                tasksByMonth[monthIndex].push(...appState.tasks[dateStr]);
            }
        }

        tasksByMonth.forEach((tasks, index) => {
            if (tasks.length > 0) {
                const completed = tasks.filter(t => t.completed).length;
                monthlyProductivity[index] = Math.round((completed / tasks.length) * 100);
                monthlyHours[index] = tasks.reduce((sum, task) => sum + (task.pomodoroTime || 0), 0) / 3600;
            }
        });

        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary');
        const successColor = getComputedStyle(document.documentElement).getPropertyValue('--success');

        chartInstances.yearlyByMonthChart = new Chart(document.getElementById('yearlyByMonthChart'), {
            type: 'bar',
            data: {
                labels: monthLabels,
                datasets: [
                    { label: 'Productivity (%)', data: monthlyProductivity, backgroundColor: primaryColor, yAxisID: 'y' },
                    { label: 'Hours Studied', data: monthlyHours, backgroundColor: successColor, yAxisID: 'y1' }
                ]
            },
            options: { ...chartOptions(), scales: {
                y: { type: 'linear', position: 'left', min: 0, max: 100, title: { display: true, text: 'Avg. Productivity (%)', color: chartOptions().scales.y.ticks.color } },
                y1: { type: 'linear', position: 'right', min: 0, title: { display: true, text: 'Total Hours', color: chartOptions().scales.y.ticks.color }, grid: { drawOnChartArea: false } },
                x: { ticks: { color: chartOptions().scales.y.ticks.color } }
            }}
        });
    }
    
    function populateTaskSelector() {
        const selector = document.getElementById('task-selector');
        const uniqueTaskNames = new Set(Object.values(appState.tasks).flat().map(t => t.text).filter(Boolean));
        
        selector.innerHTML = uniqueTaskNames.size > 0 
            ? `<option value="">-- Select a Task --</option>` + [...uniqueTaskNames].sort().map(name => `<option value="${name}">${name}</option>`).join('')
            : '<option>No tasks found</option>';
    }

    function renderTaskSpecificLog() {
        const selectedTask = document.getElementById('task-selector').value;
        const historyContainer = document.getElementById('taskHistoryTableContainer');
        const timeSpentEl = document.getElementById('task-time-spent');
        const summaryEl = document.getElementById('task-specific-summary');
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text');
        
        if (chartInstances.taskCompletionChart) {
            chartInstances.taskCompletionChart.destroy();
        }
        
        if (!selectedTask) {
            summaryEl.innerHTML = '<p>Select a task to view its analysis.</p>';
            historyContainer.innerHTML = '';
            timeSpentEl.textContent = '...';
            document.getElementById('taskCompletionChart').style.display = 'none';
            return;
        }
        document.getElementById('taskCompletionChart').style.display = 'block';

        let scheduled = 0, completed = 0, totalPomodoroTime = 0;
        let historyHtml = '<table class="modal-table"><thead><tr><th>Date</th><th>Time of Day</th><th>Status</th></tr></thead><tbody>';
        
        const allInstances = Object.entries(appState.tasks)
            .flatMap(([dateStr, dayTasks]) => 
                dayTasks.filter(task => task.text === selectedTask).map(task => ({ ...task, dateStr }))
            )
            .sort((a,b) => b.dateStr.localeCompare(a.dateStr));

        allInstances.forEach(task => {
            scheduled++;
            if (task.completed) completed++;
            totalPomodoroTime += task.pomodoroTime || 0;

            const hour = task.time ? parseInt(task.time.split(':')[0]) : null;
            const timeOfDay = hour === null ? 'Anytime' : (hour < 12 ? 'Morning' : (hour < 17 ? 'Afternoon' : 'Evening'));
            
            historyHtml += `<tr><td>${task.dateStr}</td><td>${timeOfDay}</td><td>${task.completed ? '✅ Completed' : '❌ Skipped'}</td></tr>`;
        });
        historyHtml += '</tbody></table>';
        
        const completionRate = scheduled > 0 ? Math.round((completed/scheduled) * 100) : 0;
        summaryEl.innerHTML = `
            For the task "<strong>${selectedTask}</strong>":<br>
            - You've completed <strong>${completed}</strong> out of <strong>${scheduled}</strong> scheduled sessions.<br>
            - That's a completion rate of <strong>${completionRate}%</strong>.
        `;

        historyContainer.innerHTML = scheduled > 0 ? historyHtml : '<p>No history for this task.</p>';
        
        const totalMinutes = Math.floor(totalPomodoroTime / 60);
        const remainingSeconds = Math.round(totalPomodoroTime % 60);
        timeSpentEl.innerHTML = `${totalMinutes} min ${remainingSeconds} sec <div style="font-size: 0.9rem; opacity: 0.75;">(${(totalPomodoroTime / 3600).toFixed(2)} hours total)</div>`;

        const completedColor = getComputedStyle(document.documentElement).getPropertyValue('--completed').trim();
        const doughnutChartOptions = {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: textColor } } }
        };

        chartInstances.taskCompletionChart = new Chart(document.getElementById('taskCompletionChart'), {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Skipped'],
                datasets: [{
                    data: [completed, scheduled - completed],
                    backgroundColor: [completedColor, '#a9a9a9'],
                    borderWidth: 0
                }]
            },
            options: doughnutChartOptions
        });
    }
    
    // --- STREAKS & ACHIEVEMENTS ---
    function updateDailyStreak(completionDateStr) {
        const { dailyStreak, tasks } = appState;
        const todayTasks = tasks[completionDateStr]?.filter(t => t.text) || [];
        const allDone = todayTasks.length > 0 && todayTasks.every(t => t.completed);

        if (allDone) {
            if (dailyStreak.lastCompletionDate === completionDateStr) return;

            const currentCompletionDate = createDateFromISO(completionDateStr);
            const yesterday = new Date(currentCompletionDate);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = getISODateString(yesterday);

            if (dailyStreak.lastCompletionDate === yesterdayStr) {
                dailyStreak.count++;
            } else {
                dailyStreak.count = 1;
            }
            dailyStreak.lastCompletionDate = completionDateStr;
        }
    }
    
    function checkStreakOnLoad() {
         const { dailyStreak } = appState;
         if(!dailyStreak.lastCompletionDate) return;

         const lastDate = createDateFromISO(dailyStreak.lastCompletionDate);
         const today = new Date(); today.setHours(0,0,0,0);
         const yesterday = new Date(); yesterday.setDate(today.getDate() - 1); yesterday.setHours(0,0,0,0);
         
         if(lastDate.getTime() < yesterday.getTime()) {
              dailyStreak.count = 0;
              dailyStreak.lastCompletionDate = null;
         }
    }
    
    function renderStreaksAndAchievements() {
        const { dailyStreak, tasks, journalEntries, customThemes } = appState;
        const allTasksFlat = Object.values(tasks).flat();
        const totalCompleted = allTasksFlat.filter(t => t.completed).length;
        const totalTime = allTasksFlat.reduce((sum, t) => sum + (t.pomodoroTime || 0), 0) / 3600; // in hours
        const perfectDays = Object.values(tasks).filter(day => day.length > 0 && day.every(t => t.completed)).length;

        const achievements = [
            // --- Getting Started ---
            { id: 'first-task', title: 'First Step', desc: 'Complete your very first task.', icon: '👟', condition: () => totalCompleted > 0 },
            { id: 'first-journal', title: 'Dear Diary', desc: 'Write your first journal entry.', icon: '✍️', condition: () => Object.keys(journalEntries).length > 0 },
            { id: 'first-pomo', title: 'Time Boxer', desc: 'Log your first Pomodoro session.', icon: '🍅', condition: () => totalTime > 0 },
            { id: 'first-theme', title: 'Decorator', desc: 'Create your first custom theme.', icon: '🎨', condition: () => Object.keys(customThemes).length > 0 },
            { id: 'planner', title: 'The Planner', desc: 'Schedule tasks for 7 different days.', icon: '🗺️', condition: () => Object.keys(tasks).length >= 7 },
            
            // --- Task Completion ---
            { id: 'ten-tasks', title: 'Task Rabbit', desc: 'Complete 10 tasks in total.', icon: '🐰', condition: () => totalCompleted >= 10 },
            { id: 'fifty-tasks', title: 'Task Master', desc: 'Complete 50 tasks in total.', icon: '👑', condition: () => totalCompleted >= 50 },
            { id: 'hundred-tasks', title: 'Centurion', desc: 'Complete 100 tasks in total.', icon: '🛡️', condition: () => totalCompleted >= 100 },
            { id: 'five-hundred-tasks', title: 'Task Hero', desc: 'Complete 500 tasks in total.', icon: '🦸', condition: () => totalCompleted >= 500 },
            { id: 'thousand-tasks', title: 'Task Legend', desc: 'Complete 1,000 tasks in total.', icon: '✨', condition: () => totalCompleted >= 1000 },
            
            // --- Streaks & Consistency ---
            { id: 'perfect-day', title: 'Perfect Day', desc: 'Complete all tasks in a single day.', icon: '⭐', condition: () => perfectDays > 0 },
            { id: 'streak-3', title: 'On a Roll', desc: 'Maintain a 3-day perfect day streak.', icon: '🔥', condition: () => dailyStreak.count >= 3 },
            { id: 'streak-7', title: 'Unstoppable', desc: 'Maintain a 7-day perfect day streak.', icon: '🚀', condition: () => dailyStreak.count >= 7 },
            { id: 'streak-14', title: 'Fortnight of Focus', desc: 'Maintain a 14-day perfect day streak.', icon: '💫', condition: () => dailyStreak.count >= 14 },
            { id: 'streak-30', title: 'Habit Hero', desc: 'Maintain a 30-day perfect day streak.', icon: '🏆', condition: () => dailyStreak.count >= 30 },
            { id: 'streak-100', title: 'True Dedication', desc: 'Maintain a 100-day perfect day streak.', icon: '💎', condition: () => dailyStreak.count >= 100 },
            { id: 'journal-week', title: 'Consistent Chronicler', desc: 'Write a journal entry for 7 days in a row.', icon: '📜', condition: () => {
                const journalDates = Object.keys(journalEntries).map(d => new Date(d).setHours(0,0,0,0)).sort();
                if (journalDates.length < 7) return false;
                let consecutive = 0;
                for(let i = 1; i < journalDates.length; i++) {
                    if ((journalDates[i] - journalDates[i-1]) / (1000 * 3600 * 24) === 1) {
                        consecutive++;
                    } else {
                        consecutive = 0;
                    }
                    if (consecutive >= 6) return true;
                }
                return false;
            }},

            // --- Pomodoro Mastery ---
            { id: 'focused-hour', title: 'Hour of Power', desc: 'Log over 1 hour of focused work.', icon: '🧠', condition: () => totalTime >= 1 },
            { id: 'focused-ten', title: 'Deep Work', desc: 'Log over 10 hours of focused work.', icon: '🧘', condition: () => totalTime >= 10 },
            { id: 'focused-fifty', title: 'Flow State', desc: 'Log over 50 hours of focused work.', icon: '🌊', condition: () => totalTime >= 50 },
            { id: 'focused-hundred', title: 'Time Bender', desc: 'Log over 100 hours of focused work.', icon: '⏳', condition: () => totalTime >= 100 },
            { id: 'marathon', title: 'Marathon Session', desc: 'Log over 4 hours of focus time in a single day.', icon: '🏃‍♂️', condition: () => Object.values(tasks).some(day => day.reduce((sum, t) => sum + (t.pomodoroTime || 0), 0) / 3600 >= 4) },

            // --- Advanced & Miscellaneous ---
            { id: 'high-priority', title: 'Priority Punisher', desc: 'Complete 25 high-priority tasks.', icon: '🎯', condition: () => allTasksFlat.filter(t => t.completed && t.priority === 'high').length >= 25 },
            { id: 'perfect-week', title: 'Perfect Week', desc: 'Achieve a 100% completion rate for an entire week.', icon: '🗓️', condition: () => {
                const taskDates = Object.keys(tasks).sort();
                if (taskDates.length < 7) return false;
                for (let i = 0; i <= taskDates.length - 7; i++) {
                    const firstDay = createDateFromISO(taskDates[i]);
                    let weekIsPerfect = true;
                    for (let j = 0; j < 7; j++) {
                        const currentDay = new Date(firstDay);
                        currentDay.setDate(firstDay.getDate() + j);
                        const dayStr = getISODateString(currentDay);
                        const dayTasks = tasks[dayStr];
                        if (!dayTasks || dayTasks.length === 0 || dayTasks.some(t => !t.completed)) {
                            weekIsPerfect = false;
                            break;
                        }
                    }
                    if (weekIsPerfect) return true;
                }
                return false;
            }},
            { id: 'category-master', title: 'Category Specialist', desc: 'Complete 50 tasks in a single category.', icon: '🎓', condition: () => {
                const counts = {};
                allTasksFlat.filter(t => t.completed).forEach(t => { counts[t.category] = (counts[t.category] || 0) + 1; });
                return Object.values(counts).some(c => c >= 50);
            }},
            { id: 'diverse-designer', title: 'Diverse Designer', desc: 'Create 3 or more custom themes.', icon: '🌈', condition: () => Object.keys(customThemes).length >= 3},
            { id: 'early-bird', title: 'Early Bird', desc: 'Complete a task before 8 AM.', icon: '☀️', condition: () => allTasksFlat.some(t => t.completed && t.time && t.time < "08:00") },
            { id: 'night-owl', title: 'Night Owl', desc: 'Complete a task after 10 PM.', icon: '🌙', condition: () => allTasksFlat.some(t => t.completed && t.time && t.time > "22:00") },
            { id: 'full-day', title: 'Busy Bee', desc: 'Complete 10 or more tasks in a single day.', icon: '🐝', condition: () => Object.values(tasks).some(day => day.filter(t => t.completed).length >= 10) }
        ];

        const streaksContainer = document.getElementById('streaks-container');
        streaksContainer.innerHTML = dailyStreak.count > 0 ? `
            <div class="streak-card">
                <div class="streak-fire">🔥</div>
                <div class="streak-label">Perfect Day Streak</div>
                <div class="streak-value">${dailyStreak.count} days</div>
                <div>(Complete all tasks today to extend)</div>
            </div>` : '<p>No active daily streak. Complete all tasks for a day to start one!</p>';

        const earnedContainer = document.getElementById('achievements-earned');
        const lockedContainer = document.getElementById('achievements-locked');
        earnedContainer.innerHTML = '';
        lockedContainer.innerHTML = '';

        let earnedCount = 0;
        achievements.forEach(ach => {
            const unlocked = ach.condition();
            if (unlocked) earnedCount++;
            const cardHtml = `
                <div class="achievement-card ${unlocked ? 'unlocked' : ''}">
                    <div class="icon">${ach.icon}</div>
                    <h4>${ach.title}</h4>
                    <p style="font-size:0.9rem; opacity: 0.8;">${ach.desc}</p>
                </div>`;
            (unlocked ? earnedContainer : lockedContainer).innerHTML += cardHtml;
        });
        if(earnedCount === 0) earnedContainer.innerHTML = `<p>No achievements earned yet. Keep going!</p>`;
    }
    
    // --- OVERALL ANALYSIS ---
    function renderOverallAnalysis() {
        const container = document.getElementById('overall-analysis-container');
        container.innerHTML = '';
        
        const getWeekOfMonth = (date) => {
            const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
            return Math.ceil((date.getDate() + firstDay) / 7);
        }

        const data = {};
        Object.entries(appState.tasks).forEach(([dateStr, dayTasks]) => {
            if (!dayTasks || dayTasks.length === 0) return;
            const date = createDateFromISO(dateStr);
            const year = date.getFullYear();
            const month = date.getMonth();
            const week = getWeekOfMonth(date);
            const day = date.getDate();
            
            if (!data[year]) data[year] = { tasks: [], byMonth: {} };
            if (!data[year].byMonth[month]) data[year].byMonth[month] = { tasks: [], byWeek: {} };
            if (!data[year].byMonth[month].byWeek[week]) data[year].byMonth[month].byWeek[week] = { tasks: [], byDay: {} };

            data[year].tasks.push(...dayTasks);
            data[year].byMonth[month].tasks.push(...dayTasks);
            data[year].byMonth[month].byWeek[week].tasks.push(...dayTasks);
            data[year].byMonth[month].byWeek[week].byDay[day] = dayTasks;
        });

        const sortedYears = Object.keys(data).sort((a,b) => b-a);
        if (sortedYears.length === 0) {
            container.innerHTML = "<p>No data to analyze yet. Start completing tasks!</p>";
            return;
        }

        let finalHtml = '';
        sortedYears.forEach(year => {
            const yearData = data[year];
            const pYear = calculateProductivity(yearData.tasks);
            finalHtml += `<details><summary><span class="summary-title"><i class="fas fa-calendar"></i> Year ${year}</span> <span class="badge badge-score">${pYear}% Productive</span></summary><div class="content">`;
            
            const sortedMonths = Object.keys(yearData.byMonth).sort((a,b) => b-a);
            sortedMonths.forEach(monthIdx => {
                const monthData = yearData.byMonth[monthIdx];
                const monthName = new Date(year, monthIdx, 1).toLocaleString('default', { month: 'long' });
                const pMonth = calculateProductivity(monthData.tasks);
                finalHtml += `<details><summary><span class="summary-title"><i class="fas fa-calendar-alt"></i> ${monthName}</span> <span class="badge badge-score">${pMonth}% Productive</span></summary><div class="content">`;

                const sortedWeeks = Object.keys(monthData.byWeek).sort((a,b) => b-a);
                sortedWeeks.forEach(weekNum => {
                    const weekData = monthData.byWeek[weekNum];
                    const pWeek = calculateProductivity(weekData.tasks);
                    finalHtml += `<details><summary><span class="summary-title"><i class="fas fa-calendar-week"></i> Week ${weekNum}</span> <span class="badge badge-score">${pWeek}% Productive</span></summary><div class="content">
                                 <table class="modal-table"><thead><tr><th>Date</th><th>Tasks</th><th>Completed</th><th>Score</th></tr></thead><tbody>`;

                    const sortedDays = Object.keys(weekData.byDay).sort((a,b) => b-a);
                    sortedDays.forEach(dayNum => {
                        const dayTasks = weekData.byDay[dayNum];
                        const pDay = calculateProductivity(dayTasks);
                        finalHtml += `<tr><td>${dayNum} ${monthName}</td><td>${dayTasks.length}</td><td>${dayTasks.filter(t=>t.completed).length}</td><td>${pDay}%</td></tr>`;
                    });

                    finalHtml += `</tbody></table></div></details>`;
                });
                finalHtml += `</div></details>`;
            });
            finalHtml += `</div></details>`;
        });
        container.innerHTML = finalHtml;
    }

    function calculateProductivity(tasks) {
        if (!tasks || tasks.length === 0) return 0;
        const completed = tasks.filter(t => t.completed).length;
        return Math.round((completed / tasks.length) * 100);
    }
    
    // --- DATA MANAGEMENT & EVENT LISTENERS ---
    function saveAffirmationToJournal() {
        const todayStr = getISODateString(new Date());
        const affirmationText = document.getElementById('daily-affirmation').textContent;
        let currentJournal = appState.journalEntries[todayStr] || '';
        const timeStamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const entry = `\n\n---\nSaved Affirmation (${timeStamp}):\n${affirmationText}`;
        
        appState.journalEntries[todayStr] = currentJournal + entry;
        document.getElementById('journal-textarea').value = appState.journalEntries[todayStr];

        saveData();
        renderJournalPage();
        alert("Affirmation saved to today's journal!");
    }

    function handleClearData() {
        const rangeSelect = document.getElementById('clear-data-range');
        const range = rangeSelect.value;
        const rangeText = rangeSelect.options[rangeSelect.selectedIndex].text;

        let confirmation = confirm(`Are you sure you want to delete ${rangeText}?\nThis action is permanent and cannot be undone.`);
        
        if (range === 'all' && confirmation) {
            const finalConfirmation = prompt('This will delete ALL your data, including tasks, journal entries, and streaks. To confirm, type "DELETE ALL" and click OK.');
            if (finalConfirmation !== "DELETE ALL") {
                alert("Deletion cancelled.");
                return;
            }
        } else if (!confirmation) {
            return;
        }

        const today = new Date();
        switch(range) {
            case 'all':
                appState.tasks = {};
                appState.journalEntries = {};
                appState.dailyStreak = { count: 0, lastCompletionDate: null };
                break;
            case 'this_year':
                const year = today.getFullYear().toString();
                Object.keys(appState.tasks).forEach(key => { if(key.startsWith(year)) delete appState.tasks[key]; });
                Object.keys(appState.journalEntries).forEach(key => { if(key.startsWith(year)) delete appState.journalEntries[key]; });
                break;
            case 'this_month':
                const yearMonth = getISODateString(today).substring(0, 7);
                Object.keys(appState.tasks).forEach(key => { if(key.startsWith(yearMonth)) delete appState.tasks[key]; });
                Object.keys(appState.journalEntries).forEach(key => { if(key.startsWith(yearMonth)) delete appState.journalEntries[key]; });
                break;
            case 'past_7_days':
            case 'past_30_days':
                const days = range === 'past_7_days' ? 7 : 30;
                for(let i=0; i<days; i++) {
                    let date = new Date();
                    date.setDate(today.getDate() - i);
                    let dateStr = getISODateString(date);
                    delete appState.tasks[dateStr];
                    delete appState.journalEntries[dateStr];
                }
                break;
            case 'today':
                let todayStr = getISODateString(today);
                delete appState.tasks[todayStr];
                delete appState.journalEntries[todayStr];
                break;
        }
        
        checkStreakOnLoad();
        saveData();
        renderAll();
        alert(`Successfully cleared ${rangeText}.`);
    }

    function setupEventListeners() {
        document.querySelectorAll('.nav-tabs .tab-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pageId = e.currentTarget.dataset.page;
                document.querySelectorAll('.nav-tabs .tab-btn[data-page]').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                e.currentTarget.classList.add('active');
                document.getElementById(pageId).classList.add('active');
                if (pageId === 'analysis') renderAnalysis();
                if (pageId === 'overall-analysis') renderOverallAnalysis();
            });
        });
        
        document.querySelectorAll('#analysis-nav .tab-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                document.querySelectorAll('#analysis-nav .tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.analysis-section').forEach(s => s.classList.remove('active'));
                e.currentTarget.classList.add('active');
                document.getElementById(`analysis-${e.currentTarget.dataset.analysis}`).classList.add('active');
            });
        });
        
        document.querySelectorAll('#achievements .nav-tabs .tab-btn').forEach(btn => {
             btn.addEventListener('click', e => {
                 document.querySelectorAll('#achievements .nav-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                 e.currentTarget.classList.add('active');
                 document.getElementById('achievements-earned').style.display = e.currentTarget.dataset.achievement === 'earned' ? 'grid' : 'none';
                 document.getElementById('achievements-locked').style.display = e.currentTarget.dataset.achievement === 'locked' ? 'grid' : 'none';
             });
        });

        document.getElementById('prevMonthBtn').addEventListener('click', () => { appState.currentDate.setMonth(appState.currentDate.getMonth() - 1); renderTimetable(); });
        document.getElementById('nextMonthBtn').addEventListener('click', () => { appState.currentDate.setMonth(appState.currentDate.getMonth() + 1); renderTimetable(); });
        document.getElementById('cloneTodayBtn').addEventListener('click', cloneTodayRoutine);
        document.getElementById('uncloneMonthBtn').addEventListener('click', uncloneMonth);

        document.getElementById('closeModalBtn').addEventListener('click', closeTaskModal);
        document.getElementById('addTaskRowBtn').addEventListener('click', () => addTaskRowToModal());
        document.getElementById('saveTasksBtn').addEventListener('click', saveTasksAndCloseModal);
        document.getElementById('modalClonePrevDayBtn').addEventListener('click', clonePreviousDay);

        document.getElementById('modalTableBody').addEventListener('keydown', e => {
            if (e.key === 'Enter' && e.target.classList.contains('task-input')) {
                e.preventDefault();
                addTaskRowToModal();
            }
        });

        document.getElementById('pomodoro-start').addEventListener('click', startPomodoro);
        document.getElementById('pomodoro-pause').addEventListener('click', pausePomodoro);
        document.getElementById('pomodoro-reset').addEventListener('click', resetPomodoro);
        document.querySelectorAll('.pomodoro-settings button').forEach(b => b.addEventListener('click', (e) => setPomodoroMode(e.currentTarget.dataset.mode)));

        document.getElementById('journal-textarea').addEventListener('blur', (e) => {
            const entry = e.target.value.trim();
            const todayStr = getISODateString(new Date());
            if (entry) {
               appState.journalEntries[todayStr] = entry;
            } else {
               delete appState.journalEntries[todayStr];
            }
            saveData();
            renderJournalPage();
            renderStreaksAndAchievements();
        });
        
        document.getElementById('reload-affirmation').addEventListener('click', renderAffirmation);
        document.getElementById('save-affirmation-btn').addEventListener('click', saveAffirmationToJournal);
        document.getElementById('clear-data-btn').addEventListener('click', handleClearData);

        document.getElementById('themeToggle').addEventListener('click', () => {
             const currentThemeKey = document.body.dataset.theme || 'default';
             const allThemes = { ...presetThemes, ...appState.customThemes };
             const isDark = allThemes[currentThemeKey].colors['--background'] < '#888888';
             applyTheme(isDark ? 'default' : 'dark');
             saveData();
        });
        
        document.getElementById('preset-themes-container').addEventListener('click', (e) => {
            const swatch = e.target.closest('.theme-swatch');
            if (!swatch) return;
            
            if (swatch.classList.contains('locked')) {
                alert("Create and save a custom theme to unlock the presets!");
                return;
            }

            if (e.target.closest('.delete-theme-btn')) {
                e.stopPropagation();
                deleteTheme(e.target.closest('.delete-theme-btn').dataset.themeKey);
            } else {
                applyTheme(swatch.dataset.theme);
                saveData();
            }
        });

        document.querySelectorAll('.theme-creator input[type="color"]').forEach(input => {
            input.addEventListener('input', e => {
                document.documentElement.style.setProperty(`--${e.target.id.replace('-color', '')}`, e.target.value);
            });
        });
        document.getElementById('saveThemeBtn').addEventListener('click', saveCustomTheme);
        document.getElementById('task-selector').addEventListener('change', renderTaskSpecificLog);
    }

    // --- INITIALIZATION ---
    loadData();
    checkStreakOnLoad();
    setupEventListeners();
    renderAll();
    updatePomodoroDisplay();
});