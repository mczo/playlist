// 私有
const set = Symbol('handler_set');

class PlayList {
    constructor() {
        this.player = new Proxy({
            progress: document.querySelector('#area-aside .player-progress'),
            pic: document.querySelector('#area-aside .player-pic'),
            info: document.querySelector('#area-aside .player-pic'),
            prev: document.querySelector('#area-aside .player-prev'),
            status: document.querySelector('#area-aside .player-status'),
            next: document.querySelector('#area-aside .player-next'),
            radom: document.querySelector('#area-aside .player-radom')
        }, {
            set: this[set]
        });

    }

    start() {
    }

    [set] (target, propKey, value) {
        switch (propKey) {
            case '':
                break;
        }
    }
}