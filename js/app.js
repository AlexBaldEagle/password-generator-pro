async function generate() {
    const btn = document.getElementById('generateBtn');

    try {
        Logger.info('=== Generation started ===');

        const length = Validator.validateLength(document.getElementById('length').value);
        const count = Validator.validateCount(document.getElementById('count').value);
        const cs = buildCharset();

        if (cs.length === 0) {
            showToast('Select at least one character set!', 'error');
            Logger.error('Charset is empty');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span>Generating...';

        const passwords = [];

        for (let i = 0; i < count; i++) {
            let password;
            let attempts = 0;
            const maxAttempts = 10;
            let pwnedResult = { checked: false, pwned: false };
            let patterns = [];

            do {
                password = generatePassword(length);
                if (!password) break;

                if (count === 1) {
                    pwnedResult = await isPasswordPwned(password);
                }

                patterns = hasPatterns(password);
                attempts++;

                if (patterns.length > 0) continue;

            } while (pwnedResult.pwned && attempts < maxAttempts);

            if (password) {
                passwords.push({
                    value: password,
                    pwned: pwnedResult.pwned,
                    checked: pwnedResult.checked,
                    patterns
                });
            }
        }

        btn.disabled = false;
        btn.textContent = 'Generate';

        if (passwords.length === 0) {
            showToast('Failed to generate password', 'error');
            Logger.error('Generation failed');
            return;
        }

        Logger.info('Generated', { count: passwords.length });

        if (count === 1) {
            const p = passwords[0];
            const output = document.getElementById('output');
            output.textContent = p.value;
            output.classList.remove('empty');

            const pwnedEl = document.getElementById('pwnedCheck');
            if (!p.checked) {
                pwnedEl.textContent = '— (API unavailable)';
                pwnedEl.style.color = '#B0B0B0';
            } else {
                pwnedEl.textContent = p.pwned ? '⚠️ Found in leaks' : '✅ Clean';
                pwnedEl.style.color = p.pwned ? '#D32F2F' : '#4CAF50';
            }

            const warningBox = document.getElementById('warningBox');
            if (p.patterns.length > 0) {
                warningBox.textContent = `⚠️ Patterns detected: ${p.patterns.join(', ')}. Regenerate recommended.`;
                warningBox.classList.add('show');
                warningBox.classList.remove('error');
            } else {
                warningBox.classList.remove('show');
            }

            updateStats(p.value, length);
            document.getElementById('listSection').style.display = 'none';
        } else {
            document.getElementById('output').textContent = `Generated: ${passwords.length}`;
            document.getElementById('output').classList.remove('empty');
            document.getElementById('pwnedCheck').textContent = '— (batch mode)';
            document.getElementById('pwnedCheck').style.color = '#B0B0B0';
            document.getElementById('warningBox').classList.remove('show');

            renderList(passwords);
            updateStats(passwords[0].value, length);
        }

    } catch (e) {
        Logger.error('Critical generation error', e.message);
        showToast('Generation error. Check log.', 'error');

        const warningBox = document.getElementById('warningBox');
        warningBox.textContent = `❌ Error: ${e.message}`;
        warningBox.classList.add('show', 'error');

        btn.disabled = false;
        btn.textContent = 'Generate';
    }
}

function renderList(passwords) {
    try {
        const list = document.getElementById('outputList');
        const section = document.getElementById('listSection');
        const badge = document.getElementById('listCount');

        list.innerHTML = '';
        section.style.display = 'block';
        badge.textContent = passwords.length;

        passwords.forEach((p, i) => {
            const el = document.createElement('div');
            el.className = 'pwd-item';
            el.textContent = p.value;
            el.title = 'Click to copy';
            el.style.animation = `fadeIn 0.3s ${i * 20}ms both`;
            el.addEventListener('click', () => {
                copyToClipboard(p.value, el);
            });
            list.appendChild(el);
        });
    } catch (e) {
        Logger.error('Error rendering list', e.message);
    }
}

async function copyToClipboard(text, element = null) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            Logger.debug('Clipboard: fallback used');
        }

        if (element) {
            const orig = element.textContent;
            element.classList.add('copied');
            element.textContent = '✅ Copied';
            setTimeout(() => {
                element.classList.remove('copied');
                element.textContent = orig;
            }, 1000);
        } else {
            showToast('Copied!');
        }

        Logger.info('Copied to clipboard');
        return true;
    } catch (e) {
        Logger.error('Copy error', e.message);
        showToast('Failed to copy', 'error');
        return false;
    }
}

