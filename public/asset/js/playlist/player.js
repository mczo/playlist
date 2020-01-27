// 私有
const playlist = {
            proxyGet: Symbol('handler get'),
            proxySet: Symbol('handler set'),
            proxyDel: Symbol('handler deleteProperty'),

            root: Symbol(),
            cover: Symbol(),
            name: Symbol(),
            artist: Symbol(),
            progress: Symbol(),
            progressBuff: Symbol(),
            progressFill: Symbol(),
            btnPrev: Symbol(),
            btnStatus: Symbol(),
            btnNext: Symbol(),
            btnRadom: Symbol(),
            lyric: Symbol(),
            bottom: Symbol()
        }


class PlayList {
    constructor() {
        this.player = document.getElementById('player');
 
        this.control = new Proxy({
            [playlist.root]: document.querySelector('#area-control'),
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
            [playlist.lyric]: document.querySelector('#control-lyric'),
            [playlist.bottom]: document.querySelector('#control-bottom'),
            writable: false
        }, {
            get: this[playlist.proxyGet].bind(this),
            set: this[playlist.proxySet].bind(this),
            deleteProperty: this[playlist.proxyDel].bind(this),
        });

        this.index = 0;
        this.list = {
            play: new Array(),
            played: new Array(),
            lyric: null
        };

        this.timer = {
            buff: null,
            process: null,
            processWidth: null,
            lrc: null,
            slider: null
        }

        this.autoplay = true;
        this.controlloaded = false;
        this.radom = false; // 随机播放
        this.touch = new Object();
    }

