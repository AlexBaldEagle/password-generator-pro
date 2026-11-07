const CHARS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
    separators: '-_',
    special: '!@#$%^&*()+=[]{}|;:,./<>?~',
    space: ' ',
    similar: 'oO0lI1sS5|`',
    ambiguous: '{}[]()/\\\'"`~,;:.<>'
};

function getActiveSets() {
    const sets = [];
    try {
        if (document.getElementById('lowercase').checked) sets.push(CHARS.lower);
        if (document.getElementById('uppercase').checked) sets.push(CHARS.upper);
        if (document.getElementById('digits').checked) sets.push(CHARS.digits);
        if (document.getElementById('separators').checked) sets.push(CHARS.separators);
        if (document.getElementById('symbols').checked) sets.push(CHARS.special);
        if (document.getElementById('space').checked) sets.push(CHARS.space);
    } catch (e) {
        Logger.error('Error reading sets', e.message);
    }
    return sets;
}

function buildCharset() {
    let cs = '';
    try {
        cs = getActiveSets().join('');

        const excl = [];
        if (document.getElementById('excludeSimilar').checked) {
            excl.push(...CHARS.similar.split(''));
        }
        if (document.getElementById('excludeAmbiguous').checked) {
            excl.push(...CHARS.ambiguous.split(''));
        }

        const userExclude = Validator.validateChars(document.getElementById('excludeChars').value || '');
        excl.push(...userExclude.split(''));

        cs = [...new Set(cs.split(''))].filter(c => !excl.includes(c)).join('');

        if (cs.length === 0) {
            Logger.warn('Charset empty, fallback to lower+digits');
            cs = CHARS.lower + CHARS.digits;
        }
    } catch (e) {
        Logger.error('Error building charset', e.message);
        cs = CHARS.lower + CHARS.digits;
    }
    return cs;
}

function buildCharsetSize(pw) {
    try {
        let size = 0;
        if (/[A-Z]/.test(pw)) size += 26;
        if (/[a-z]/.test(pw)) size += 26;
        if (/[0-9]/.test(pw)) size += 10;
        if (/[^A-Za-z0-9]/.test(pw)) size += 32;
        return size || 26;
    } catch (e) {
        Logger.error('Error calculating charset size', e.message);
        return 26;
    }
}

function generatePassword(length) {
    try {
        length = Validator.validateLength(length);
        const cs = buildCharset();

        if (!Validator.validateCharset(cs, getActiveSets())) {
            return null;
        }

        const incl = Validator.validateChars(
            document.getElementById('includeChars').value || ''
        ).split('').filter(c => cs.includes(c));

        const res = [];
        const sets = getActiveSets();
        const excludeSimilar = document.getElementById('excludeSimilar').checked;
        const excludeAmbiguous = document.getElementById('excludeAmbiguous').checked;
        const userExclude = Validator.validateChars(
            document.getElementById('excludeChars').value || ''
        ).split('');

        sets.forEach(set => {
            let filtered = set;
            if (excludeSimilar) {
                filtered = filtered.split('').filter(c => !CHARS.similar.includes(c)).join('');
            }
            if (excludeAmbiguous) {
                filtered = filtered.split('').filter(c => !CHARS.ambiguous.includes(c)).join('');
            }
            if (userExclude.length) {
                filtered = filtered.split('').filter(c => !userExclude.includes(c)).join('');
            }
            if (filtered.length > 0) {
                res.push(filtered[cryptoRandom(filtered.length)]);
            }
        });

        incl.forEach(c => res.push(c));

        while (res.length < length) {
            res.push(cs[cryptoRandom(cs.length)]);
        }

        return cryptoShuffle(res.slice(0, length)).join('');
    } catch (e) {
        Logger.error('Error generating password', e.message);
        return null;
    }
}

async function isPasswordPwned(password) {
    if (!Environment.pwned) {
        Logger.debug('Pwned API not available, skipping');
        return { checked: false, pwned: false };
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
        const hashHex = Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
        const prefix = hashHex.slice(0, 5);
        const suffix = hashHex.slice(5);

        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            Logger.warn('Pwned API returned', response.status);
            return { checked: false, pwned: false };
        }

        const result = await response.text();
        const pwned = result.includes(suffix);

        Logger.debug('Pwned check', { pwned });
        return { checked: true, pwned };
    } catch (e) {
        if (e.name === 'AbortError') {
            Logger.warn('Pwned API: timeout');
        } else {
            Logger.warn('Pwned API error', e.message);
        }
        return { checked: false, pwned: false };
    }
}

function hasPatterns(password) {
    try {
        const patterns = [
            '123', '234', '345', '456', '567', '678', '789',
            'abc', 'bcd', 'cde', 'def', 'efg',
            'qwerty', 'asdf', 'zxcv',
            '111', '222', '333', 'aaa', 'bbb', 'ccc'
        ];
        const lower = password.toLowerCase();
        return patterns.filter(p => lower.includes(p));
    } catch (e) {
        Logger.error('Error checking patterns', e.message);
        return [];
    }
}