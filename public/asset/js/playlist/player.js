// 私有
const playlist = {
            proxyGet: Symbol('handler get'),
            proxySet: Symbol('handler set'),

            cover: Symbol(),
            name: Symbol(),
            artist: Symbol(),
            progress: Symbol(),
            progressBuff: Symbol(),
            progressFill: Symbol(),
            btnPrev: Symbol(),
            btnStatus: Symbol(),
            btnNext: Symbol()
        }


class PlayList {
    constructor() {
        this.player = document.getElementById('player');
 
        this.control = new Proxy({
            [playlist.cover]: document.querySelector('#area-header .cover'),
            [playlist.name]: document.querySelector('#control-name-artist .name'),
            [playlist.artist]: document.querySelector('#control-name-artist .artist'),
            [playlist.progress]: document.querySelector('#control-process .bar'),
            [playlist.progressBuff]: document.querySelector('#control-process .bar .buff'),
            [playlist.progressFill]: document.querySelector('#control-process .bar .fill'),
            [playlist.btnPrev]: document.querySelector('#control-btn .prev'),
            [playlist.btnStatus]: document.querySelector('#control-btn .status'),
            [playlist.btnNext]: document.querySelector('#control-btn .next'),
            writable: false
        }, {
            get: this[playlist.proxyGet].bind(this),
            set: this[playlist.proxySet].bind(this)
        });

        // this.radom = false; // 随机播放

        this.index = 0;
        this.list = new Proxy({
            play: new Array(),
            played: new Array()
        }, {
            get: (obj, prop) => {
                switch(prop) {
                    case 'current':
                        return obj['play'][this.index];
                        break;
                }
            }
        });

        this.timer = {
            buff: null,
            process: null
        }

        this.autoplay = true;
    }

    start() {
        fetch('/api/list') // 获取播放列表
            .then(response => {
                if(!response.ok) return Promise.reject()

                return response.json();
            })
            .then(json => {  // 获取成功
                this.list.play = json.fulfillmentValue;
                this.player.src = `/api/song/${this.list.current.id}`; // 开始加载

                this.addPlayEvent();
                this.addActionEvent();
            })
            .catch( _ => { // 网络错误
            });
    }

    addPlayEvent() { // 添加播放事件
        this.player
            .on('loadstart', _ => {
                Reflect.set(this.control, playlist.name, this.list.current.name);
                Reflect.set(this.control, playlist.artist, this.list.current.artist);
                Reflect.set(this.control, playlist.cover, this.list.current.picUrl);

                this.timer.buff = setInterval(_ => {
                    const buff = this.player.buffered;

                    if(buff.length) {
                        const loaded = buff.end(0) / this.list.current.duration * 100000;

                        Reflect.set(this.control, playlist.progressBuff, loaded);
                    }
                }, 100); 

                this.timer.process = setInterval(_ => {
                    Reflect.set(this.control, playlist.progress, 'time');
                }, 1000);
            })
            .on('canplay', _ => {
                if(this.player.paused) this.autoplay = false; // 自动播放为关
                else {
                    this.autoplay = true;

                    Reflect.set(this.control, playlist.status, 'play'); // 播放
                }
            })
            .on('canplaythrough', _ => {
                clearInterval(this.timer.buff);
                Reflect.set(this.control, playlist.progressBuff, 100);
            })
            .on('play', _ => {
                Reflect.set(this.control, playlist.progress, 'add'); // 添加进度条
            })
            .on('ended', _ => {
                Reflect.get(this.control, playlist.next);
            })
            .on('error', _ => {
                Reflect.get(this.control, playlist.next);
            });
    }

    addActionEvent() { // 添加操作事件
        document.body
        // .on('click', this.control[playlist.progress], et => { // 进度条
        //     // const proportion = et.y / et.clientHeight;

        //     // Reflect.set(this.control, playlist.progressFill, 'unset'); // 设置css为unset 才可以拖动
        //     // Reflect.set(this.control, playlist.progressFill, proportion * 100); // 设置滚动条长度

        //     // clearTimeout(this.progressTimer);
        //     // this.progressTimer = setTimeout(_ => {
        //     //     this.player.currentTime = this.player.duration * proportion;
        //     //     Reflect.set(this.control, playlist.progressFill, 'add'); // 重设动画时间
        //     // }, 160);

        // }, { over: true })

        .on('click', this.control[playlist.btnPrev], _ => { //  上一首
            Reflect.get(this.control, playlist.btnPrev);
        }, { over: true })

        .on('click', this.control[playlist.btnStatus], _ => { //  继续/暂停
            if(this.player.paused) {
                Reflect.set(this.control, playlist.btnStatus, 'play');
                Reflect.set(this.control, playlist.progress, 'play');
            } else if (this.player.played) {
                Reflect.set(this.control, playlist.btnStatus, 'pause');
                Reflect.set(this.control, playlist.progress, 'pause');
            }
        }, { over: true })

        .on('click', this.control[playlist.btnNext], _ => { //  下一首
            Reflect.get(this.control, playlist.btnNext);
        }, { over: true })

        // .on('click', this.control[playlist.radom], et => { // 随机
        //     const classList = et.querySelector('svg').classList;
        //     classList.toggle('focus');
        //     this.radom = classList.value.includes('focus');
        // }, { over: true });
        
        // 切换标签 修复进度条
        document.addEventListener('visibilitychange', _ => {
            if(!document.hidden && !this.player.paused) {
                Reflect.set(this.control, playlist.progress, 'unset'); // 设置css为unset 才可以拖动

                setTimeout(_ => {
                    const proportion = this.player.currentTime / this.player.duration;
                    Reflect.set(this.control, playlist.progress, proportion * 100); // 设置滚动条长度
                    Reflect.set(this.control, playlist.progress, 'add'); // 重设动画时间
                }, 100);
            }
        });

        this.controlloaded = true;

    }

