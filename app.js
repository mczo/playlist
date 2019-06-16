const fs = require('fs');
const Koa = require('koa');
const render = require('koa-ejs');
const Router = require('koa-router');

const   app = new Koa(),
        router = new Router();

// config
const config = require('./config');



require('./routers/get') (router);

app
    .use(router.routes())
    .use(router.allowedMethods())

app.listen(config.server.port, _ => {
    console.info('Run in port %s', config.server.port);
});