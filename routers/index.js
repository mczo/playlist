const AsyncFile = require('../lib/asyncFile');

const { config } = global;
const afs = new AsyncFile( config.getPath('/public/asset/') );

module.exports = router => {
    router.get('/', async ctx => {
        const unprocessed = {
            cssData: afs.mergecss('general/reset', 'general/flex', 'general/grid', 'general/global', 'playlist/config', 'playlist/attach', 'playlist/index'),
            jsData: afs.mergejs('general/action', 'playlist/player', 'playlist/index')
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