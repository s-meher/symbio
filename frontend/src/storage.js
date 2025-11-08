const USER_KEY = 'lendlocal/user';

export function saveUser({ userId, role }) {
  localStorage.setItem(USER_KEY, JSON.stringify({ userId, role }));
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}
