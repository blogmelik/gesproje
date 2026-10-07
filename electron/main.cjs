const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Özgün İnşaat Saha Takip',
    icon: path.join(__dirname, '../public/icon-256.png'), // Will update later if needed
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the local URL in development, or the local html file in production
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080'); // VITE DEFAULT
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
