const {
    ipcRenderer
} = require('electron')
const Vue = require('vue/dist/vue.js')
const $ = require('jquery')


var app = new Vue({
    el: '#app',
    data: {
        data: [{}, {}]
    },
    methods: {
        openFile() {
            ipcRenderer.send('open-file', '点击了拖拽')
        }
    }
})
/**
 * 上传完成
 */
ipcRenderer.on('uploadSuccess', (event, arg) => {
    const index = getIndex(arg.id);
    const item = getItem(index);
    app.$set(app.data, index, Object.assign(item, arg));

    
});
/**
 * 下载完成
 */
ipcRenderer.on('downloadSuccess', (event, arg) => {
    const index = getIndex(arg.id);
    const item = getItem(index);

    if(arg.progressDownload == 1){
        arg.status = 3;
    }

    app.$set(app.data, index, Object.assign(item, arg));
});



ipcRenderer.on('asynchronous-reply', (event, arg) => {
    arg.forEach(item => {
        item.style = {
            'background-image': `url(${item.path})`,
            'background-size': (item.width < 48 && item.height < 48) ? 'auto' : 'contain'
        }
    });
    app.data = arg;
});


ipcRenderer.on('download-success', (event, arg) => {
    const index = getIndex(arg.id);
    const item = getItem(index);
    app.$set(app.data, index, Object.assign(item, arg));
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