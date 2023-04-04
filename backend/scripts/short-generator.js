const alphabet = 'abcdefghijklmnopqrstuvwxyz'
  .split('')
  .filter((o) => !['j', 'y', 'q'].includes(o));
const vowels = ['a', 'e', 'i', 'o', 'u'];
const consonants = alphabet.filter((o) => !vowels.includes(o));

const names = [
  'apeg',
  'bici',
  'cofu',
  'deno',
  'eket',
  'foro',
  'giro',
  'hisi',
  'ipox',
  'kezo',
  'loti',
  'meke',
  'nimi',
  'ofeg',
  'pode',
  'rume',
  'sohi',
  'tuvo',
  'uhoc',
  'vusi',
  'woko',
  'xigi',
  'zene',
  'agom',
  'bimu',
  'cuve',
  'dome',
  'efiz',
  'feku',
  'gevu',
  'hove',
  'igex',
  'kifu',
  'logo',
  'migu',
  'neho',
  'ozin',
  'pite',
  'rize',
  'sutu',
  'tuni',
  'udip',
  'vofo',
  'wupi',
  'xori',
  'zupo',
  'asox',
  'besi',
  'cunu',
  'dile',
  'evuh',
  'fuwi',
  'geco',
  'hifi',
  'iker',
  'kohu',
  'leke',
  'meze',
  'netu',
  'ofod',
  'pede',
  'regi',
  'solo',
  'togo',
  'uzef',
  'vopo',
  'woru',
  'xuho',
  'zosi',
];

const random = (min, max) => {
  return Math.ceil(min + Math.random() * (max - min));
};

const getRandomEntry = (array) => {
  return array[random(0, array.length - 1)];
};

const getRandomName = (start) => {
  const letters = [start];
  if (vowels.includes(start)) {
    letters.push(getRandomEntry(consonants));
    letters.push(getRandomEntry(vowels));
    letters.push(getRandomEntry(consonants));
  } else {
    letters.push(getRandomEntry(vowels));
    letters.push(getRandomEntry(consonants));
    letters.push(getRandomEntry(vowels));
  }
  const name = letters.join('');

  if (names.includes(name)) {
    return getRandomName(start);
  }

  return name;
};

for (start of alphabet) {
  names.push(getRandomName(start));
}

console.log(names);
