// 私有
const playlist = {
            proxyGet: Symbol('handler get'),
            proxySet: Symbol('handler set'),

            progress: Symbol('player process'),
            pic: Symbol('player pic'),
            info: Symbol('player info'),
            prev: Symbol('player prev'),
            status: Symbol('player status'),
            next: Symbol('player next'),
            radom: Symbol('player radom')
        }


class PlayList {
    constructor() {
        this.player = document.getElementById('player');
 
        this.action = new Proxy({
            [playlist.progress]: document.querySelector('.player-progress'),
            [playlist.pic]: document.querySelector('.player-pic'),
            [playlist.info]: document.querySelector('.player-info'),
            [playlist.prev]: document.querySelector('.player-prev'),
            [playlist.status]: document.querySelector('.player-status'),
            [playlist.next]: document.querySelector('.player-next'),
            [playlist.radom]: document.querySelector('.player-radom'),
            writable: false
        }, {
            get: this[playlist.proxyGet].bind(this),
            set: this[playlist.proxySet].bind(this)
        });

        this.list = document.querySelectorAll('#area-content .player-list ul li');

        this.index = 0;

        this.radom = false; // 随机播放

        this.playedList = new Array(); // 播放过的列表

        this.autoplay = true;
    }

    start() {
        this.current = this.list[this.index].dataset;

        this.player.src = `/api/song/${this.current.id}`; // 开始加载

        this.addPlayEvent();
        this.addActionEvent();
    }

    addPlayEvent() { // 添加播放事件

        this.player
            .on('loadstart', _ => {
                Reflect.set(this.action, playlist.info, '加载中');
            })
            .on('canplay', _ => {
                Reflect.set(this.action, playlist.info, this.current.title);
                Reflect.set(this.action, playlist.pic, this.current.pic);

                // 播放列表
                document.querySelector(`li[data-id="${this.current.id}"]`).classList.add('focus');
            })
            .on('canplaythrough', _ => {
                if(this.player.paused) this.autoplay = false; // 自动播放为关
                else {
                    this.autoplay = true;

                    Reflect.set(this.action, playlist.status, true); // 添加进度条
                    Reflect.set(this.action, playlist.progress, 'add'); // 添加进度条

                }
            })
            .on('play', _ => {
                if(!this.autoplay) {
                    Reflect.set(this.action, playlist.progress, 'add'); // 添加进度条
                }
            })
            .on('ended', _ => {
                Reflect.get(this.action, playlist.next);
            })
            .on('error', _ => {

                Reflect.get(this.action, playlist.next);
            });
    }

    addActionEvent() { // 添加操作事件
        on('click', this.action[playlist.progress], et => { // 进度条
            const proportion = et.y / et.clientHeight;

            Reflect.set(this.action, playlist.progress, 'unset'); // 设置css为unset 才可以拖动
            Reflect.set(this.action, playlist.progress, proportion * 100); // 设置滚动条长度

            clearTimeout(this.progressTimer);
            this.progressTimer = setTimeout(_ => {
                this.player.currentTime = this.player.duration * proportion;
                Reflect.set(this.action, playlist.progress, 'add'); // 重设动画时间
            }, 160);

        }, { over: true })

        .on('click', this.action[playlist.prev], et => { //  上一首
            Reflect.get(this.action, playlist.prev);
        }, { over: true })

        .on('click', this.action[playlist.status], et => { //  继续/暂停
            if(this.player.paused) {
                Reflect.set(this.action, playlist.status, true);
                Reflect.set(this.action, playlist.progress, 'play');
            } else if (this.player.played) {
                Reflect.set(this.action, playlist.status, false);
                Reflect.set(this.action, playlist.progress, 'pause');
            }
        }, { over: true })

        .on('click', this.action[playlist.next], et => { //  下一首
            Reflect.get(this.action, playlist.next);
        }, { over: true })

        .on('click', this.action[playlist.radom], et => { // 随机
            const classList = et.querySelector('svg').classList;
            classList.toggle('focus');
            this.radom = classList.value.includes('focus');
        }, { over: true })

        .on('click', '.player-list li[data-id] .title', et => { // 播放列表
            const li = et.getParents('li');

            Reflect.set(this.action, playlist.status, li.dataset.id);
        });
        
        // 切换标签 修复进度条
        document.addEventListener('visibilitychange', _ => {
            if(!document.hidden && !this.player.paused) {
                Reflect.set(this.action, playlist.progress, 'unset'); // 设置css为unset 才可以拖动

                setTimeout(_ => {
                    const proportion = this.player.currentTime / this.player.duration;
                    Reflect.set(this.action, playlist.progress, proportion * 100); // 设置滚动条长度
                    Reflect.set(this.action, playlist.progress, 'add'); // 重设动画时间
                }, 100);
            }
        });

        this.actionloaded = true;

    }

