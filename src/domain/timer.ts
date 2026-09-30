export interface TimerState {
  isRunning: boolean;
  lastStartedTimestamp?: number;
  accumulatedMs: number;
}

export function createInitialTimerState(): TimerState {
  return {
    isRunning: false,
    lastStartedTimestamp: undefined,
    accumulatedMs: 0,
  };
}

export function startTimer(current: TimerState, now: number = Date.now()): TimerState {
  if (current.isRunning) return current;
  return {
    isRunning: true,
    lastStartedTimestamp: now,
    accumulatedMs: current.accumulatedMs,
  };
}

export function pauseTimer(current: TimerState, now: number = Date.now()): TimerState {
  if (!current.isRunning || !current.lastStartedTimestamp) {
    return {
      ...current,
      isRunning: false,
      lastStartedTimestamp: undefined,
    };
  }

  const additionalTime = Math.max(0, now - current.lastStartedTimestamp);
  return {
    isRunning: false,
    lastStartedTimestamp: undefined,
    accumulatedMs: current.accumulatedMs + additionalTime,
  };
}

export function stopTimer(current: TimerState, now: number = Date.now()): TimerState {
  return pauseTimer(current, now);
}

export function calculateActiveDurationMs(current: TimerState, now: number = Date.now()): number {
  if (!current.isRunning || !current.lastStartedTimestamp) {
    return current.accumulatedMs;
  }
  const liveDelta = Math.max(0, now - current.lastStartedTimestamp);
  return current.accumulatedMs + liveDelta;
}

export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}
