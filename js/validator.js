const Validator = {
    validateLength(value) {
        const n = parseInt(value);
        if (isNaN(n) || n < 4 || n > 128) {
            Logger.warn('Length out of range', value);
            return Math.max(4, Math.min(128, n || 16));
        }
        return n;
    },

    validateCount(value) {
        const n = parseInt(value);
        if (isNaN(n) || n < 1 || n > 100) {
            Logger.warn('Count out of range', value);
            return 1;
        }
        return n;
    },

    validateChars(str) {
        if (typeof str !== 'string') return '';
        return [...new Set(str.replace(/\s/g, '').split(''))].join('');
    },

    validateCharset(charset, activeSets) {
        if (charset.length === 0) {
            Logger.error('Charset is empty', { charset, activeSets });
            return false;
        }
        return true;
    }
};