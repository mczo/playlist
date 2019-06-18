const path = require('path');

module.exports = 

{
    server: {
        port: 3004
    },

    info: {
        name: 'Mczo 的歌单',
        id: '53636965'
    },

    render: {
        root: path.join(__dirname, 'views'),
        layout: false,
        viewExt: 'ejs',
        cache: false,
        debug: true,
        async: true
    },

    rootPath: path.resolve(__dirname);

    getPath: function(url) {
        return path.join(this.rootPath, url);
    }
}