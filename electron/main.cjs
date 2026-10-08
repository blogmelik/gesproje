const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');

// 'app' şemasını güvenli ve standart olarak kaydedelim
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      bypassCSP: true
    }
  }
]);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'GES İmalat Takip',
    icon: path.join(__dirname, '../public/app-icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.autoHideMenuBar = true;

  // Geliştirme modunda localhost, üretimde app:// protokolü
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
  } else {
    mainWindow.loadURL('app://-/index.html');
  }
}

app.whenReady().then(() => {
  // app:// isteklerini yerel dosya sistemindeki dist klasörüne yönlendir
  protocol.handle('app', (request) => {
    const requestUrl = new URL(request.url);
    const pathname = decodeURIComponent(requestUrl.pathname);
    
    // app://-/index.html -> dist/index.html
    const cleanPath = pathname.replace(/^\/-/, '');
    
    const absolutePath = path.join(__dirname, '../dist', cleanPath === '' ? 'index.html' : cleanPath);
    const fileUrl = 'file://' + absolutePath.replace(/\\/g, '/');
    
    return net.fetch(fileUrl);
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
