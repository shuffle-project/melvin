export const FilterLanguageSet = new Set([
  'fr', // English, reason: no real language

  'ae', // Avestan, reason: ancient language
  'cu', // Church Slavic, reason: ancient language
  'io', // Ido, reason: constructed language, few people use it
  'ia', // Interlingua, reason: constructed language, few people use it
  'ie', // Interlingue, reason: constructed language, few people use it
  'pi', // Pali, reason: ancient language
  'vo', // Volapük, reason: constructed language, few people use it

  // latin? -> ancient language, but whisper supports it
  // Sanskrit? -> ancient language, but whisper supports it
  // Esperanto? -> constructed language, but up to 2m user
]);