    start() {
        this.rq('/api/list') // 获取播放列表
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

                // 缓冲进度
                this.timer.buff = setInterval(_ => {
                    const buff = this.player.buffered;

                    if(buff.length) {
                        const loaded = buff.end(0) / this.list.play[this.index].duration * 100000;

                        Reflect.set(this.control, playlist.progressBuff, loaded);
                    }
                }, 100);
            })
            .on('durationchange', _ => {
                this.timer.process = setInterval(_ => {
                    Reflect.set(this.control, playlist.progress, 'time');
                }, 1000);
            })
            .on('loadedmetadata', _ => {
                // 歌词
                this.rq('/api/lyric/' + this.list.play[this.index].id)
                    .then(json => {
                        this.list.lyric = json;

                        if(json.id == this.list.play[this.index].id) {
                            Reflect.set(this.control, playlist.lyric, undefined);
                        }
                    });
                this.timer.lrc = setInterval(_ => {
                    Reflect.get(this.control, playlist.lyric);
                }, 500);
            })
            // .on('progress', _ => {
                
            // })
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
                Reflect.deleteProperty(this.control, playlist.progress);
                Reflect.deleteProperty(this.control, playlist.progressBuff);
                Reflect.deleteProperty(this.control, playlist.progressFill);
                Reflect.deleteProperty(this.control, playlist.btnStatus);
                Reflect.deleteProperty(this.control, playlist.lyric);

                Reflect.get(this.control, playlist.btnNext);
            })
            .on('error', _ => {
                // this.controlloaded = false;

                Reflect.deleteProperty(this.control, playlist.cover);
                Reflect.deleteProperty(this.control, playlist.name);
                Reflect.deleteProperty(this.control, playlist.artist);
                Reflect.deleteProperty(this.control, playlist.btnStatus);

                Reflect.get(this.control, playlist.btnNext);
            });
    }

    addActionEvent() { // 添加操作事件
        document.body
        .on('click', this.control[playlist.progress], e => { // 进度条
            const proportion = (e.x - e.target.offsetLeft) / e.target.clientWidth;

            Reflect.set(this.control, playlist.progress, 'unset'); // 设置css为unset 才可以拖动
            Reflect.set(this.control, playlist.progress, proportion * 100); // 设置滚动条长度

            clearTimeout(this.timer.processWidth);
            this.timer.processWidth = setTimeout(_ => {
                this.player.currentTime = this.player.duration * proportion;
                Reflect.set(this.control, playlist.progress, 'add'); // 重设动画时间
            }, 160);
        }, { original: true, over: true })

        .on('click', this.control[playlist.btnPrev], _ => { //  上一首
            Reflect.deleteProperty(this.control, playlist.cover);
            Reflect.deleteProperty(this.control, playlist.name);
            Reflect.deleteProperty(this.control, playlist.artist);
            Reflect.deleteProperty(this.control, playlist.progress);
            Reflect.deleteProperty(this.control, playlist.progressBuff);
            Reflect.deleteProperty(this.control, playlist.progressFill);
            Reflect.deleteProperty(this.control, playlist.btnStatus);
            Reflect.deleteProperty(this.control, playlist.lyric);

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
            Reflect.deleteProperty(this.control, playlist.progress);
            Reflect.deleteProperty(this.control, playlist.progressBuff);
            Reflect.deleteProperty(this.control, playlist.progressFill);
            Reflect.deleteProperty(this.control, playlist.btnStatus);
            Reflect.deleteProperty(this.control, playlist.lyric);

            Reflect.get(this.control, playlist.btnNext);
        }, { over: true })

        .on('click', this.control[playlist.btnRadom], et => { // 随机
            Reflect.set(this.control, playlist.btnRadom, et);
        }, { over: true })

        .on('touchstart', this.control[playlist.root], e => {
            clearInterval(this.timer.slider);
            this.touch.movePrev = null;
            this.touch.moveStart = null;
            this.touch.multiple = 1;
            this.touch.currentHeight = 0;

            if(!this.touch.animeStatus) { // 如果还在动画 不会读取
                const   diff = this.control[playlist.bottom].getBoundingClientRect().bottom - document.documentElement.clientHeight,
                        currentHeight = parseFloat( document.documentElement.style.getPropertyValue('--header-height-less') );

                this.touch.slider = { // 开始滑动之前 获得数据
                    diff: diff,
                    nodeOpenedHeight: parseFloat( e.target.dataset.openedHeight )
                }

                if(diff < 0 || currentHeight < 0) {
                    this.touch.long = {
                        moveArea: diff || currentHeight
                    }
                } else {
                    this.touch.long = null;
                }
            }

        }, { original: true, over: true })
        .on('touchmove', this.control[playlist.root], e => {
            if(!this.touch.movePrev) {
                this.touch.movePrev = e.touches[0].clientY;
                this.touch.moveStart = e.touches[0].clientY;
            }
            let speed = this.touch.movePrev - e.touches[0].clientY;

            const   currentHeight = parseFloat( document.documentElement.style.getPropertyValue('--header-height-less') ),
                    clientHeight = document.documentElement.clientHeight,
                    bottomOffsetBottom = this.control[playlist.bottom].getBoundingClientRect().bottom;

            if(this.touch.long) {
                if(0 >= currentHeight && currentHeight >= this.touch.long.moveArea) this.touch.multiple = 1;
                else this.touch.multiple = .3;
            } else {
                if(bottomOffsetBottom < clientHeight || currentHeight < 0) this.touch.multiple = .3;
                else this.touch.multiple = 1;
            }

            speed *= this.touch.multiple; // 超过范围时减速

            this.touch.currentHeight = ( isNaN(currentHeight) ? 0 : currentHeight ) + speed;
            document.documentElement.style.setProperty('--header-height-less', this.touch.currentHeight + 'px');

            this.touch.movePrev = e.touches[0].clientY;
        }, { original: true, over: true })
        .on('touchend', this.control[playlist.root], e => {
            if(!this.touch.moveStart) return;

            let openedHeightValue, originalValue = 0;
            if( isNaN( this.touch.slider.nodeOpenedHeight ) ) {
                openedHeightValue = this.touch.slider.diff;
            } else {
                openedHeightValue = this.touch.slider.nodeOpenedHeight + this.touch.slider.diff;
            }

            if(this.touch.long) {
                openedHeightValue = this.touch.long.moveArea;

                let toggle = openedHeightValue;
                openedHeightValue = originalValue;
                originalValue = toggle;
            }

            e.target.dataset.openedHeight = openedHeightValue;

            if(this.touch.moveStart > e.changedTouches[0].clientY) { // 上拉
                if(this.touch.multiple < 1) {
                    this.anime(openedHeightValue);
                } else {
                    e.target.dataset.openedHeight = undefined;
                    this.anime(originalValue);
                }
            } else if(this.touch.moveStart < e.changedTouches[0].clientY) { // 下拉
                if(this.touch.multiple < 1) {
                    e.target.dataset.openedHeight = undefined;
                    this.anime(originalValue);
                } else {
                    this.anime(openedHeightValue);
                }
            }
        }, { original: true, over: true })
        .on('touchcancel', this.control[playlist.root], e => {
        }, { original: true, over: true })
        
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

    anime(golf) {
        this.timer.slider = setInterval(_ => {
            this.touch.animeStatus = true;

            const speed = (golf - this.touch.currentHeight) / 4;
            this.touch.currentHeight += speed;

            if(-.1 < speed && speed < .1) {
                this.touch.currentHeight = golf;
                this.touch.animeStatus = false;
                clearInterval(this.timer.slider);
            }

            document.documentElement.style.setProperty('--header-height-less', this.touch.currentHeight + 'px');
        }, 50);
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

                    if(this.list.played.length === this.list.play.length) {
                        this.list.played = new Array();
                    }

                    do {
                        this.index = parseInt(Math.random() * (this.list.play.length - 1) ); // 生成随机数
                    } while(this.index in this.list.played);
                }

                this.player.src = `/api/song/${this.list.play[this.index].id}`; // 开始加载

                break;

            case playlist.lyric:
                if(!this.list.lyric) return;

                for( const time of Object.keys(this.list.lyric.lrc).reverse() ) {
                    const nodeTernet = target[key].querySelector(`li[data-time="${time}"]`);
                    if(!nodeTernet || this.player.currentTime * 1000 < time) continue;

                    const   originalOffsetTop = target[key].querySelector('li').offsetTop,
                            terentOffsetTop = nodeTernet.offsetTop;

                    let nodeUlHeight = nodeTernet.offsetHeight;
                    if( Object.keys(this.list.lyric.tlyric).length && !nodeTernet.nextElementSibling.dataset.time ) {
                        nodeUlHeight += nodeTernet.nextElementSibling.offsetHeight;
                    }
                    
                    target[key].querySelector('.list').style.height = nodeUlHeight + 'px';
                    target[key].querySelector('ul').style.transform = `translate3d(0, ${originalOffsetTop - terentOffsetTop}px, 0)`;
                    break;
                }

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
                const domsShadow = target[key].querySelector('.shadow');
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

                const prevHeight = this.control[key].offsetHeight;

                this.control[key].prepend(domsName);

                if(this.control[key].offsetHeight > prevHeight) {
                    this.control[key].classList.add('rows');
                }
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
                this.radom = value.classList.contains('on');
                break;

            case playlist.lyric:
                const nodeList = target[key].querySelector('.list');
                const nodeUl = document.createElement('ul');
                
                for( const [lrcTime, lrcParagraph] of Object.entries(this.list.lyric.lrc) ) {
                    const lrcNode = document.createElement('li');
                    lrcNode.innerText = lrcParagraph;
                    lrcNode.dataset.time = lrcTime;

                    let tlyricNode = null;
                    for(const [tlyricTime, tlyricParagraph] of Object.entries(this.list.lyric.tlyric) ) {
                        if(lrcTime !== tlyricTime) continue;

                        tlyricNode = document.createElement('li');                  
                        tlyricNode.innerText = tlyricParagraph;

                        break;
                    }

                    nodeUl.append(lrcNode);
                    if(tlyricNode) nodeUl.append(tlyricNode);
                }

                nodeList.prepend(nodeUl);

                const nodeLi1 = nodeList.querySelector('li');
                let nodeUlHeight = nodeLi1.offsetHeight;
                if( Object.keys(this.list.lyric.tlyric).length && !nodeLi1.nextElementSibling.dataset.time ) {
                    nodeUlHeight += nodeLi1.nextElementSibling.offsetHeight;
                }
                nodeList.style.height = nodeUlHeight + 'px';

                break;
        }
    }

    [playlist.proxyDel] (target, key) {
        switch(key) {
            case playlist.cover:
                if(target[key].querySelector('img'))
                    target[key].querySelector('img').remove();

                if(target[key].querySelector('.shadow').attributes.getNamedItem('style'))
                    target[key].querySelector('.shadow').attributes.removeNamedItem('style');
                break;

            case playlist.name:
                this.control[key].classList.remove('rows');
                target[key].querySelector('span').remove();
                break;
            
            case playlist.artist:
                target[key].querySelector('span').remove();
                break;

            case playlist.progress:
                document.querySelector('#control-process .time .played').innerText = '00:00';
                document.querySelector('#control-process .time .total').innerText = '00:00';
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

            case playlist.lyric:
                clearInterval(this.timer.lrc);
                this.list.lyric = null;
                if(target[key].querySelector('.list').attributes.getNamedItem('style'))
                    target[key].querySelector('.list').attributes.removeNamedItem('style');
                if(target[key].querySelector('ul'))
                    target[key].querySelector('ul').remove();
                break;
        }
    }

    rq(url) {
        return fetch(url) // 获取播放列表
            .then(response => {
                if(!response.ok) return Promise.reject()

                return response.json();
            });
    }
}