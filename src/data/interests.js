// শিশুর আগ্রহের তালিকা। পাঠ, সুপারিশ আর AI পাঠ এই নামগুলো দিয়ে মেলানো হয়।
export const INTERESTS = [
  { id: 'animals', n: 'পশু-পাখি', icon: 'fish' },
  { id: 'space', n: 'মহাকাশ', icon: 'moon' },
  { id: 'nature', n: 'প্রকৃতি', icon: 'tree' },
  { id: 'sports', n: 'খেলাধুলা', icon: 'star' },
  { id: 'machines', n: 'যন্ত্র ও গাড়ি', icon: 'clock' },
  { id: 'food', n: 'খাবার ও রান্না', icon: 'apple' },
  { id: 'money', n: 'টাকা ও ব্যবসা', icon: 'coin' },
  { id: 'health', n: 'শরীর ও স্বাস্থ্য', icon: 'heart' },
  { id: 'tech', n: 'কম্পিউটার', icon: 'chart' },
  { id: 'language', n: 'গল্প ও ভাষা', icon: 'book' },
  { id: 'puzzle', n: 'ধাঁধা ও হিসাব', icon: 'sparkle' }
];
export const INTEREST_NAME = Object.fromEntries(INTERESTS.map((i) => [i.id, i.n]));
