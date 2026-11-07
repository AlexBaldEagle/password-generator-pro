const Environment = {
    crypto: false,
    pwned: false,
    clipboard: false,

    async check() {
        try {
            if (window.crypto && window.crypto.getRandomValues) {
                const arr = new Uint32Array(1);
                window.crypto.getRandomValues(arr);
                this.crypto = true;
                Logger.info('Crypto API available');
            } else {
                Logger.error('Crypto API not available');
            }
        } catch (e) {
            Logger.error('Crypto API error', e.message);
        }

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                this.clipboard = true;
                Logger.info('Clipboard API available');
            } else {
                Logger.warn('Clipboard API not available — using fallback');
            }
        } catch (e) {
            Logger.warn('Clipboard API error', e.message);
        }

        await this.checkPwned();
        this.updateUI();
    },

    async checkPwned() {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);

            const response = await fetch('https://api.pwnedpasswords.com/range/00000', {
                signal: controller.signal
            });
            clearTimeout(timeout);

            if (response.ok) {
                this.pwned = true;
                Logger.info('Pwned API available');
            } else {
                Logger.warn('Pwned API returned', response.status);
            }
        } catch (e) {
            Logger.warn('Pwned API not available', e.message);
        }
    },

    updateUI() {
        this.setDot('statusCrypto', this.crypto);
        this.setDot('statusPwned', this.pwned);
        this.setDot('statusClipboard', this.clipboard);
    },

    setDot(id, ok) {
        const el = document.getElementById(id);
        if (!el) return;
        el.className = 'status-dot ' + (ok ? 'ok' : 'fail');
    }
};