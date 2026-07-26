
require('dotenv').config();

function need(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  return v;
}

module.exports = {
  nocodb: {
    url: need('NOCODB_URL', 'https://app.nocodb.com').replace(/\/+$/, ''),
    token: need('NOCODB_API_TOKEN', 'nc_pat_sXAoZc6ps9aCIVBF69yvHML3rbUx5LZ1YpUrw0tN'),
    baseName: need('NOCODB_BASE_NAME', 'GATE99'),
    baseId: need('NOCODB_BASE_ID', 'pdqt9l8tm9gvz0j').trim(),
  },
  server: {
    port: Number(need('PORT', 3000)),
  },
  email: {
    user: need('EMAIL_USER', 'info.jagdeesh07@gmail.com'),
    pass: need('EMAIL_PASS', 'lwnkgqfjozcitufa'),
    fromName: need('EMAIL_FROM_NAME', 'GATE99'),
  },
  uploads: {
    dir: need('UPLOAD_DIR', './uploads'),
    publicBaseUrl: need('PUBLIC_UPLOAD_BASE_URL', 'http://localhost:3000/uploads'),
  },
};
