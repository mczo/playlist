class Lazyload {
    constructor() {
        this.img_loaded = 'loaded';

        this.list_img = void(0);

        this.scroll_listen = void(0);
        
        // Intersection Observer 配置
        this.IntersectionObserver_config = { 
            root: null,
            rootMargin: '0px',
            threshold: 0,
        };
    }

    image(ele) {
        const unfilter_list_img = Array.from(document.querySelectorAll(ele));
        this.list_img = unfilter_list_img.filter(i => !Array.from(i.classList).includes(this.img_loaded)); // 过滤已加载的图片

        try { // 测试 IntersectionObserver
            const observer = this._create_observer(this._preloadImage.bind(this)); // 绑定 this

            for(let i of this.list_img) {
                observer.observe(i);
            }
        } catch(e) { // 兼容解决方案
            // 初始化
            this._listen_window_size();
            this._traditional();

            if(this.scroll_listen) {
                window.removeEventListener('scroll', this.scroll_listen); // 删除滚动事件
            } else {
                this.scroll_listen = this.throttle(this._traditional.bind(this), 500, 500);
            }
            window.addEventListener('scroll', this.scroll_listen); // 添加滚动事件
        }
    }

    dom(ele, fun) {
        const observer = this._create_observer(fun);

        observer.observe(ele);
    }
    
    _create_observer(callback) {
        let observer = new IntersectionObserver((entries, self) => { //开始观察
            for(let i of entries) {
                if(i.isIntersecting) { // 元素是否与捕获框架相交
                    callback(i.target); // 运行回调函数
                    self.unobserve(i.target); // 解除观察
                }
            }
        }, this.IntersectionObserver_config);

        return observer;
    }

    _traditional() {
        const scrollTop = document.body.scrollTop || document.documentElement.scrollTop;

        this.list_img.forEach((i, index) => {
            if(i.getBoundingClientRect().top <= this.clientHeight) {
            // if(i.offsetTop <= scrollTop + this.clientHeight && i.offsetTop + i.offsetHeight >= scrollTop) {
                this._preloadImage(i);
                delete this.list_img[index];
            }
        });
    }

    _preloadImage(et) {
        const promise = new Promise((resolve, reject) => {
            et.src = et.dataset.src;
            
            et.onload = resolve(et);
            et.onerror = reject(et);
        }).then(et => {
            et.classList.add(this.img_loaded);
        }).catch(et => {
            console.error(et, '加载失败');
        });
    }

    _listen_window_size() {
        this.clientHeight = window.innerHeight;
        window.addEventListener('resize', _ => {
            this.clientHeight = window.innerHeight;
        });
    }

    throttle(fun, delay, time) {
        let timeout,
            startTime = new Date();
    
        return _ => {
            let context = this,
                args = arguments,
                curTime = new Date();
    
            clearTimeout(timeout);
            // 如果达到了规定的触发时间间隔，触发 handler
            if (curTime - startTime >= time) {
                fun.apply(context, args);
                startTime = curTime;
                // 没达到触发间隔，重新设定定时器
            } else {
                timeout = setTimeout(fun, delay);
            }
        }
    }
}