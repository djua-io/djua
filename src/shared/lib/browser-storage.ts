/**
 * Thin, typed browser persistence adapter for the demo application.
 *
 * Feature code should depend on a feature repository once an API exists;
 * this adapter keeps localStorage out of React components during the interim.
 */
export const browserStorage = {
  get<T>(key: string, fallback: T): T {
    try {
      return JSON.parse(localStorage.getItem(key) || '') as T
    } catch {
      return fallback
    }
  },

  set(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value))
  },
}
