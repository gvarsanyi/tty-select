const { select } = require('./bin/select.js');

(async function() {
  console.log('selected:', await select('Need you to say {*^yes} or {^no}'));
})();
