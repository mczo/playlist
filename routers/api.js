const NeteaseMusic = require('simple-netease-cloud-music');

const nm = new NeteaseMusic();

module.exports = router => {

    router.get('/song/:id', async ctx => {

        await nm.url(ctx.params.id)
            .then(res => {
                res.data[0].url = res.data[0].url.replace(/^http/, 'https');

                ctx.body = res;
            });
        

    });


}
