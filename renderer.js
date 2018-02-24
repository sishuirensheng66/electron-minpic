const {
    ipcRenderer
} = require('electron')
// console.log(ipcRenderer.sendSync('synchronous-message', 'ping')) // prints "pong"
const Vue = require('vue/dist/vue.js')
var app = new Vue({
    el: '#app',
    data: {
        message: 'Hello Vue!',
        data: [
            //     {
            //     path: '/Users/BraisedCakes/Desktop/image.png',
            //     basename: 'logo.jpg',
            //     ratio: '1.5%',
            //     size: '-0.13k',
            //     status: 0,
            //     style: {
            //         'background-image': 'url(/Users/BraisedCakes/Desktop/image.png)',
            //         'background-size': 'contain'
            //     }
            // }
        ]
    },
    methods: {
        aaa() {
            ipcRenderer.send('asynchronous-message', 'pin111g')
            console.log(999);
        }
    }
})

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
    const index = app.data.findIndex((item) => {
        return item.id == arg.id
    });
    const item = app.data[index];
    app.$set(app.data, index, Object.assign(item, arg));
});