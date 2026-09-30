import { describe, it, expect } from 'vitest';
import {
  createInitialTimerState,
  startTimer,
  pauseTimer,
  stopTimer,
  calculateActiveDurationMs,
  formatDurationMs,
} from '../domain/timer';

describe('Timer Engine', () => {
  it('initializes in stopped state with 0ms', () => {
    const timer = createInitialTimerState();
    expect(timer.isRunning).toBe(false);
    expect(timer.accumulatedMs).toBe(0);
    expect(calculateActiveDurationMs(timer)).toBe(0);
  });

  it('correctly tracks active duration and excludes paused time', () => {
    const t0 = 1000000;
    // 1. Start timer at t0
    let timer = startTimer(createInitialTimerState(), t0);
    expect(timer.isRunning).toBe(true);

    // 2. 5 seconds later (active)
    const t1 = t0 + 5000;
    expect(calculateActiveDurationMs(timer, t1)).toBe(5000);

    // 3. Pause at t1
    timer = pauseTimer(timer, t1);
    expect(timer.isRunning).toBe(false);
    expect(timer.accumulatedMs).toBe(5000);

    // 4. 20 seconds pass while paused (should not increment)
    const t2 = t1 + 20000;
    expect(calculateActiveDurationMs(timer, t2)).toBe(5000);

    // 5. Resume at t2
    timer = startTimer(timer, t2);
    expect(timer.isRunning).toBe(true);

    // 6. 3 seconds later
    const t3 = t2 + 3000;
    expect(calculateActiveDurationMs(timer, t3)).toBe(8000);

    // 7. Stop/finalize
    timer = stopTimer(timer, t3);
    expect(timer.isRunning).toBe(false);
    expect(timer.accumulatedMs).toBe(8000);
  });

  it('formats durations correctly for mm:ss and hh:mm:ss', () => {
    expect(formatDurationMs(0)).toBe('00:00');
    expect(formatDurationMs(45000)).toBe('00:45');
    expect(formatDurationMs(125000)).toBe('02:05');
    expect(formatDurationMs(3665000)).toBe('1:01:05');
  });
});
