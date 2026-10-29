// ছোট সহায়ক ফাংশন
export const BD = '০১২৩৪৫৬৭৮৯';
export const bd = (n) => String(n).replace(/\d/g, (d) => BD[+d]);
export const NUMW = ['শূন্য', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ'];

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const rnd = (n) => Math.floor(Math.random() * n);

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const sample = (arr, k) => shuffle(arr).slice(0, k);

// কথা মেলানোর জন্য: ছোট হাতের অক্ষর, ফাঁকা ও চিহ্ন বাদ
export function norm(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFC')
    .replace(/[‌‍]/g, '')
    .replace(/[\s.,!?;:।'"()\-]/g, '');
}

export function localDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDate(d);
}