function copyPassword() {
    const output = document.getElementById('output');
    if (output.classList.contains('empty')) return;
    copyToClipboard(output.textContent);
}

function copyAll() {
    try {
        const items = document.querySelectorAll('.pwd-item');
        if (items.length === 0) {
            showToast('Nothing to copy', 'warn');
            return;
        }
        const text = Array.from(items).map(el => el.textContent.replace('✅ Copied', '').trim()).join('\n');
        copyToClipboard(text);
        showToast(`Copied ${items.length} passwords!`);
    } catch (e) {
        Logger.error('Copy all error', e.message);
        showToast('Copy error', 'error');
    }
}

function updateLength() {
    const length = document.getElementById('length').value;
    document.getElementById('lengthValue').textContent = length;

    const output = document.getElementById('output');
    if (!output.classList.contains('empty') && document.getElementById('listSection').style.display !== 'block') {
        updateStats(output.textContent, parseInt(length));
    }
}

function updateCount() {
    const count = document.getElementById('count').value;
    document.getElementById('countValue').textContent = count;
}

function updateStats(password, length) {
    try {
        const charsetSize = buildCharsetSize(password);
        const entropy = length * Math.log2(charsetSize);
        const combinations = Math.pow(charsetSize, length);
        const attemptsPerSecond = 1e10;
        const seconds = combinations / attemptsPerSecond / 2;
        const crackTime = formatTime(seconds);

        document.getElementById('entropy').textContent = entropy.toFixed(1) + ' bits';
        document.getElementById('combinations').textContent = formatBigNumber(combinations);
        document.getElementById('crackTime').textContent = crackTime;

        updateStrength(entropy);
    } catch (e) {
        Logger.error('Stats calculation error', e.message);
    }
}

function updateStrength(entropy) {
    const fill = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');

    fill.className = 'strength-fill';

    if (entropy < 40) {
        fill.classList.add('strength-weak');
        label.textContent = '🔴 Weak';
        label.style.color = '#D32F2F';
    } else if (entropy < 60) {
        fill.classList.add('strength-medium');
        label.textContent = '🟡 Medium';
        label.style.color = '#E9A23B';
    } else if (entropy < 80) {
        fill.classList.add('strength-strong');
        label.textContent = '🟢 Strong';
        label.style.color = '#4CAF50';
    } else {
        fill.classList.add('strength-very-strong');
        label.textContent = '🟢 Very Strong';
        label.style.color = '#2E7D32';
    }
}

function formatBigNumber(num) {
    if (num < 1e3) return num.toFixed(0);
    if (num < 1e6) return (num / 1e3).toFixed(1) + 'K';
    if (num < 1e9) return (num / 1e6).toFixed(1) + 'M';
    if (num < 1e12) return (num / 1e9).toFixed(1) + 'B';
    if (num < 1e15) return (num / 1e12).toFixed(1) + 'T';
    if (num < 1e18) return (num / 1e15).toFixed(1) + 'Q';
    return num.toExponential(2);
}

function formatTime(seconds) {
    if (seconds < 1) return 'Instantly';
    if (seconds < 60) return seconds.toFixed(0) + ' sec';
    if (seconds < 3600) return (seconds / 60).toFixed(0) + ' min';
    if (seconds < 86400) return (seconds / 3600).toFixed(0) + ' h';
    if (seconds < 31536000) return (seconds / 86400).toFixed(0) + ' days';
    if (seconds < 31536000 * 1000) return (seconds / 31536000).toFixed(0) + ' years';
    if (seconds < 31536000 * 1e6) return (seconds / 31536000 / 1000).toFixed(0) + 'K years';
    if (seconds < 31536000 * 1e9) return (seconds / 31536000 / 1e6).toFixed(0) + 'M years';
    return (seconds / 31536000 / 1e9).toFixed(0) + 'B years';
}

let toastTimeout = null;

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show' + (type === 'error' ? ' error' : type === 'warn' ? ' warn' : '');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

function toggleLog() {
    const panel = document.getElementById('logPanel');
    panel.classList.toggle('show');
}

window.addEventListener('DOMContentLoaded', async () => {
    Logger.info('=== Initialization ===');

    await Environment.check();

    try {
        await generate();
    } catch (e) {
        Logger.error('Initial generation error', e.message);
    }

    Logger.info('=== Initialization complete ===');
});

window.addEventListener('error', (e) => {
    Logger.error('Global error', e.message);
});

window.addEventListener('unhandledrejection', (e) => {
    Logger.error('Unhandled Promise', e.reason);
});

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);