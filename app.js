const Koa = require('koa');
const render = require('koa-ejs');
const Router = require('koa-router');

const   app = new Koa(),
        index = new Router(),
        api = new Router( { prefix: '/api' } );

// config
const config = require('./config');

// global
global.config = config;

// 音乐
require('./routers/index') (index);

// api
require('./routers/api') (api)

app
    .use(index.routes())
    .use(index.allowedMethods())
    .use(api.routes())
    .use(api.allowedMethods())


app.listen(config.server.port, _ => {
    console.info('Run in port %s', config.server.port);
});