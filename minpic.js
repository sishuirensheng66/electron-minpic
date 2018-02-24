const fs = require('fs')
const glob = require('glob')
const path = require('path')
const tinify = require("tinify")
const md5 = require('md5')
const util = require('util')
const request = require('request')
const cwd = process.cwd()
let minList = [] //需要压缩的图片列表
let cacheData = [] //存储压缩信息md5的列表
let keyFile = {} //key文件的json格式化
let keyIndex = 0 //当前用的key在keyFile中的位置
let usedkeyIndexList = [] //此次压缩过程中，使用到的key的索引的集合
let compressedNum = 0 //压缩过的图片数量
let webpackCallback = null
class Minpic {

    constructor(options = {}) {
        let defaults = {
            disabled: false, //是否禁止启用
            keyFilePath: path.resolve(process.env.HOME || process.env.USERPROFILE, '.minpic.json'), //存储key的文件路径
            cacheFilePath: path.resolve(cwd, '.minpic.txt'), //存储压缩信息的文件路径
            force: false, //是否强制压缩
            source: '', //压缩哪个目录下的
            shell: false, //命令行启动
            init() {},
            completeOnce() {},
            success() {},
            error() {}
        }
        for (let attr in defaults) {
            if (typeof options[attr] === 'undefined') {
                options[attr] = defaults[attr]
            }
        }
        this.options = options
    

        
        let source = path.resolve(this.options.source)
        //获取图片列表
        minList = glob.sync(path.resolve(source, '**/*.@(jpg|png|jpeg)'), {
            ignore: [path.resolve(cwd, 'node_modules/**')]
        })

        console.log(minList)
    }   
}

module.exports = Minpic;