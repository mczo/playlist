// 私有
const playlist = {
            proxyGet: Symbol('handler get'),
            proxySet: Symbol('handler set'),
            proxyDel: Symbol('handler deleteProperty'),

            cover: Symbol(),
            name: Symbol(),
            artist: Symbol(),
            progress: Symbol(),
            progressBuff: Symbol(),
            progressFill: Symbol(),
            btnPrev: Symbol(),
            btnStatus: Symbol(),
            btnNext: Symbol(),
            btnRadom: Symbol()
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
            [playlist.btnRadom]: document.querySelector('#control-name-artist .radom'),
            writable: false
        }, {
            get: this[playlist.proxyGet].bind(this),
            set: this[playlist.proxySet].bind(this),
            deleteProperty: this[playlist.proxyDel].bind(this),
        });

        this.index = 0;
        this.list = {
            play: new Array(),
            played: new Array()
        };

        this.timer = {
            buff: null,
            process: null,
            processWidth: null
        }

        this.autoplay = true;
        this.controlloaded = false;
        this.radom = false; // 随机播放
    }

    start() {
        fetch('/api/list') // 获取播放列表
            .then(response => {
                if(!response.ok) return Promise.reject()

                return response.json();
            })
            .then(json => {  // 获取成功
                this.list.play = json.fulfillmentValue;
                this.player.src = `/api/song/${this.list.play[this.index].id}`; // 开始加载

                this.addPlayEvent();
                this.addActionEvent();
            })
            .catch( _ => { // 网络错误
            });
    }

    addPlayEvent() { // 添加播放事件
        this.player
            .on('loadstart', _ => {
                Reflect.set(this.control, playlist.name, this.list.play[this.index].name);
                Reflect.set(this.control, playlist.artist, this.list.play[this.index].artist);
                Reflect.set(this.control, playlist.cover, this.list.play[this.index].picUrl);

                this.timer.buff = setInterval(_ => {
                    const buff = this.player.buffered;

                    if(buff.length) {
                        const loaded = buff.end(0) / this.list.play[this.index].duration * 100000;

                        Reflect.set(this.control, playlist.progressBuff, loaded);
                    }
                }, 100); 

                this.timer.process = setInterval(_ => {
                    Reflect.set(this.control, playlist.progress, 'time');
                }, 1000);
            })
            .on('canplay', _ => {
                this.controlloaded = true;

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

                Reflect.set(this.control, playlist.btnStatus, 'play');
            })
            .on('pause', _ => {
                Reflect.set(this.control, playlist.btnStatus, 'pause');
            })
            .on('ended', _ => {
                Reflect.deleteProperty(this.control, playlist.cover);
                Reflect.deleteProperty(this.control, playlist.name);
                Reflect.deleteProperty(this.control, playlist.artist);
                Reflect.deleteProperty(this.control, playlist.progressBuff);
                Reflect.deleteProperty(this.control, playlist.progressFill);
                Reflect.deleteProperty(this.control, playlist.btnStatus);

                Reflect.get(this.control, playlist.btnNext);
            })
            .on('error', _ => {
                this.controlloaded = false;

                Reflect.deleteProperty(this.control, playlist.cover);
                Reflect.deleteProperty(this.control, playlist.name);
                Reflect.deleteProperty(this.control, playlist.artist);
                Reflect.deleteProperty(this.control, playlist.btnStatus);

                Reflect.get(this.control, playlist.btnNext);
            });
    }

    addActionEvent() { // 添加操作事件
        document.body
        .on('click', this.control[playlist.progress], et => { // 进度条
            const proportion = (et.x - et.offsetLeft) / et.clientWidth;

            Reflect.set(this.control, playlist.progress, 'unset'); // 设置css为unset 才可以拖动
            Reflect.set(this.control, playlist.progress, proportion * 100); // 设置滚动条长度

            clearTimeout(this.timer.processWidth);
            this.timer.processWidth = setTimeout(_ => {
                this.player.currentTime = this.player.duration * proportion;
                Reflect.set(this.control, playlist.progress, 'add'); // 重设动画时间
            }, 160);

        }, { over: true })

        .on('click', this.control[playlist.btnPrev], _ => { //  上一首
            Reflect.deleteProperty(this.control, playlist.cover);
            Reflect.deleteProperty(this.control, playlist.name);
            Reflect.deleteProperty(this.control, playlist.artist);
            Reflect.deleteProperty(this.control, playlist.progressBuff);
            Reflect.deleteProperty(this.control, playlist.progressFill);
            Reflect.deleteProperty(this.control, playlist.btnStatus);

            Reflect.get(this.control, playlist.btnPrev);
        }, { over: true })

        .on('click', this.control[playlist.btnStatus], _ => { //  继续/暂停
            if(this.player.paused) {
                this.player.play();

                Reflect.set(this.control, playlist.btnStatus, 'play');
                Reflect.set(this.control, playlist.progress, 'play');
            } else if (this.player.played) {
                this.player.pause();

                Reflect.set(this.control, playlist.btnStatus, 'pause');
                Reflect.set(this.control, playlist.progress, 'pause');
            }
        }, { over: true })

        .on('click', this.control[playlist.btnNext], _ => { //  下一首
            Reflect.deleteProperty(this.control, playlist.cover);
            Reflect.deleteProperty(this.control, playlist.name);
            Reflect.deleteProperty(this.control, playlist.artist);
            Reflect.deleteProperty(this.control, playlist.progressBuff);
            Reflect.deleteProperty(this.control, playlist.progressFill);
            Reflect.deleteProperty(this.control, playlist.btnStatus);

            Reflect.get(this.control, playlist.btnNext);
        }, { over: true })

        .on('click', this.control[playlist.btnRadom], et => { // 随机
            Reflect.set(this.control, playlist.btnRadom, et);
        }, { over: true });
        
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
                        this.index = this.list.played.pop();
                    }
                }

                this.player.src = `/api/song/${this.list.play[this.index].id}`; // 开始加载

                break;

            case playlist.btnNext:
                if(!this.radom) {
                    ++this.index;
                    
                    if(this.index >= this.list.play.length) this.index = 0;
                } else {
                    this.list.played.push(this.index);
                    this.index = parseInt(Math.random() * (this.list.play.length - 1) ); // 生成随机数
                }

                this.player.src = `/api/song/${this.list.play[this.index].id}`; // 开始加载

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
                    }
                }
                break;

            case playlist.cover:
                const domsShadow = this.control[key].querySelector('.shadow');
                const domsImg = document.createElement('img');

                domsImg.src = value;

                domsImg.onload = _ => {
                    this.control[key].prepend(domsImg);
                    domsShadow.style["background-image"] = `url("${value}")`;
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

                        break;
                    
                    case 'pause':
                        this.control[key].classList.replace('pause', 'play');

                        break;
                }
                break;

            case playlist.btnRadom:
                value.classList.toggle('on');
                this.radom = value.classList.value.includes('on');
                break;
        }
    }

    [playlist.proxyDel] (target, key) {
        switch(key) {
            case playlist.cover:
                target[key].querySelector('img').remove();
                break;

            case playlist.name:
                target[key].querySelector('span').remove();
                break;
            
            case playlist.artist:
                target[key].querySelector('span').remove();
                break;
            
            case playlist.progressFill:
                if(target[key].attributes.getNamedItem('style'))
                    target[key].attributes.removeNamedItem('style');
                break;
            
            case playlist.progressBuff:
                if(target[key].attributes.getNamedItem('style'))
                    target[key].attributes.removeNamedItem('style');
                break;

            case playlist.btnStatus:
                this.control[key].classList.replace('pause', 'play');
                break;
        }
    }
}