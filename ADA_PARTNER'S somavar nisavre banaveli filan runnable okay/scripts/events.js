import { EVENTS } from './constants.js';

const _listeners = new Map();

export function emit(event, data = {}) {
  const detail = { ...data, timestamp: Date.now() };
  document.dispatchEvent(new CustomEvent(event, { detail }));
}

export function on(event, handler) {
  document.addEventListener(event, handler);
  if (!_listeners.has(event)) _listeners.set(event, new Set());
  _listeners.get(event).add(handler);
}

export function off(event, handler) {
  document.removeEventListener(event, handler);
  _listeners.get(event)?.delete(handler);
}

export function offAll(event) {
  const handlers = _listeners.get(event);
  if (handlers) { handlers.forEach(h => document.removeEventListener(event, h)); handlers.clear(); }
}

export { EVENTS };
