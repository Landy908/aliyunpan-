import { B64decode, b64decode, humanSize } from '../utils/format'
import axios, { AxiosProgressEvent, AxiosResponse } from 'axios'
import Config from '../config'
import message from '../utils/message'
import { IShareSiteModel, useServerStore } from '../store'
import { Modal } from '@arco-design/web-vue'
import { h } from 'vue'
import { getResourcesPath, openExternal } from '../utils/electronhelper'
import ShareDAL from '../share/share/ShareDAL'
import DebugLog from '../utils/debuglog'
import { writeFileSync, rmSync, existsSync } from 'fs'
import { execFile, SpawnOptions } from 'child_process'
import path from 'path'

const { shell } = require('electron')

export interface IServerRespData {
  state: string
  msg: string

  [k: string]: any
}

export default class ServerHttp {
  static baseApi = b64decode('aHR0cDovLzEyMS41LjE0NC44NDo1MjgyLw==')

  static async PostToServer(postData: any): Promise<IServerRespData> {
    postData.appVersion = Config.appVersion
    const str = JSON.stringify(postData)
    if (window.postdataFunc) {
      let enstr = ''
      try {
        enstr = window.postdataFunc(str)
        console.log(enstr)
      } catch {
        return { state: 'error', msg: '联网失败' }
      }
      return ServerHttp.Post(enstr).catch(() => {
        return { state: 'error', msg: '网络错误' }
      })
    } else {
      return { state: 'error', msg: '程序错误' }
    }
  }

