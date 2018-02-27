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
        data: [],
        keylist: [{
            key: ''
        }]
    },
    methods: {
        openFile() {

            // return;
            ipcRenderer.send('open-file')
        }
    },
    watch: {
        keylist: {
            handler: function () {
                ipcRenderer.send('setKey', this.keylist)
            },
            deep: true
        }
    }
});


document.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    let json = [];
    for (let f of e.dataTransfer.files) {
        console.log('File(s) you dragged here: ', f.path)
        json.push(f.path)
    }
    ipcRenderer.send('open-file', json)
});
document.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.stopPropagation();
});

ipcRenderer.on('getKey', (event, arg) => {
    app.$set(app, 'keylist', arg || [{
        key: ''
    }]);
});

/**
 * 某张图片上传中
 */
ipcRenderer.on('push', (event, arg) => {
    const index = getIndex(arg.id);
    const item = getItem(index);
    app.$set(app.data, index, Object.assign(item, arg));
    console.log(arg)
});

ipcRenderer.on('getImageList', (event, arg) => {
    arg.forEach(item => {
        item.style = {
            'background-image': `url(${item.path})`,
            'background-size': (item.width < 48 && item.height < 48) ? 'auto' : 'contain'
        }
    });
    app.data.push(...arg);
});

function getIndex(id) {
    const index = app.data.findIndex((item) => {
        return item.id == id
    });
    return index;
};

function getItem(index) {
    return app.data[index];
};

$(document).on('input', '.api_key', () => {
    console.log(app.keylist)
});