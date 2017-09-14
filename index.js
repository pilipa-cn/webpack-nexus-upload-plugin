/**
 * Created by oyhanyu on 2017/9/14.
 * webpack plugin for detail the files of webpack compiled with your own way, such as OSS, S3 etc.
 */

var fs = require('fs');
var uploadArr = []
function uploadFiles (options, filename, source) {
    var result;
    try {
        if (options.upload && typeof options.upload === 'function') {
            options.upload.call(null, filename, source)
        } else {
            // ali oss default
            var OSS = require('ali-oss');
            var client = new OSS.Wrapper(options.aliOSS);
            result = client.put(options.aliOSS.fileDir + filename, new Buffer(source, "utf8"))
                .then(function (val) {
                    console.log(filename + ' upload success, url= %j', val.url);
                    return true;
                })
                .catch (function (err) {
                    console.log(filename + ' upload failed: error = %j', err.toString());
                    return false;
                });
            uploadArr.push(result);
        }
    } catch (e) {
        console.log('remote upload failed!')
    }
    return result
}
function apply(options, compiler) {
    //
    compiler.plugin("emit", function(compilation, callback) {
        console.log("The compilation is going to handle files...");
        var basePath = options.path,
            indexHtmlCreated = false,
            indexHtmlName = '',
            indexHtmlSource = null;
        for (var filename in compilation.assets) {
            var source = compilation.assets[filename].source()
            // remove favicon hash
            /*if (filename.indexOf('favicon') > -1) {
             filename = 'favicon.ico'
             }*/
            if (filename.indexOf('\.html') > -1) {
                indexHtmlName = filename;
                indexHtmlSource = source;
            }
            uploadFiles(options, filename, source)
        }
        Promise.all(uploadArr).then((result) => {
            if (result.length && !result.includes(false)) {
                if (!options.createLocal && !indexHtmlCreated && indexHtmlName !== '' && indexHtmlSource) {
                    fs.readdir(basePath, function (err) {
                        if(err) {
                            fs.mkdir(basePath, function (err) {
                                if(err)
                                    throw err;
                                console.log('create local dir success')
                            });
                        }
                    });
                    fs.writeFile(basePath + '/' + indexHtmlName, indexHtmlSource, function(err) {
                        if (err) {
                            throw err;
                        }
                        indexHtmlCreated = true;
                    })
                }
            } else {
                console.log('remote upload failed!', result)
            }
        });
        // create local files by @options.createLocal is true
        if (options.createLocal) {
            callback();
        }
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