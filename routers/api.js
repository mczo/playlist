const NeteaseMusic = require('simple-netease-cloud-music');

const nm = new NeteaseMusic();

module.exports = router => {

    router.get('/song/:id', async ctx => {

        await nm.url(ctx.params.id)
            .then(res => {
                const url = res.data[0].url.replace(/^http/, 'https');

                ctx.redirect(url);
            });
        

    });


}
