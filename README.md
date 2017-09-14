# webpack-nexus-upload-plugin

webpack plugin for detail the files of webpack compiled with your own way, such as OSS, S3 etc.

# Features

use this plugin, the webpack compiled files are processed again. Upload to OSS, S3, or local disk，the default is built-in alioss.

# Installation

```
$ npm --save source-uploader-webpack-plugin
```

# Usage

Add new plugin instance to your `webpack` config

```
const SourceUploaderWebpackPlugin = require('source-uploader-webpack-plugin');

  const compiler = webpack({
  	output: {
      publicPath: "your cdn path"
  	},
    // ...
    plugins: [
      new SourceUploaderWebpackPlugin({
      	  path: paths.appBuild, 
      	  createLocal: false, 
      	  aliOSS: {
              region: '<Your region>',
              accessKeyId: '<Your AccessKeyId>',
              accessKeySecret: '<Your AccessKeySecret>',
              bucket: 'Your bucket name',
              fileDir: 'file path on alioss'
      	  },
      	  upload: function(filename, source) {
          	// dosomthing with file source
            console.log(source)
      	  }
      )
    ]
  })
```

# Configuration

The plugin accepts the following options:

- `path`: Your application build path(output->path), for generate the local html file.

- `createLocal`: Generate local file. `boolean` Defaults to `false`.

- `aliOSS`: aliOSS options.

  region: '<Your region>'

  accessKeyId: '<Your AccessKeyId>'

  accessKeySecret: '<Your AccessKeySecret>'

  bucket: 'Your bucket name'

  fileDir: 'file path on alioss'

- `upload`: Your own callback function, accept two parameters:

  @param filename: include the build path, for example `static/js/main.js`
  @param source: the file source

  @return  true/false, true is upload success, on the contrary is upload failed

  ## Notice

  - If you use aliOSS, you can configure `aliOSS`, also you can use `upload` callback, in the callback function, you can write you own code implementation.
  - `publicPath` in webpack should be your cdn path, the compiled file will be replaced with this path.

# License

MIT