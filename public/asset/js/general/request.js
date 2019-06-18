class Requests {
    returnType(response) {
        let type = response.headers.get('Content-Type').split(";")[0];
        switch(type) {
            case 'text/html':  
                return response.text();  
                break;  
            case 'application/json':  
                return response.json();  
                break;  
            default:
                return response;
        }
    }

    get(url) {
        let _Init = {
            method: 'GET', 
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'include',
        }

        const _Request = new Request(url, _Init);

        return fetch(_Request)
                .then(response => {
                    if(response.ok) {
                        return this.returnType(response);
                    }
                    return Promise.reject(this.returnType(response));
                });
    }

    post(url, body) {
        let _Init = {
            method: 'POST', 
            mode: 'cors',
            body: body,
            cache: 'no-cache',
            credentials: 'include',
        }

        const _Request = new Request(url, _Init);

        return fetch(_Request)
                .then(response => {
                    if(response.ok) {
                        return this.returnType(response);
                    }
                    
                    return Promise.reject(this.returnType(response));
                })
    }

    del(url, body) {
        let _Init = {
            method: 'DELETE', 
            mode: 'cors',
            body: body,
            cache: 'no-cache',
            credentials: 'include',
        }

        const _Request = new Request(url, _Init);

        return fetch(_Request)
                .then(response => {
                    if(response.ok) {
                        return this.returnType(response);
                    }
                    return Promise.reject('请求错误')
                })
    }

    put(url, body) {
        let _Init = {
            method: 'PUT', 
            mode: 'cors',
            body: body,
            cache: 'no-cache',
            credentials: 'include',
        }

        const _Request = new Request(url, _Init);

        return fetch(_Request)
                .then(response => {
                    if(response.ok) {
                        return this.returnType(response);
                    }
                    return Promise.reject('请求错误')
                })
    }
}