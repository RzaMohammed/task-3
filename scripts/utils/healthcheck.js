// Health check script
const http = require('http');

const checkHealth = (url) => {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', reject);
  });
};

module.exports = checkHealth;
