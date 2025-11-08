const PREFIX = 'lendlocal/session/';

export function setSessionValue(key, value) {
  sessionStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
}

export function getSessionValue(key, fallback = null) {
  const raw = sessionStorage.getItem(`${PREFIX}${key}`);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

export function clearSessionValue(key) {
  sessionStorage.removeItem(`${PREFIX}${key}`);
}
