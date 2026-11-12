const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const url = require('url');

// Set proper user data path in AppData to prevent "Access Denied" on disk cache
app.setPath('userData', path.join(app.getPath('appData'), 'ges-saha-takip'));
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

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
  mainWindow.removeMenu();

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
  } else {
    mainWindow.loadURL('app://-/index.html#/');
  }
}

app.whenReady().then(() => {
  // app:// isteklerini yerel dosya sistemindeki dist klasörüne yönlendir
  protocol.handle('app', async (request) => {
    const requestUrl = new URL(request.url);
    const pathname = decodeURIComponent(requestUrl.pathname);
    const cleanPath = pathname.replace(/^\/-/, '');
    const absolutePath = path.join(__dirname, '../dist', cleanPath === '' ? 'index.html' : cleanPath);
    const fileUrl = url.pathToFileURL(absolutePath).toString();
    
    try {
      const response = await net.fetch(fileUrl);
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (err) {
      console.error('[PROTOCOL ERROR]', request.url, err);
      return new Response('Not Found', { status: 404 });
    }
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
