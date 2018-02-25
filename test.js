const fs = require('fs')
const request = require('request')
const progress = require('request-progress')

let minList = ['/Users/BraisedCakes/Desktop/tinypng_output/image.png'];

let token = new Buffer('api:' + 'sn07kskC9G9n-PCTbZXSgpH2IXKXvYxS').toString('base64'); // prep key
minList.forEach((item) => {
    let buf = fs.readFileSync(item);
    progress(request.post({
            url: 'https://api.tinypng.com/shrink',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + token
            },
            strictSSL: false,
            body: buf
        }))
        .on('progress', function (state) {
            console.log('progress', state);
        })
        .on('error', function (err) {
            console.log(err)
        })
        .on('end', function (body) {
            console.log('下载完成');
        });
})