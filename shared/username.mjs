export function normalizeUsername(value) {
 if (typeof value !== 'string') throw new Error('Enter a username.');
 const username = value.trim().toLowerCase();
 if (!/^[a-z][a-z0-9_]{2,23}$/.test(username)) throw new Error('Username must be 3–24 characters, start with a letter, and use letters, numbers, or underscores.');
 if (['admin','administrator','root','support','darkslide','the_dark_slide','firebase','system'].includes(username)) throw new Error('This username is reserved.');
 return username;
}
