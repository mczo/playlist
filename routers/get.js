const rp = require('request-promise');

module.exports = router => {
    router.get('/', (ctx, next) => {
        // ctx.render()
    });
}

function getList() {
    const options = {
        uri: '',
        json: true
    };

    rp(options)
        .then(data => {

        })

}