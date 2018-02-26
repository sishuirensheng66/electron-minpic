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
let mainWindow

let minList = []; //图片列表
let minIndex = 0;

function createWindow() {

	mainWindow = new BrowserWindow({
		// transparent: true,
		// titleBarStyle: 'hidden',
		// frame: false,
		width: 800,
		height: 320,
		icon: '/Users/BraisedCakes/Desktop/tinypng_output/git_white.png'
	})
	mainWindow.setResizable(true)

	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}))
	mainWindow.webContents.on('did-finish-load', () => {

	})

	mainWindow.on('closed', function () {
		mainWindow = null
	})

}
app.on('ready', createWindow)
app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', function () {
	if (mainWindow === null) {
		createWindow()
	}
})



function cb() {
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

	mainWindow.webContents.send('getImageList', minList)

	let token = new Buffer('api:' + 'sn07kskC9G9n-PCTbZXSgpH2IXKXvYxS').toString('base64') // prep key
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
				console.log(err)
				mainWindow.webContents.send('push', {
					id: item.id,
					status: IMAGE_STATUS.error
				})
				cb();
				return
			} else {
				mainWindow.webContents.send('push', {
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
					console.log('progress', state)
					mainWindow.webContents.send('push', {
						id: item.id,
						status: IMAGE_STATUS.processIng,
						progressDownload: state.percent.toFixed(2),
					})
				})
				.on('error', function (err) {
					console.log('下载失败', err)
					cb();
					mainWindow.webContents.send('push', {
						id: item.id,
						status: IMAGE_STATUS.error
					})
				})
				.on('end', function () {
					console.log('下载完成')
					cb();
					mainWindow.webContents.send('push', {
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