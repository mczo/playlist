const path = require('path');

module.exports = 

{
    server: {
        port: 3004
    },

    info: {
        name: 'Mczo 的歌单'
    },

    render: {
        root: path.join(__dirname, 'views'),
        layout: false,
        viewExt: 'ejs',
        cache: false,
        debug: true,
        async: true
    }
}