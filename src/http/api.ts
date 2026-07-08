import request from './request'

export default {
    getSiteList: () => {
        return request({
            url: 'getSiteList',
            method: 'post'
        });
    },
    getData: (data: any) => {
        return request({
            url: 'getData',
            method: 'post',
            data
        });
    }
}