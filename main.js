const electron = require('electron')
const Minpic = require('./minpic')
const app = electron.app
const fs = require('fs')
const request = require('request')
const progress = require('request-progress')
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
const md5 = require('md5')
const glob = require('glob')
const sizeOf = require('image-size')
const {
	IMAGE_STATUS
} = require('./const.js')
let win

let minList = []; //图片列表
let minIndex = 0;


const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)



// return;
electron.ipcMain.on('setKey', (event, arg) => {
	db.set('list', arg)
		.write();

	//或者  db.get('now').value()  



	if (arg.length == 1 || !arg.find((item) => {
			return db.get('now').value() == item.key
		})) {
		db.set('now', arg[0].key)
			.write()
	}
});
// console.log(db.get('now').value())




function createWindow() {

	win = new BrowserWindow({
		// transparent: true,
		// titleBarStyle: 'hidden',
		// frame: false,
		width: 620,
		height: 600,
		icon: '/Users/BraisedCakes/Desktop/tinypng_output/git_white.png'
	})
	// win.setResizable(false)

	// setTimeout(()=>{
	// 	win.setContentSize(320,600);
	// }, 1000)
	win.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}))
	win.webContents.on('did-finish-load', () => {
		win.webContents.send('getKey', db.get('list').value())
	})

	win.on('closed', function () {
		win = null
	})

}
app.on('ready', createWindow)
app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', function () {
	if (win === null) {
		createWindow()
	}
})



function imageDone() {
	minIndex++;
	if (minIndex == minList.length) {
		//如果所有队列均执行完毕，则调取系统通知
		new electron.Notification({
			title: 'electron-minpic',
			body: '队列处理完成'
		}).show()
	}
}


electron.ipcMain.on('open-file', (event, arg) => {
	let source = electron.dialog.showOpenDialog({
		properties: ['openFile', 'openDirectory', 'multiSelections']
	})[0]
	minList = glob.sync(path.resolve(source, '**/*.@(jpg|png|jpeg)'))

	minList = minList.map((item) => {
		return {
			path: item,
			basename: path.basename(item),
			id: md5(item),
			width: sizeOf(item).width,
			height: sizeOf(item).height,
			status: IMAGE_STATUS.processIng
		}
	})

	win.webContents.send('getImageList', minList)

	let token = new Buffer('api:' + db.get('now').value()).toString('base64') // prep key
	minList.forEach((item) => {
		let buf = fs.readFileSync(item.path)
		request.post({
			url: 'https://api.tinypng.com/shrink',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': 'Basic ' + token
			},
			strictSSL: false,
			body: buf
		}, function (err, res, body) {
			//上传失败
			if (err) {
				console.log('上传失败', err)
				win.webContents.send('push', {
					id: item.id,
					status: IMAGE_STATUS.error
				})
				imageDone();
				return
			} else {
				win.webContents.send('push', {
					id: item.id,
					status: IMAGE_STATUS.processIng,
					progressUpload: 1
				})
			}
			let {
				input,
				output
			} = JSON.parse(body)
			//下载
			progress(request(output.url), {})
				.on('progress', function (state) {
					win.webContents.send('push', {
						id: item.id,
						status: IMAGE_STATUS.processIng,
						progressDownload: state.percent.toFixed(2),
					})
				})
				.on('error', function (err) {
					console.log('下载失败', err)
					imageDone();
					win.webContents.send('push', {
						id: item.id,
						status: IMAGE_STATUS.error
					})
				})
				.on('end', function () {
					imageDone();
					win.webContents.send('push', {
						id: item.id,
						status: IMAGE_STATUS.success,
						progressDownload: 1,
						ratio: output.ratio,
						inputSize: input.size,
						outputSize: output.size
					})
				})
				.pipe(fs.createWriteStream(item.path))
		})
	})
})