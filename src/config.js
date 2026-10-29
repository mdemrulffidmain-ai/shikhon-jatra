// সার্ভারের ঠিকানা। বিল্ডের সময় VITE_SERVER দিয়ে বসানো যায়, নাহলে ব্যবহারকারী অ্যাপের ভেতরে লেখেন।
// সার্ভার চালাতে: node server/server.mjs (README দেখো)। প্রকৃত ব্যবহারে অবশ্যই https ঠিকানা দাও।
export const DEFAULT_SERVER = (import.meta.env && import.meta.env.VITE_SERVER) || '';