    [playlist.proxyGet] (target, key) {
        if(!this.actionloaded) return target[key];

        switch(key) {
            case playlist.prev:
                if(!this.radom) {
                    --this.index;
                    
                    if(this.index < 0) this.index = this.list.length - 1;
                } else {
                    if(this.playedList.length > 0) {
                        this.index = this.playedList.pop();
                    }
                }

                Reflect.set(this.action, playlist.progress, 're');

                this.current = this.list[this.index].dataset;

                this.player.src = `/api/song/${this.current.id}`; // 开始加载
                break;

            case playlist.next:
                if(!this.radom) {
                    ++this.index;
                    
                    if(this.index >= this.list.length) this.index = 0;
                } else {
                    this.playedList.push(this.index); // 吧播放过的加入列表用于 prev
                    this.index = parseInt(Math.random() * (this.list.length - 1) ); // 生成随机数
                }

                Reflect.set(this.action, playlist.progress, 're');

                this.current = this.list[this.index].dataset;

                this.player.src = `/api/song/${this.current.id}`; // 开始加载

                break;
        }

        return target[key];
    }

    [playlist.proxySet] (target, key, value) {
        switch (key) {
            case playlist.progress:
                const bar = target[key].firstElementChild;

                if(typeof value === 'number') { // 拖动进度条事件
                    bar.style.height = value + '%';

                } else {
                    switch(value) {
                        case 'play':
                            bar.style.animationPlayState = 'running';
                            break;
                        
                        case 'pause':
                            bar.style.animationPlayState = 'paused';
                            break;

                        case 'add':
                            bar.style.animationDuration = (this.player.duration - this.player.currentTime) * 1000 + 'ms';
                            bar.style.animationName = 'music-bar-end';
                            break;

                        case 'unset':
                            bar.style.animationDuration = 'unset';
                            bar.style.animationName = 'unset';
                            break;

                        case 're':
                            document.querySelector(`li[data-id="${this.current.id}"]`).classList.remove('focus');

                            if(bar.attributes.getNamedItem('style'))
                                bar.attributes.removeNamedItem('style');
                            break;
                    }
                }
                break;

            case playlist.pic:
                const img = target[key].querySelector('img');

                img.src = value;
                break;

            case playlist.info:
                const title = target[key].querySelector('.title');

                title.innerText = value;
                break;

            case playlist.status:
                const [play, pause] = target[key].getElementsByClassName('icon');
                
                switch(typeof value) {
                    case 'boolean':
                        if(value) {
                            // icon
                            play.classList.add('hide');
                            pause.classList.remove('hide');
                            // music 
                            this.player.play();
                        } else {
                            // icon
                            play.classList.remove('hide');
                            pause.classList.add('hide');
                            // music
                            this.player.pause();
                        }
                        break;

                    case 'string':
                        Reflect.set(this.action, playlist.progress, 're');

                        const li = document.querySelector(`li[data-id="${value}"]`);

                        this.index = Array.from(this.list).indexOf(li);

                        this.current = li.dataset;

                        this.player.src = `/api/song/${this.current.id}`; // 开始加载
                        break;
                }
                break;
        }
    }
}