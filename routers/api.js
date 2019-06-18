const NeteaseMusic = require('simple-netease-cloud-music');

const nm = new NeteaseMusic();

module.exports = router => {

    router.get('/song/:id', async ctx => {
        let uri;

        await nm.url(ctx.params.id)
            .then(res => {
                uri = res.data[0].url.replace(/^http/, 'https');
            });

        ctx.redirect(uri);

    });


}
