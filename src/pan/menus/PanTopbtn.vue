<script lang='ts'>
import { computed, defineComponent } from 'vue'
import { handleUpload } from '../topbtns/topbtn'
import { modalCreatNewAlbum, modalCreatNewDir, modalCreatNewFile, modalDaoRuShareLink } from '../../utils/modal'

export default defineComponent({
  props: {
    dirtype: {
      type: String,
      required: true
    },
    inputpicType: {
      type: String,
      required: true
    },
    isselected: {
      type: Boolean,
      required: true
    }
  },
  setup(props) {
    const isShowBtn = computed(() => {
      return (props.dirtype === 'pic' && props.inputpicType != 'mypic')
        || props.dirtype === 'mypic' || props.dirtype === 'pan'
    })
    const isPic = computed(() => {
      return (props.dirtype === 'pic' && props.inputpicType != 'pic_root') || props.dirtype === 'mypic'
    })
    return {
      isShowBtn,
      isPic,
      modalCreatNewFile,
      modalCreatNewAlbum,
      modalCreatNewDir,
      handleUpload,
      modalDaoRuShareLink
    }
  }
})
</script>

<template>
  <div v-show="!isselected && ['pan', 'pic', 'mypic'].includes(dirtype)" class='toppanbtn'>
    <a-dropdown v-if='dirtype !== "pic"' trigger='hover' class='rightmenu' position='bl'>
      <a-button v-show="!dirtype.includes('pic')" type='text' size='small' tabindex='-1'>
        <i class='iconfont iconplus' />新建<i class='iconfont icondown' />
      </a-button>
      <template #content>
        <a-doption value='newfile' title='Ctrl+N' @click='modalCreatNewFile'>
          <template #icon><i class='iconfont iconwenjian' /></template>
          <template #default>新建文件</template>
        </a-doption>
        <a-doption value='newfolder' title='Ctrl+Shift+N' @click="() => modalCreatNewDir('folder')">
          <template #icon><i class='iconfont iconfile-folder' /></template>
          <template #default>新建文件夹</template>
        </a-doption>
        <a-doption value='newdatefolder' @click="() => modalCreatNewDir('datefolder')">
          <template #icon><i class='iconfont iconfolderadd' /></template>
          <template #default>日期+序号</template>
        </a-doption>
      </template>
    </a-dropdown>
    <a-button v-else-if="dirtype === 'pic' && inputpicType != 'pic_root'"
              type='text' size='small' tabindex='-1'
              @click='modalCreatNewAlbum'>
      <i class='iconfont iconplus' />创建相册
    </a-button>
    <a-dropdown v-if='!dirtype.includes("pic")' trigger='hover' class='rightmenu' position='bl'>
      <a-button type='text' size='small' tabindex='-1'>
        <i class='iconfont iconupload' />上传<i class='iconfont icondown' />
      </a-button>
      <template #content>
        <a-doption value='uploadfile' title='Ctrl+U'
                   @click="() => handleUpload('file')">
          <template #icon><i class='iconfont iconwenjian' /></template>
          <template #default>上传文件</template>
        </a-doption>
        <a-doption value='uploaddir' title='Ctrl+Shift+U' @click="() => handleUpload('folder', false)">
          <template #icon><i class='iconfont iconfile-folder' /></template>
          <template #default>上传文件夹</template>
        </a-doption>
      </template>
    </a-dropdown>
    <a-button v-if="isShowBtn && dirtype.includes('pic')" type='text' size='small' tabindex='-1' title='Ctrl+L'
              @click='handleUpload("pic_file", isPic)'>
      <i class='iconfont iconwenjian' />上传照片/视频
    </a-button>
    <a-button v-if="!dirtype.includes('pic')" type='text' size='small' tabindex='-1' title='Ctrl+L'
              @click='modalDaoRuShareLink()'>
      <i class='iconfont iconlink2' />导入分享
    </a-button>
  </div>
</template>
<style></style>
