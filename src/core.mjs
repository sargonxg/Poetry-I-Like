export const THEMES = ['liberty', 'pluralism', 'conscience', 'love', 'memory', 'nature', 'wonder'];
export const LANGUAGES = { en: 'English', it: 'Italian', pl: 'Polish', fr: 'French' };
export function fullTexts(collection) {
  return collection.filter(item => item.kind === 'poem' && item.rights?.mode === 'public-domain' && item.lines?.some(line => line.trim()));
}
export function filterCollection(collection, {query = '', theme = '', language = '', savedOnly = false, saved = []} = {}) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean).slice(0, 12);
  return collection.filter(item => (!theme || item.themes.includes(theme)) && (!language || item.language === language) && (!savedOnly || saved.includes(item.id)) && words.every(word => (item.title + ' ' + item.poet + ' ' + item.note).toLocaleLowerCase().includes(word)));
}
export function nextRandom(collection, currentId, random = Math.random) {
  const candidates = collection.filter(item => item.id !== currentId);
  if (!candidates.length) return collection[0] || null;
  return candidates[Math.min(candidates.length - 1, Math.max(0, Math.floor(random() * candidates.length)))];
}
export function safeSource(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function readingMinutes(lines) { return Math.max(1, Math.ceil(lines.join(' ').trim().split(/\s+/).length / 170)); }
export function normalizeSaved(value, collection) {
  if (!Array.isArray(value)) return [];
  const ids = new Set(collection.map(item => item.id));
  return [...new Set(value.filter(id => typeof id === 'string' && ids.has(id)))].slice(0, 250);
}
