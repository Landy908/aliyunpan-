<script setup lang='ts'>
import { ref } from 'vue'
import { KeyboardState, useAppStore, useKeyboardStore, useServerStore } from '../../store'
import { B64decode } from '../../utils/format'
import { TestKey } from '../../utils/keyboardhelper'
import { modalDaoRuShareLink } from '../../utils/modal'
import message from '../../utils/message'

const appStore = useAppStore()
const serverStore = useServerStore()

const siteUrl = ref('')

const keyboardStore = useKeyboardStore()
keyboardStore.$subscribe((_m: any, state: KeyboardState) => {
  if (appStore.appTab != 'share' || appStore.GetAppTabMenu != 'MyShareRight') return
  if (TestKey('f5', state.KeyDownEvent, handleRefresh)) return
})

const handleSite = (url: string) => {
  if (url.startsWith('http')) {
    siteUrl.value = url
  } else {
    const ourl = B64decode(url)
    if (ourl) siteUrl.value = ourl
    else siteUrl.value = ''
  }
  handleAddListener()
}

const handleSiteShareUrl = (event: any) => {
  // 获取点击的目标元素
  const target = event.target
  // 获取点击的 URL
  const url = target.href || ''
  if (url.startsWith('magnet') || url.includes('aliyundrive')) {
    event.preventDefault()
  }
  if (url.includes('aliyundrive')) {
    console.log('url', url)
    modalDaoRuShareLink(url)
  } else if (url.startsWith('magnet')) {
    console.log('磁力链接:', url)
  }
}

const handleAddListener = () => {
  const iframe = document.getElementById('siteIframe') as any
  if (!iframe) {
    message.error('打开网页失败，请手动刷新网页')
    return
  }
  // 监听 iframe 页面的 load 事件
  iframe.addEventListener('load', () => {
    // // 获取 iframe 内部的 document 对象
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document
    // 自动处理广告
    setTimeout(() => {
      const element = iframeDocument.querySelector('.swal2-close')
      if (element) {
        element.click()
      }
    }, 50)
    iframeDocument.addEventListener('click', handleSiteShareUrl)
  })
}

const handleRemoveListener = () => {
  const iframe = document.getElementById('siteIframe') as any
  if (!iframe) {
    message.error('打开网页失败，请手动刷新网页')
    return
  }
  iframe.removeEventListener('click', handleSiteShareUrl)
}

const handleRefresh = () => {
  const iframe = document.getElementById('siteIframe') as any
  if (!iframe) {
    message.error('打开网页失败，请手动刷新网页')
    return
  }
  const iframeDocument = iframe.contentDocument || iframe.contentWindow.document
  iframeDocument.location.reload()
  handleAddListener()
}

const handleClose = () => {
  siteUrl.value = ''
  handleRemoveListener()
}

</script>

<template>
  <div style='width: calc(100% - 32px); margin: 24px 24px 24px 8px; box-sizing: border-box'>
    <p class='sitetitle' v-show='!siteUrl'>搜索到的一些阿里云盘分享网站,欢迎投稿</p>
  </div>
  <div class='toppanbtns' style='height: 36px' v-show='siteUrl'>
    <div class='toppanbtn'>
      <a-button type='text' size='small' tabindex='-1' title='F5'
                @click='handleRefresh'>
        <i class='iconfont iconreload-1-icon' />刷新网页
      </a-button>
    </div>
    <div class='toppanbtn'>
      <a-button type='text' size='small' tabindex='-1' title='Ctrl+N' @click='handleClose'>
        <i class='iconfont iconclose' />关闭网页
      </a-button>
    </div>
  </div>
  <div class='fullscroll'>
    <a-card :bordered='false'
            v-if='!siteUrl'
            style='width: calc(100% - 32px); margin: 0 24px 24px 8px; box-sizing: border-box'
            class='sitelist'>
      <a-card-grid v-for='(item, index) in serverStore.shareSiteList' :key='index' :hoverable='index % 2 === 0'
                   class='sitelistitem'>
        <a @click='handleSite(item.url)' v-html="item.title.replace('[', '<small>').replace(']', '</small>')"></a>
      </a-card-grid>
    </a-card>
    <iframe id='siteIframe' v-show='siteUrl' :src='siteUrl'
            style='width: calc(100% - 32px); height: calc(100% - 36px); border: none; overflow: hidden' />
  </div>
</template>

<style>
.sitetitle {
  margin: 0;
  font-size: 18px;
  line-height: 20px;
  font-weight: 500;
  text-align: center;
  color: var(--color-text-1);
}

.sitelist {
  margin-top: 40px !important;
  text-align: center;
}

.sitelist .arco-card-header {
  border-bottom: none !important;
}

.sitelistitem {
  width: 33.33%;
  padding: 28px 0;
  text-align: center;
  font-size: 16px;

  color: rgb(188, 143, 143);
}

.sitelistitem a {
  cursor: pointer;
  color: rgb(var(--color-link-light-2));
}

.sitelistitem:hover {
  background-color: var(--color-fill-2);
  color: rgb(var(--primary-6));
}

.sitelistitem small {
  padding-left: 4px;
  font-size: 12px;
}
</style>
