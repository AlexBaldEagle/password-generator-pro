function cryptoRandom(max) {
    if (!Environment.crypto) {
        Logger.warn('Fallback to Math.random (insecure!)');
        return Math.floor(Math.random() * max);
    }

    if (max <= 0 || !Number.isInteger(max)) {
        Logger.error('cryptoRandom: invalid max', max);
        throw new Error('Invalid max value');
    }

    try {
        const arr = new Uint32Array(1);
        const limit = Math.floor(0xFFFFFFFF / max) * max;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            crypto.getRandomValues(arr);
            attempts++;
            if (attempts > maxAttempts) {
                Logger.error('cryptoRandom: max attempts exceeded');
                throw new Error('Random generation failed');
            }
        } while (arr[0] > limit);

        return arr[0] % max;
    } catch (e) {
        Logger.error('cryptoRandom error', e.message);
        throw e;
    }
}

function cryptoShuffle(arr) {
    if (!Array.isArray(arr)) {
        Logger.error('cryptoShuffle: not an array', typeof arr);
        return arr;
    }

    for (let i = arr.length - 1; i > 0; i--) {
        const j = cryptoRandom(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}