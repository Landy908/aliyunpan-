import { app } from 'electron'
import path from 'path'
import { copyFileSync, existsSync, rmSync, writeFileSync } from 'fs'

const DEBUGGING = !app.isPackaged

let NewCopyed = false
let NewSaved = false

export function getAsarPath(fileName: string) {
  if (DEBUGGING) {
    const basePath = path.resolve(app.getAppPath())
    return path.join(basePath, fileName)
  } else {
    const basePath = path.resolve(app.getAppPath())
    const baseNew = path.join(basePath, '..', 'app.new')
    const baseSave = path.join(basePath, '..', 'app.asar')
    if (NewCopyed == false) {
      // 热更新asar
      if (existsSync(baseNew)) {
        try {
          console.log('copyFileSync', baseNew, '-->', baseSave)
          copyFileSync(baseNew, baseSave)
          rmSync(baseNew, { force: true })
          NewCopyed = true
        } catch (err: any) {
          console.log(err)
        }
      }
    }
    if (NewSaved == false) NewSaved = existsSync(baseSave)
    if (NewSaved) return path.join(baseSave, fileName)
    return path.join(basePath, fileName)
  }
}

export function getResourcesPath(fileName: string) {
  let basePath = path.resolve(app.getAppPath(), '..')
  if (DEBUGGING) basePath = path.resolve(app.getAppPath(), '.')
  return path.join(basePath, fileName)
}

export function getStaticPath(fileName: string) {
  let basePath = path.resolve(app.getAppPath(), '..')
  if (DEBUGGING) basePath = path.resolve(app.getAppPath(), './static')
  if (fileName.startsWith('icon')) {
    if (fileName == 'icon_256x256.ico' && process.platform !== 'win32') {
      fileName = path.join('images', 'icon_64x64.png')
    } else {
      fileName = path.join('images', fileName)
    }
  }
  return path.join(basePath, fileName)
}

export function getUserDataPath(fileName: string) {
  return path.join(app.getPath('userData'), fileName)
}

export function mkAriaConf(filePath: string) {
  try {
    if (!existsSync(filePath)) writeFileSync(filePath, ariaconf, 'utf-8')
  } catch {
  }
}

const ariaconf = `# debug, info, notice, warn or error
 log-level=error
 file-allocation=trunc
 user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36
 max-concurrent-downloads=64
 max-connection-per-server=16
 enable-rpc=true
 rpc-allow-origin-all=true
 rpc-listen-all=false
 rpc-secret=S4znWTaZYQi3cpRNb
 rpc-secure=false
 pause-metadata=true
 http-no-cache=true
 disk-cache=32M
 continue=true
 allow-overwrite=true
 auto-file-renaming=false
 max-download-result=1000
 no-netrc=true
 reuse-uri=true
 quiet=true
 disable-ipv6=false
 check-certificate=false
 save-session=
 save-session-interval=0
 follow-metalink=false
 follow-torrent=false
 enable-dht=false
 enable-dht6=false
 bt-enable-lpd=false
 enable-peer-exchange=false
 bt-request-peer-speed-limit=1
 dht-file-path=
 dht-file-path6=
 seed-time=0
 force-save=false
 bt-save-metadata=false
 `
