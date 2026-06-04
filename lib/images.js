const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = fs.createWriteStream(destPath);
    proto.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        try { fs.unlinkSync(destPath); } catch (_) {}
        return downloadImage(res.headers.location, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', err => {
      try { fs.unlinkSync(destPath); } catch (_) {}
      reject(err);
    });
  });
}

function imageExtension(url) {
  const match = url.split('?')[0].match(/\.(jpg|jpeg|png|gif|webp|avif)$/i);
  return match ? match[0].toLowerCase() : '.jpg';
}

module.exports = { downloadImage, imageExtension };
