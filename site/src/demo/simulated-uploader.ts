import type { Uploader } from '@sehv-oss/basketball-upload';

export interface SimulatedUploaderOptions {
  /** How long an upload takes, ms. */
  duration?: number;
  /** Asked once per upload: whether this one should fail halfway. */
  shouldFail?: () => boolean;
}

/**
 * Pretends to upload: reports progress for `duration` ms, honoring the abort
 * signal, then resolves (or rejects, when `shouldFail` says so). Nothing
 * leaves the browser.
 */
export function createSimulatedUploader({
  duration = 6000,
  shouldFail = () => false,
}: SimulatedUploaderOptions = {}): Uploader {
  return (file, { signal, onProgress }) =>
    new Promise((resolve, reject) => {
      const started = performance.now();
      const failAt = shouldFail() ? 0.4 + Math.random() * 0.35 : Infinity;

      const timer = setInterval(() => {
        const elapsed = Math.min(1, (performance.now() - started) / duration);
        // Fast start, slow finish, like most uploads look.
        const progress = 1 - (1 - elapsed) ** 1.7;
        if (progress >= failAt) {
          clearInterval(timer);
          reject(new Error('Simulated network error'));
          return;
        }
        onProgress(progress * file.size, file.size);
        if (elapsed >= 1) {
          clearInterval(timer);
          resolve({ name: file.name, size: file.size });
        }
      }, 60);

      signal.addEventListener(
        'abort',
        () => {
          clearInterval(timer);
          reject(signal.reason);
        },
        { once: true }
      );
    });
}
