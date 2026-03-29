let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    return audioCtx;
}

function coinHit(
    ctx: AudioContext,
    freq: number,
    start: number,
    dur: number,
    vol: number
) {
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = "triangle";
    osc1.frequency.value = freq;
    osc1.connect(g1);
    g1.connect(ctx.destination);
    g1.gain.setValueAtTime(vol, start);
    g1.gain.setValueAtTime(vol * 0.6, start + 0.008);
    g1.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc1.start(start);
    osc1.stop(start + dur);

    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = freq * 2.76;
    osc2.connect(g2);
    g2.connect(ctx.destination);
    g2.gain.setValueAtTime(vol * 0.35, start);
    g2.gain.exponentialRampToValueAtTime(0.001, start + dur * 0.6);
    osc2.start(start);
    osc2.stop(start + dur);

    const osc3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.value = freq * 5.38;
    osc3.connect(g3);
    g3.connect(ctx.destination);
    g3.gain.setValueAtTime(vol * 0.15, start);
    g3.gain.exponentialRampToValueAtTime(0.001, start + dur * 0.35);
    osc3.start(start);
    osc3.stop(start + dur);
}

export function playOrderFilledSound() {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;
        coinHit(ctx, 2400, t, 0.35, 0.35);
        coinHit(ctx, 3200, t + 0.04, 0.3, 0.3);
        coinHit(ctx, 2800, t + 0.09, 0.4, 0.25);
    } catch {}
}

export function playPositionClosedSound() {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;
        coinHit(ctx, 2600, t, 0.3, 0.35);
        coinHit(ctx, 3400, t + 0.04, 0.25, 0.3);
        coinHit(ctx, 2200, t + 0.09, 0.35, 0.28);
        coinHit(ctx, 3800, t + 0.15, 0.3, 0.22);
        coinHit(ctx, 3000, t + 0.22, 0.4, 0.18);
    } catch {}
}

export function playLiquidationSound() {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;
        coinHit(ctx, 800, t, 0.5, 0.4);
        coinHit(ctx, 600, t + 0.12, 0.5, 0.35);
        coinHit(ctx, 450, t + 0.28, 0.7, 0.3);
    } catch {}
}