    [playlist.proxyGet] (target, key) {
        if(!this.controlloaded) return target[key];

        switch(key) {
            case playlist.btnPrev:
                if(!this.radom) {
                    --this.index;
                    
                    if(this.index < 0) this.index = this.list.play.length - 1;
                } else {
                    if(this.list.played.length > 0) {
                        this.index = this.playedList.pop();
                    }
                }

                Reflect.set(this.control, playlist.progress, 're'); // 重置进度条

                this.player.src = `/api/song/${this.list.current.id}`; // 开始加载
                break;

            case playlist.btnNext:
                if(!this.radom) {
                    ++this.index;
                    
                    if(this.index >= this.list.play.length) this.index = 0;
                } else {
                    this.list.played.push(this.index); // 吧播放过的加入列表用于 prev
                    this.index = parseInt(Math.random() * (this.list.length - 1) ); // 生成随机数
                }

                Reflect.set(this.control, playlist.progress, 're'); // 重置进度条

                this.player.src = `/api/song/${this.list.current.id}`; // 开始加载

                break;
        }

        return target[key];
    }

    [playlist.proxySet] (target, key, value) {
        switch (key) {
            case playlist.progress:
                const {[playlist.progress]: bar, [playlist.progressBuff]: barBuff, [playlist.progressFill]: barFill} = this.control;

                if(typeof value === 'number') { // 拖动进度条事件
                    barFill.style.width = value + '%';
                } else {
                    switch(value) {
                        case 'time':   
                            const   played = document.querySelector('#control-process .time .played'),
                                    total = document.querySelector('#control-process .time .total');

                            const formate = milliSecond => {
                                const date = new Date();
                                date.setTime(milliSecond * 1000);

                                let minute = date.getMinutes(),
                                    second = date.getSeconds();
                                if(minute.toString().length < 2) {
                                    minute = '0' + minute;
                                }
                                if(second.toString().length < 2) {
                                    second = '0' + second;
                                }

                                return `${minute}:${second}`;
                            }

                            played.innerText = formate(this.player.currentTime);
                            total.innerText = formate(this.player.duration);
                            break;

                        case 'play':
                            barFill.style.animationPlayState = 'running';
                            break;
                        
                        case 'pause':
                            barFill.style.animationPlayState = 'paused';
                            break;

                        case 'add':
                            barFill.style.animationDuration = (this.player.duration - this.player.currentTime) * 1000 + 'ms';
                            barFill.style.animationName = 'music-bar-end';
                            break;

                        case 'unset':
                            barFill.style.animationDuration = 'unset';
                            barFill.style.animationName = 'unset';
                            break;

                        case 're':
                            barFill.attributes.removeNamedItem('style');
                            barBuff.attributes.removeNamedItem('style');
                            break;
                    }
                }
                break;

            case playlist.cover:
                const domsImg = document.createElement('img');

                domsImg.src = value;

                domsImg.onload = _ => {
                    this.control[key].prepend(domsImg);
                }
                break;

            case playlist.name:
                const domsName = document.createElement('span');
                domsName.innerText = value; 

                this.control[key].prepend(domsName);
                break;

            case playlist.artist:
                const domsArtist = document.createElement('span');
                domsArtist.innerText = value;

                this.control[key].prepend(domsArtist);
                break;

            case playlist.progressBuff:
                this.control[key].style.width = value + '%';
                break;

            case playlist.btnStatus:
                switch(value) {
                    case 'play':
                        this.control[key].classList.replace('play', 'pause');

                        this.player.play();
                        break;
                    
                    case 'pause':
                        this.control[key].classList.replace('pause', 'play');

                        this.player.pause();
                        break;
                }
                break;
        }
    }
}