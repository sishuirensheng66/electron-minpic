const {
    ipcRenderer
} = require('electron')
// console.log(ipcRenderer.sendSync('synchronous-message', 'ping')) // prints "pong"
const Vue = require('vue/dist/vue.js')
var app = new Vue({
    el: '#app',
    data: {
        message: 'Hello Vue!',
        data: [{
            path : '/Users/BraisedCakes/Desktop/tinypng_output/logo.jpg',
            basename : 'logo.jpg',
            ratio : '1.5%',
            size : '-0.13k'
        }]
    },
    methods: {
        aaa() {
            ipcRenderer.send('asynchronous-message', 'pin111g')
            console.log(999);
        }
    }
})

ipcRenderer.on('asynchronous-reply', (event, arg) => {
    console.log(arg) // prints "pong"
    arg.forEach((item) => {
        item.name = '';
        item.size = '';
        item.ratio = '';
        item.status = '';
    })
    app.data = arg;

    console.log(arg)
})


ipcRenderer.on('download-success', (event, arg) => {
    console.log(arg)
    const index = app.data.findIndex((item) => {
        return item.id == arg.id
    });
    app.data[index].name = '下载完成';
    app.data[index].size = arg.size;
    app.data[index].ratio = arg.ratio;
    app.data[index].status = 0;
    console.log(app.data)
});
