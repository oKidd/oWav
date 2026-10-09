/// <reference types="vite/client" />
export {};
declare global {
  interface Window {
    electron: {
      window: { minimize(): Promise<void>; close(): Promise<void>; release(): Promise<void> };
      youtube: { getInfo(url:string): Promise<VideoInfo>; download(a:{url:string;outputPath:string}): Promise<void>; cancel(): Promise<void>; onProgress(cb:(p:{percent:number;status:string})=>void):()=>void };
      file: { choosePath(name:string):Promise<string|null>; showInFolder(path:string):Promise<void> };
    };
  }
  interface VideoInfo { title:string; channel:string; duration:string; thumbnail:string; }
}
