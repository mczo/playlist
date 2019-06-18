const rp = require('request-promise');
const AsyncFile = require('../lib/asyncFile');

const { config } = global;

const afs = new AsyncFile( config.getPath('/public/asset/') );

let playList;

getList();

module.exports = router => {
    router.get('/', (ctx, next) => {
        const cssData = afs.mergecss('general/reset', 'general/flex', 'general/grid', 'general/global', 'playlist/index');

        const jsData = afs.mergejs('general/action', 'playlist/index');

        Promise.all([
            cssData,
            jsData
        ])
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

            for(let i of data.result.tracks) {
                playList.push({
                    id: i.id,
                    name: i.name,
                    alias: i.alias,
                    picUrl: i.album.picUrl,
                    mp3Url: '/song/' + i.id
                });
            }

            return playList;
        });

}