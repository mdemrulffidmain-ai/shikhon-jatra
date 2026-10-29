// English book: capital letters, small letters, then useful words.
const L = (ch, label, tip) => ({ ch, label, tip, ws: true });
const W = (label, tip, extra) => Object.assign({ ch: label, label, tip, ws: false }, extra || {});

const upper = [
  ['A to E', [['A', 'apple', 'apple মানে আপেল। আপেল খেলে শরীর ভালো থাকে।'], ['B', 'ball', 'ball মানে বল। বল নিয়ে মাঠে খেলি।'], ['C', 'cat', 'cat মানে বিড়াল।'], ['D', 'dog', 'dog মানে কুকুর।'], ['E', 'egg', 'egg মানে ডিম। ডিমে প্রোটিন আছে।']]],
  ['F to J', [['F', 'fish', 'fish মানে মাছ।'], ['G', 'glass', 'glass এ পানি খাই।'], ['H', 'hand', 'খাওয়ার আগে hand ধুই।'], ['I', 'ice', 'ice মানে বরফ।'], ['J', 'jug', 'jug মানে জগ।']]],
  ['K to O', [['K', 'kite', 'kite মানে ঘুড়ি।'], ['L', 'lamp', 'lamp মানে বাতি।'], ['M', 'milk', 'milk মানে দুধ। দুধ হাড় শক্ত করে।'], ['N', 'nose', 'nose মানে নাক।'], ['O', 'orange', 'orange মানে কমলা।']]],
  ['P to T', [['P', 'pen', 'pen দিয়ে লিখি।'], ['Q', 'queen', 'queen মানে রানি।'], ['R', 'rain', 'rain মানে বৃষ্টি।'], ['S', 'sun', 'sun মানে সূর্য।'], ['T', 'tree', 'tree মানে গাছ। গাছ আমাদের অক্সিজেন দেয়।']]],
  ['U to Z', [['U', 'umbrella', 'umbrella মানে ছাতা।'], ['V', 'van', 'van মানে ভ্যান গাড়ি।'], ['W', 'water', 'water মানে পানি। রোজ পানি পান করি।'], ['X', 'xray', 'xray দিয়ে ডাক্তার হাড় দেখেন।'], ['Y', 'yoyo', 'yoyo একটি খেলনা।'], ['Z', 'zebra', 'zebra মানে জেব্রা।']]]
];

const upperNodes = upper.map(([t, items]) => ({
  t: 'Capital ' + t, type: 'letter', group: 'en-upper',
  items: items.map(([c, l, tip]) => L(c, l, tip))
}));

const lowerNodes = upper.map(([t, items]) => ({
  t: 'small ' + t.toLowerCase(), type: 'letter', group: 'en-lower',
  items: items.map(([c, l, tip]) => L(c.toLowerCase(), l, tip))
}));

const wordNodes = [
  {
    t: 'My body', type: 'word', group: 'en-word',
    items: [
      W('hand', 'hand মানে হাত। খাওয়ার আগে hand ধুই।'),
      W('eye', 'eye মানে চোখ। চোখ দিয়ে দেখি।'),
      W('ear', 'ear মানে কান। কান দিয়ে শুনি।'),
      W('nose', 'nose মানে নাক।'),
      W('mouth', 'mouth মানে মুখ।'),
      W('leg', 'leg মানে পা।')
    ]
  },
  {
    t: 'My family', type: 'word', group: 'en-word',
    items: [
      W('mother', 'mother মানে মা।'),
      W('father', 'father মানে বাবা।'),
      W('brother', 'brother মানে ভাই।'),
      W('sister', 'sister মানে বোন।'),
      W('friend', 'friend মানে বন্ধু। বন্ধুকে সাহায্য করি।')
    ]
  },
  {
    t: 'Colours', type: 'word', group: 'en-word',
    items: [
      W('red', 'red মানে লাল। red বাতিতে থামি।', { swatch: '#e5383b' }),
      W('green', 'green মানে সবুজ। green বাতিতে চলি।', { swatch: '#2a9d4b' }),
      W('yellow', 'yellow মানে হলুদ।', { swatch: '#f6c90e' }),
      W('blue', 'blue মানে নীল।', { swatch: '#2f6fe4' }),
      W('white', 'white মানে সাদা।', { swatch: '#f4f4f4' })
    ]
  },
  {
    t: 'Useful words', type: 'word', group: 'en-word',
    items: [
      W('hello', 'hello বলে সবাইকে সম্ভাষণ করি।'),
      W('please', 'কিছু চাইলে please বলি।'),
      W('thank you', 'কেউ সাহায্য করলে thank you বলি।'),
      W('sorry', 'ভুল করলে sorry বলি।'),
      W('help', 'বিপদে পড়লে help বলে ডাকি।')
    ]
  }
];

export const enNodes = [...upperNodes, ...lowerNodes, ...wordNodes];
