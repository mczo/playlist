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

    const lrcReg = new RegExp(/\[(?<time>[^\]]+)\](?<paragraph>[^\[]*)/, 'g');
    router.get('/lyric/:id', async ctx => {
        const options = {
            uri: `http://music.163.com/api/song/lyric?os=pc&id=${ctx.params.id}&lv=-1&kv=-1&tv=-1`,
            json: true
        };

        await rp(options)
            .then(data => {
                const lrcList = {
                    lrc: new Object(),
                    tlyric: new Object()
                };
                const original = {
                    lrc: data.lrc.lyric,
                    tlyric: data.tlyric.lyric
                }

                for(const [key, value] of Object.entries(original)) {
                    const str = value.replace(/\n/g, '');

                    for(const match of str.matchAll(lrcReg)) {
                        const {time, paragraph} = match.groups;
                        const [minute, second, millisecond] = time.split(/[:.]/);

                        const   parseMin = parseInt(minute),
                                parseSec = parseInt(second),
                                parseMs = parseInt(millisecond);

                        if(!isNaN(parseMin) && paragraph !== '') {
                            const totalMs = (parseMin * 60 + parseSec) * 1000 + parseMs * 10;
                            lrcList[key][totalMs] = paragraph;
                        } 
                        // else {
                        //     lrcList[key][0] = time;
                        // }
                    }
                }

                lrcList.id = ctx.params.id;

                ctx.body = lrcList;
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
                    picUrl: i.album.picUrl.replace(sslRep, 'https')
                });
            };

            return playList;
        });

}