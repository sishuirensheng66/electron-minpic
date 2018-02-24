const electron = require('electron')
const Minpic = require('./minpic')
// let noti = new Notification('Hello from OS X', {body: 'It Works!'});
// let noti.addEventListener('click', () => console.log('Got a click.'));
// Module to control application life.
const app = electron.app
const fs = require('fs')
const request = require('request')
const progress = require('request-progress')
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
const md5 = require('md5')
const glob = require('glob')
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		// transparent: true,
		// titleBarStyle: 'hidden',
		// frame: false,
		width: 800,
		height: 500
	})
	mainWindow.setResizable(true)
	// and load the index.html of the app.
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}));
	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null
	})
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', function () {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow()
	}
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

electron.ipcMain.on('asynchronous-message', (event, arg) => {
	// console.log(arg) // prints "ping"
	let source = electron.dialog.showOpenDialog({
		properties: ['openFile', 'openDirectory', 'multiSelections']
	})[0]



	let minList = glob.sync(path.resolve(source, '**/*.@(jpg|png|jpeg)'), {
		// ignore: [path.resolve(process.cwd(), 'node_modules/**')]
	})

	minList = minList.map((item) => {
		return {
			path: item,
			basename: path.basename(item),
			size: fs.statSync(item).size,
			id: md5(item)
		}
	})
	let token = new Buffer('api:' + 'sn07kskC9G9n-PCTbZXSgpH2IXKXvYxS').toString('base64'); // prep key
	minList.forEach((item) => {
		let buf = fs.readFileSync(item.path);
		request.post({
			url: 'https://api.tinypng.com/shrink',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': 'Basic ' + token
			},
			strictSSL: false,
			body: buf
		}, function (err, res, body) {
			console.log(err)
			console.log(body)
			let {
				input,
				output
			} = JSON.parse(body)
			progress(request(output.url), {})
				.on('progress', function (state) {
					console.log('progress', state);
				})
				.on('error', function (err) {
					console.log(err)
				})
				.on('end', function () {
					console.log('下载完成')
					event.sender.send('download-success', {
						id: item.id,
						status: 0,
						ratio: `${(1 - output.ratio).toFixed(2) * 100}%`,
						size: `-${((input.size - output.size) / 1000).toFixed(2)}k`
					})
				})
				.pipe(fs.createWriteStream(item.path));
		});
	})
	event.sender.send('asynchronous-reply', minList)

})