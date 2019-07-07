const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const terser = require('terser');

module.exports = class {
    constructor(folderPath) {
        this.folderPath = folderPath;

        this.development_environment = false;
        if(process.argv.includes('--dev')) {
            this.development_environment = true;
        }
    }

    createFolder(folder) {
        folder = path.normalize(folder);
        if(!fs.existsSync(path.dirname(folder)))
            this.createFolder(path.dirname(folder));

        try {
            fs.accessSync(folder);
        } catch (e) {
            fs.mkdirSync(folder);
        }
    }

    read(url) {
        return new Promise(((resolve, reject) => {
            fs.readFile(url, { encoding: 'utf8' },  (err, data) => {
                if(err) reject(err);
                resolve(data);
            })
        }))
    }

    reads(...urls) {
        const promises = urls.map(url => this.read(url));

        return Promise.all(promises);
    }

    mergecss(...urls) {
        if(!this.development_environment && this.cssData) {
            return new Promise(resolve => resolve(this.cssData));
        }

        return this.reads(...urls.map(url => path.join(this.folderPath, 'css', url + '.css') ))
            .then(data => {  // 获取css
                let mergeData = '';
                for(let i of data) {
                    mergeData += i;
                }
                return mergeData;
            })
            .then(data => {
                const {
                    styles,
                    errors
                } = new CleanCSS(global.config.CSS).minify(data);

                const [error] = errors;

                if (error) 
                    return Promise.reject(error);

                this.cssData =  '<style>' + styles + '</style>';

                return this.cssData;
            });
    }

    mergejs(...urls) {
        if(!this.development_environment && this.jsData) {
            return new Promise(resolve => resolve(this.jsData));
        }

        return this.reads(...urls.map(url => path.join(this.folderPath, 'js', url + '.js') ))
            .then(data => {  // 获取js
                let mergeData = '';
                for(let i of data) {
                    mergeData += i;
                }
                return mergeData;
            })
            .then(data => {
                const {
                    code,
                    error
                } = terser.minify(data, global.config.JS);

                if(error)
                    return Promise.reject(error);

                this.jsData =  '<script defer>' + data + '</script>';

                return this.jsData;
            });
    }
}