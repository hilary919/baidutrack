import axios from "axios"
import router from '@/router'
import store from '@/store'
import { ElMessage } from "element-plus";

const instance = axios.create({
    baseURL: "/api/json/tongji/v1/ReportService/",
    withCredentials: true
})

instance.interceptors.request.use(
    config => {
        const user = localStorage.getItem("loginUser");
        if (user) {
            config.headers['Content-Type'] = 'application/json';
            config.data = JSON.stringify({
                header: {
                    ...JSON.parse(user),
                    account_type: 1
                },
                body: config.data
            })
        }
        return config
    },
    err => {
        return Promise.reject(err)
    }
)

instance.interceptors.response.use(
    response => {
        const res = response.data;
        if (response.status !== 200) {
            ElMessage({
                message: "请求失败",
                type: "error",
                duration: 5 * 1000
            });
            return null;
        }
        if (res.header.desc === "success") {
            return res;
        }
        const failureMsg = res.header.failures?.[0]?.message || "接口请求失败";
        ElMessage({
            message: failureMsg,
            type: "error",
            duration: 5 * 1000
        });
        // 登录页的校验失败不跳转，由登录页自行处理
        if (router.currentRoute.value.path !== '/login') {
            localStorage.removeItem("loginUser");
            store.commit("setSite", {});
            store.commit("initRouterMeunMessage");
            router.push("/login");
        }
        return null;
    },
    err => {
        return Promise.reject(err)
    }
)

export default instance;
