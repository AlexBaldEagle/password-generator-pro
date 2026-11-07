const Logger = {
    levels: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 },
    currentLevel: 0,
    buffer: [],
    maxBuffer: 100,

    log(level, message, data = null) {
        if (this.levels[level] < this.currentLevel) return;

        const entry = {
            level,
            message,
            data,
            time: new Date().toLocaleTimeString('en-US')
        };

        this.buffer.push(entry);
        if (this.buffer.length > this.maxBuffer) this.buffer.shift();

        const consoleMethod = level === 'ERROR' ? 'error' :
            level === 'WARN' ? 'warn' :
                level === 'INFO' ? 'info' : 'log';
        console[consoleMethod](`[${entry.time}] [${level}] ${message}`, data || '');

        this.renderPanel();
    },

    debug(msg, data) { this.log('DEBUG', msg, data); },
    info(msg, data) { this.log('INFO', msg, data); },
    warn(msg, data) { this.log('WARN', msg, data); },
    error(msg, data) { this.log('ERROR', msg, data); },

    renderPanel() {
        const panel = document.getElementById('logPanel');
        if (!panel) return;

        panel.innerHTML = this.buffer.slice(-30).map(e =>
            `<div class="log-line ${e.level}">[${e.time}] [${e.level}] ${e.message}</div>`
        ).join('');
        panel.scrollTop = panel.scrollHeight;
    }
};