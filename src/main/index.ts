import type { BrowserWindow as BrowserWindowType } from 'electron';
import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const { app, BrowserWindow, dialog, ipcMain, shell, Menu } = require('electron');

let win: BrowserWindowType; let active: ChildProcess | undefined;
const bin = (name: string) => { const local = path.join(process.resourcesPath, 'bin', process.platform === 'win32' ? `${name}.exe` : name); return fs.existsSync(local) ? local : name; };
const valid = (url: string) => { try { const u = new URL(url); return ['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtu.be'].includes(u.hostname) && (u.hostname.includes('youtu.be') ? u.pathname.length > 1 : ['watch','shorts','embed'].some(x => u.pathname.includes(x))); } catch { return false; } };
const run = (args: string[], onLine?: (s:string)=>void) => new Promise<string>((resolve,reject) => { const p=spawn(bin('yt-dlp'),args,{windowsHide:true}); active=p; let out=''; p.stdout.on('data',d=>{out+=d;onLine?.(d.toString())}); p.stderr.on('data',d=>onLine?.(d.toString())); p.on('error',reject); p.on('close',c=>{active=undefined;c===0?resolve(out):reject(new Error('yt-dlp failed'))}); });
function createWindow(){
  Menu.setApplicationMenu(null);
  const appRoot = path.join(__dirname, '../..');
  win=new BrowserWindow({title:'oWav',width:520,height:650,resizable:false,frame:false,show:false,webPreferences:{preload:path.join(appRoot,'dist-electron/preload/index.cjs'),contextIsolation:true,nodeIntegration:false}});
  ipcMain.handle('window:minimize',()=>win.minimize());
  ipcMain.handle('window:close',()=>win.close());
  ipcMain.handle('window:release',()=>shell.openExternal('https://github.com/oKidd/oWav/releases'));
  win.once('ready-to-show',()=>win.show());
  win.webContents.on('did-fail-load',(_,code,description)=>console.error('Renderer load failed:',code,description));
  if(process.env.OWAV_DEV) win.loadURL('http://127.0.0.1:5173');
  else win.loadFile(path.join(appRoot,'dist/index.html')).catch(error=>console.error('Renderer load failed:',error));
}
app.whenReady().then(()=>{createWindow(); ipcMain.handle('youtube:get-info',async(_: unknown,url:string)=>{if(!valid(url)) throw new Error('Enlace de YouTube no válido.'); const raw=await run(['--dump-single-json','--no-playlist','--skip-download',url]); const x=JSON.parse(raw); return {title:x.title,channel:x.uploader||x.channel,duration:new Date((x.duration||0)*1000).toISOString().slice(14,19),thumbnail:x.thumbnail};}); ipcMain.handle('file:choose-path',async(_: unknown,name:string)=>{const r=await dialog.showSaveDialog(win,{defaultPath:name,filters:[{name:'WAV audio',extensions:['wav']}]});return r.canceled?null:r.filePath}); ipcMain.handle('youtube:download',async(_: unknown,a:{url:string;outputPath:string})=>{if(!valid(a.url)) throw new Error('Enlace de YouTube no válido.'); const send=(percent:number,status:string)=>win.webContents.send('download:progress',{percent,status}); send(2,'Preparando'); await new Promise<void>((resolve,reject)=>{const p=spawn(bin('yt-dlp'),['-x','--audio-format','wav','--audio-quality','0','--no-playlist','--newline','-o',a.outputPath,a.url],{windowsHide:true});active=p; p.stderr.on('data',d=>{const m=d.toString().match(/(\d+(?:\.\d+)?)%/);if(m)send(Math.min(95,Number(m[1])),'Descargando')});p.on('error',reject);p.on('close',c=>c===0?resolve():reject(new Error('No se pudo descargar o convertir el audio')))}); send(100,'Completado');}); ipcMain.handle('youtube:cancel',()=>{active?.kill();active=undefined}); ipcMain.handle('file:show-in-folder',(_: unknown,p:string)=>shell.showItemInFolder(p));});
