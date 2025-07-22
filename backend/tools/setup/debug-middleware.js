// Middleware pour déboguer les requêtes
module.exports = (req, res, next) => {
  console.log('\n=== REQUEST DEBUG ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('User:', req.user);
  console.log('===================\n');
  
  // Log les erreurs de réponse
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400) {
      console.log('\n=== ERROR RESPONSE ===');
      console.log('Status:', res.statusCode);
      console.log('Data:', data);
      console.log('====================\n');
    }
    originalSend.call(this, data);
  };
  
  next();
};