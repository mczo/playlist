const rp = require('request-promise');
const schedule = require('node-schedule');
const AsyncFile = require('../lib/asyncFile');

const { config } = global;

const afs = new AsyncFile( config.getPath('/public/asset/') );

let playList;

// 每天凌晨一点更新
getList();
schedule.scheduleJob('0 0 1 * * *', getList);

module.exports = router => {
    router.get('/', async (ctx, next) => {
        const unprocessed = {
            cssData: afs.mergecss('general/reset', 'general/flex', 'general/grid', 'general/global', 'playlist/config', 'playlist/index'),
            jsData: afs.mergejs('general/action', 'playlist/player', 'playlist/index'),
            playList
        };

        await Promise.all( Object.values(unprocessed) )
            .then(async data => {
                const process = {
                    info: config.info,
                    data: new Object()
                };

                Object.keys(unprocessed).map((key, index) => { process.data[key] = data[index] });

                await ctx.render('index', process);
            })
    });
}

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

            // console.log(data)

            for(let i of data.result.tracks) {
                playList.push({
                    id: i.id,
                    name: i.name,
                    duration: i.duration,
                    alias: i.alias,
                    picUrl: i.album.picUrl.replace(sslRep, 'https')
                });
            };

            return playList;
        });

}