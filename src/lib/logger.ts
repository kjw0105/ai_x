/**
 * Conditional logger utility
 * Logs only in development mode to reduce production noise
 * Works in both server and client environments
 */

const isDev = typeof process !== 'undefined'
  ? process.env.NODE_ENV === "development"
  : true; // Default to true in client-side if process is unavailable

export const logger = {
  /**
   * Development-only log
   * Silenced in production
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Development-only info
   * Silenced in production
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Development-only debug
   * Silenced in production
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Always logs warnings (dev and production)
   * Use for important warnings that need tracking
   */
  warn: console.warn,

  /**
   * Always logs errors (dev and production)
   * Use for error tracking and monitoring
   */
  error: console.error,
};
