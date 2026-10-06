import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electron', {
  youtube: { getInfo: (url: string) => ipcRenderer.invoke('youtube:get-info', url), download: (args: {url:string; outputPath:string}) => ipcRenderer.invoke('youtube:download', args), cancel: () => ipcRenderer.invoke('youtube:cancel'), onProgress: (cb: (p: Progress) => void) => { const fn = (_: unknown, p: Progress) => cb(p); ipcRenderer.on('download:progress', fn); return () => ipcRenderer.removeListener('download:progress', fn); } },
  file: { choosePath: (name: string) => ipcRenderer.invoke('file:choose-path', name), showInFolder: (path: string) => ipcRenderer.invoke('file:show-in-folder', path) }
});
type Progress = { percent: number; status: string };
