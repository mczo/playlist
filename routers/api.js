const NeteaseMusic = require('simple-netease-cloud-music');

const nm = new NeteaseMusic();

module.exports = router => {

    router.get('/song/:id', async ctx => {

        await nm.url(ctx.params.id)
            .then(res => {
                const url = res.data[0].url;

                if(url)
                    ctx.redirect(url.replace(/^http/, 'https'));
                else 
                    ctx.status = 404;
            });
        

    });


}
