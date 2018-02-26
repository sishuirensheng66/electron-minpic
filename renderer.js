const {
    ipcRenderer
} = require('electron')
const Vue = require('vue/dist/vue.js')
const $ = require('jquery')
const {
    IMAGE_STATUS
} = require('./const.js')

var app = new Vue({
    el: '#app',
    data: {
        data: []
    },
    methods: {
        openFile() {
            ipcRenderer.send('open-file', '点击了拖拽')
        }
    }
})
/**
 * 某张图片上传中
 */
ipcRenderer.on('push', (event, arg) => {
    const index = getIndex(arg.id);
    const item = getItem(index);
    app.$set(app.data, index, Object.assign(item, arg));
    console.log(arg)
});

/**
 * 所有都done， 不管成功还是失败
 */
ipcRenderer.on('allDone', (event, arg) => {
    // alert(999)
    // new Notification('标题', {
    //     body: '通知正文内容'
    // })

});

ipcRenderer.on('getImageList', (event, arg) => {
    arg.forEach(item => {
        item.style = {
            'background-image': `url(${item.path})`,
            'background-size': (item.width < 48 && item.height < 48) ? 'auto' : 'contain'
        }
    });
    app.data = arg;
});

function getIndex(id) {
    const index = app.data.findIndex((item) => {
        return item.id == id
    });
    return index;
};

function getItem(index) {
    return app.data[index];
}