const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

function downloadImage(url, destPath, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    const proto = url.startsWith('https') ? https : http;
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = fs.createWriteStream(destPath);
    proto.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        try { fs.unlinkSync(destPath); } catch (_) {}
        return downloadImage(res.headers.location, destPath, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        file.close();
        try { fs.unlinkSync(destPath); } catch (_) {}
        return reject(new Error(`HTTP error: ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).setTimeout(30000, function() {
      this.destroy();
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
