const rp = require('request-promise');
const schedule = require('node-schedule');
const NeteaseMusic = require('simple-netease-cloud-music');

const nm = new NeteaseMusic();
let playList = new Object();

module.exports = router => {
    router.get('/list', async ctx => {
        ctx.body = playList;
    });

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

getList();
schedule.scheduleJob('0 0 1 * * *', getList);
function getList() {
    const options = {
        uri: `http://music.163.com/api/playlist/detail?id=${config.info.id}&updateTime=-1`,
        json: true
    };

    playList = 
    rp(options)
        .then(data => {
            const playList = new Array();
            const sslRep = new RegExp(/^http/);

            for(let i of data.result.tracks) {
                playList.push({
                    id: i.id,
                    name: i.name,
                    artist: i.artists[0].name,
                    duration: i.duration,
                    alias: i.alias,
                    picUrl: i.album.picUrl.replace(sslRep, 'https')
                });
            };

            return playList;
        });

}