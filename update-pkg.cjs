const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.main = 'electron/main.cjs';
pkg.build = {
  appId: 'com.ozguninsaat.saha',
  productName: 'Saha Takip',
  directories: {
    output: 'dist-electron'
  },
  files: ['dist/**/*', 'electron/**/*'],
  win: {
    target: 'nsis',
    icon: 'public/favicon.png'
  }
};

pkg.scripts['build:electron'] = 'npm run build && electron-builder --win';
pkg.scripts['dev:electron'] = 'cross-env NODE_ENV=development concurrently "npm run dev" "wait-on http://localhost:8080 && electron ."';

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
