//添加动作
addEventListener('load', () => {
    on_actions();
});

function on_actions() {
    on('click', '[on]', et => {
        let attrs = et.getAttribute('on').replace(/\s/g, '').split(':');
        switch(attrs[0]) {
            case 'openbox':
                document.getElementById(attrs[1]).classList.remove('hide');
                disableScroll();
                break;
            case 'closebox':
                document.getElementById(attrs[1]).classList.add('hide');
                enableScroll();
                break;
            case 'switchbox':
                if(attrs[1] === 'menu') {
                    et.nextElementSibling.classList.toggle('hide'); 

                    et.nextElementSibling.onclick = et => { // 当ul.menu 被点击 则隐藏
                        et.getParents('ul.menu').classList.add('hide');
                    }
                } else {
                    document.getElementById(attrs[1]).classList.toggle('hide');
                }
                break;

        }
    }, {
        over: true
    });
}



(function () {

    //获取ele知道什么什么
    Object.prototype.getParents = function (stop) {
        let elebox = document.querySelectorAll(stop),
            parents = [];

        this.path = this.path || (this.composedPath && this.composedPath()); // 兼容path

        if(this.path) {
            parents = Array.from(this.path);
        } else {
            let target = this;
            while (target)
            {
                target = target.parentElement;
                if(target === document.body) break;
                parents.push(target);
            }
        }

        for(let i of elebox) {
            if(parents.includes(i)) {
                return i;
            }
        }
    }

    //动态添加事件
    Object.prototype.on = function(type, ele, fun, options = {}) {
        if(typeof ele === 'function') {
            options = fun || {};
            fun = ele;
            ele = undefined;
        }

        if(!options.over) options.over = false;
        if(!options.preventDefault) options.preventDefault = false;

        (this || document).addEventListener(type, e => {
            e.path = e.path || (e.composedPath && e.composedPath()); // 兼容path

            if(options.preventDefault) e.preventDefault(); // 清楚默认事件

            const elebox = typeof ele === 'object' ? Array.of(ele) : document.querySelectorAll(ele);

            if(options.over) {
                for(let i of elebox) {
                    if(Array.from(e.path).includes(i)) {
                        Reflect.set(i, 'x', e.x);
                        Reflect.set(i, 'y', e.y);
                        return fun(i);
                    }
                }
            } else {
                if(!ele) return fun(e.target);
                
                if(Array.from(elebox).includes(e.target)) {
                    Reflect.set(e.target, 'x', e.x);
                    Reflect.set(e.target, 'y', e.y);
                    return fun(e.target);
                }
            }
            

        }, options);

        return this;
    }

    // 点击空白关闭
    Object.prototype.clickSpaceHide = function(exclude) {
        document.addEventListener('click', e => {
            if(!(e.target === this) && !e.path.includes(this) && !(e.target === exclude))
                this.classList.add('hide');
        });
    }

})()

function insertAtCursor(textArea, msg) { // 在焦点处插入文字
    const selStart = textArea.selectionStart, val = textArea.value;
    textArea.value = val.slice(0, selStart) + msg +
                        val.slice(textArea.selectionEnd);
    const endMsgPos = selStart + msg.length;
    textArea.setSelectionRange(endMsgPos, endMsgPos);
}

function gloDisFun(e) {
    e.preventDefault();
}

function disableScroll() { // 禁止滑动
    document.body.style.overflow = "hidden";
    document.addEventListener('touchmove', gloDisFun, false);
}

function enableScroll() { // 开启滑动
    document.body.style.overflow = "auto";
    document.removeEventListener('touchmove', gloDisFun, false);
}