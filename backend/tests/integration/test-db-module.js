const db = require('./config/database-mysql');

console.log('DB module exports:', Object.keys(db));
console.log('pool:', typeof db.pool);
console.log('execute:', typeof db.execute);
console.log('query:', typeof db.query);

// Test execute
db.execute('SELECT 1 as test')
  .then(([results]) => {
    console.log('Execute test success:', results);
  })
  .catch(err => {
    console.error('Execute test error:', err);
  });