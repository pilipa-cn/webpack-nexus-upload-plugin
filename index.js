/**
 * Created by oyhanyu on 2017/9/14.
 * webpack plugin for detail the files of webpack compiled with your own way, such as OSS, S3 etc.
 */

var fs = require('fs');
var uploadArr = []
function uploadFiles (options, filename, source, callback) {
    var result;
    try {
        if (options.upload && typeof options.upload === 'function') {
            options.upload.call(null, filename, source)
        } else {
            // ali oss default
            var OSS = require('ali-oss');
            var client = new OSS.Wrapper(options.aliOSS);
            result = client.put(options.aliOSS.fileDir + filename, source)
                .then(function (val) {
                    console.log(filename + ' upload success, url=%j', val.url);
                    return true;
                })
                .catch (function (err) {
                    console.log(filename + ' upload failed: error=%j', err.toString());
                    callback(new Error('webpack build failed, reason: file' + filename + ' upload failed!'))
                    return false;
                });
            uploadArr.push(result);
        }
    } catch (e) {
      callback(new Error('remote upload failed!'))
    }
}
function apply(options, compiler) {
    //
    compiler.plugin("after-emit", function(compilation, callback) {
        console.log("The compilation is going to handle files...");
        var basePath = options.path;
        for (var filename in compilation.assets) {
            var stream = fs.createReadStream(basePath + '/' + filename);
            uploadFiles(options, filename, stream, callback)
        }
        Promise.all(uploadArr).then((result) => {
            if (result.length && !result.includes(false)) {
              console.log('build success')
              callback();
            } else {
              callback(new Error('webpack build failed, reason: some files upload failed!'))
            }
        });
    });
}
module.exports = function(options) {
    // validate the options
    if (!options.path || options.path === '') {
        throw new Error('publish path is required!')
    } else if (!options.upload || typeof options.upload !== 'function') {
        if (!options.aliOSS) {
            throw new Error('Must contain one of upload function and aliOSS !')
        } else {
            var aliOssOpt = options.aliOSS;
            if (!aliOssOpt.region) {
                throw new Error('aliOSS region is required!')
            }
            if (!aliOssOpt.accessKeyId) {
                throw new Error('aliOSS accessKeyId is required!')
            }
            if (!aliOssOpt.accessKeySecret) {
                throw new Error('aliOSS accessKeySecret is required!')
            }
            if (!aliOssOpt.bucket) {
                throw new Error('aliOSS bucket is required!')
            }
            if (!aliOssOpt.fileDir) {
                aliOssOpt.fileDir = '/';
            }
        }
    }
    return {
        apply: apply.bind(this, options)
    };
};