  static async Post(postData: any, isfirst = true): Promise<IServerRespData> {
    const url = ServerHttp.baseApi + 'xby2'
    return axios
      .post(url, postData, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {}
      })
      .then((response: AxiosResponse) => {
        if (response.status != 200) return { state: 'error', msg: '网络错误' }
        const buff = response.data as ArrayBuffer
        const uint8array = new Uint8Array(buff)
        for (let i = 0, maxi = uint8array.byteLength; i < maxi; i++) {
          uint8array[i] ^= 9 + (i % 200)
        }
        const str = new TextDecoder().decode(uint8array)
        return JSON.parse(str) as IServerRespData
      })
      .catch(() => {
        return { state: 'error', msg: '网络错误' }
      })
      .then((resp) => {
        if (resp.state == 'error' && resp.msg == '网络错误' && isfirst) {

          return ServerHttp.Sleep(2000).then(() => {
            return ServerHttp.Post(postData, false)
          })
        } else return resp
      })
  }

  static Sleep(msTime: number) {
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            success: true,
            time: msTime
          }),
        msTime
      )
    )
  }

  static configUrl = b64decode('aHR0cHM6Ly9naXRlZS5jb20vUGluZ0t1L2FsaXl1bnBhbi1jb25maWcvcmF3L2RldmVsb3AvY29uZmlnMy5qc29u')
  static updateUrl = b64decode('aHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9vZG9tdS9hbGl5dW5wYW4vcmVsZWFzZXMvbGF0ZXN0')
  static showVer = false

  static async CheckConfigUpgrade(): Promise<void> {
    axios
      .get(ServerHttp.configUrl, {
        withCredentials: false,
        responseType: 'json',
        timeout: 30000
      })
      .then(async (response: AxiosResponse) => {
        console.log('CheckConfigUpgrade', response)
        if (response.data.SIP) {
          const SIP = B64decode(response.data.SIP)
          if (SIP.length > 0) ServerHttp.baseApi = SIP
        }
        if (response.data.SSList) {
          const list: IShareSiteModel[] = []
          for (let i = 0, maxi = response.data.SSList.length; i < maxi; i++) {
            const item = response.data.SSList[i]
            const add = { title: item.title, url: item.url, tip: item.tip }
            if (add.url.length > 0) list.push(add)
          }
          ShareDAL.SaveShareSite(list)
        }
        if (response.data.HELP) {
          useServerStore().mSaveHelpUrl(response.data.HELP)
        }
      })
  }

  static async CheckUpgrade(): Promise<void> {
    axios
      .get(ServerHttp.updateUrl, {
        withCredentials: false,
        responseType: 'json',
        timeout: 30000
      })
      .then(async (response: AxiosResponse) => {
        console.log('CheckUpgrade', response)
        if (!response.data || !response.data.assets || !response.data.html_url) {
          message.error('获取新版本出错')
          return
        }
        let tagName = response.data.tag_name
        let assets = response.data.assets
        let html_url = response.data.html_url
        let updateData = { name: '', url: '', size: 0 }
        for (let asset of assets) {
          const fileData = { name: asset.name, url: asset.browser_download_url, size: asset.size }
          if (process.platform === 'win32' && fileData.name.indexOf('Setup') > 0) {
            updateData = fileData
            break
          } else if (process.platform === 'darwin'
            && fileData.name.indexOf(process.arch) > 0
            && fileData.name.indexOf('dmg') > 0) {
            updateData = fileData
            break
          } else if (process.platform === 'linux'
            && fileData.name.indexOf(process.arch) > 0
            && fileData.name.indexOf('AppImage') > 0) {
            updateData = fileData
            break
          }
        }
        if (tagName) {
          const localVer = Config.appVersion.replaceAll('v', '').replaceAll('.', '').trim()
          const remoteVer = tagName.replaceAll('v', '').replaceAll('.', '').trim()
          const fileSize = humanSize(updateData.size)
          const verInfo = this.dealText(response.data.body as string)
          const verUrl = 'https://ghproxy.com/' + updateData.url || ''

          const v1Int = parseInt(localVer), v2Int = parseInt(remoteVer)
          if (v2Int > v1Int) {
            if (!ServerHttp.showVer) {
              ServerHttp.showVer = true
              Modal.confirm({
                okText: process.platform !== 'linux' ? '更新' : '详情',
                cancelText: '取消',
                title: () => h('div', {
                  innerHTML: `有新版本<span class="vertip">${tagName}${process.platform !== 'linux' ? '【' + fileSize + '】' : ''}</span><i class="verupdate"></i>`,
                  class: { vermodalhead: true },
                  style: { maxWidth: '540px' }
                }),
                mask: true,
                maskClosable: false,
                escToClose: false,
                alignCenter: true,
                simple: true,
                onOk: async () => {
                  if (verUrl.length > 0 && process.platform !== 'linux') {
                    // 下载安装
                    await this.AutoDownload(verUrl, updateData.name)
                    return
                  } else {
                    // 打开详情
                    openExternal(html_url)
                  }
                },
                onCancel: async ()=> {
                  let resourcesPath = getResourcesPath(updateData.name)
                  if (existsSync(resourcesPath)) {
                    rmSync(resourcesPath, { force: true })
                    return true
                  }
                },
                onClose: () => ServerHttp.showVer = false,
                content: () => h('div', {
                  innerHTML: verInfo,
                  class: { vermodal: true }
                })
              })
            }
          } else if (v2Int == v1Int) {
            message.info('已经是最新版 ' + tagName, 6)
          } else if (v2Int < v1Int) {
            message.info('您的本地版本 ' + Config.appVersion + ' 已高于服务器版本 ' + tagName, 6)
          }
        }
      })
      .catch((err: any) => {
        DebugLog.mSaveDanger('CheckUpgrade', err)
      })
  }

  static dealText(context: string): string {
    let splitTextArr = context.trim().split(/\r\n/g)
    let resultTextArr: string[] = []
    splitTextArr.forEach((item, i) => {
      let links = item.match(/!?\[.+?\]\(https?:\/\/.+\)/g)
      // 处理链接
      if (links != null) {
        for (let index = 0; index < links.length; index++) {
          const text_link = links[index].match(/[^!\[\(\]\)]+/g)//提取文字和链接
          if (text_link) {
            if (links[index][0] == '!') { //解析图片
              item = item.replace(links[index], '<img src="' + text_link[1] + '" loading="lazy" alt="' + text_link[0] + '" />')
            } else { //解析超链接
              item = item.replace(links[index], `<i>【${text_link[0]}】</i>`)
            }
          }
        }
      }
      if (item.indexOf('- ')) { // 无序列表
        item = item.replace(/.*-\s+(.*)/g, '<strong>$1</strong>')
      }
      if (item.indexOf('* ')) { // 无序列表
        item = item.replace(/.*\*\s+(.*)/g, '<strong>$1</strong>')
      }
      if (item.includes('**')) {
        item = item.replaceAll(/\*\*/g, '')
      }
      if (item.startsWith('# ')) { // 1 级标题（h1）
        resultTextArr.push(`<h1>${item.replace('# ', '')}</h1>`)
      } else if (item.startsWith('## ')) { // 2 级标题（h2）
        resultTextArr.push(`<h2>${item.replace('## ', '')}</h2>`)
      } else if (item.startsWith('### ')) { // 3 级标题（h3）
        resultTextArr.push(`<h3>${item.replace('### ', '')}</h3>`)
      } else if (item.indexOf('---') == 0) {
        resultTextArr.push(item.replace('---', '<hr>'))
      } else { // 普通的段落
        resultTextArr.push(`${item}`)
      }
    })
    return resultTextArr.join('<br>')
  }

  static async AutoDownload(appNewUrl: string, file_name: string): Promise<boolean> {
    let resourcesPath = getResourcesPath(file_name)
    if (existsSync(resourcesPath)) {
      this.autoInstallNewVersion(resourcesPath)
      return true
    }
    message.info('新版本正在后台下载中，请耐心等待。。。。',  10)
    return axios
      .get(appNewUrl, {
        withCredentials: false,
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Expires: '0'
        },
      })
      .then((response: AxiosResponse) => {
        writeFileSync(resourcesPath, Buffer.from(response.data))
        this.Sleep(2000)
        this.autoInstallNewVersion(resourcesPath)
        return true
      })
      .catch(() => {
        message.error('新版本下载失败，请前往github下载最新版本', 6)
        rmSync(resourcesPath, { force: true })
        return false
      })
  }

  static autoInstallNewVersion(resourcesPath: string) {
    // 自动安装
    const options: SpawnOptions = { shell: true, windowsVerbatimArguments: true }
    execFile('\"' + resourcesPath + '\"', options, error => {
      if(error) {
        message.info('安装失败，请前往文件夹手动安装', 5)
        const resources = getResourcesPath('')
        shell.openPath(path.join(resources, '/'))
      }
    })
  }
}





