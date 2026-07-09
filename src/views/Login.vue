<template>
  <div class="login">
    <div class="login-container">
      <h2>百度统计工具</h2>
      <el-form
        class="login-form"
        :model="form"
        :rules="rules"
        ref="loginForm"
        label-width="70px"
      >
        <el-form-item label="用户名" prop="userName">
          <el-input name="userName" autocomplete="on" v-model="form.userName" />
        </el-form-item>
        <el-form-item label="Token" prop="accessToken">
          <el-input
            type="textarea"
            :rows="2"
            name="accessToken"
            autocomplete="on"
            v-model="form.accessToken"
          />
        </el-form-item>
      </el-form>
      <div class="btn-login">
        <el-button type="primary" style="width: 120px"  @click="submitForm(loginForm)"
          >登录</el-button
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { FormInstance } from "element-plus";
import api from "@/http/api";
import { useRouter } from "vue-router";
const router = useRouter();
const form = ref({
  userName: "",
  accessToken: "",
});
const loginForm = ref<FormInstance>();
const rules = ref({
  userName: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  accessToken: [{ required: true, message: "请输入token", trigger: "blur" }],
});
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate((valid) => {
    if (valid) {
      localStorage.setItem("loginUser", JSON.stringify(form.value));
      api
        .getSiteList()
        .then((res) => {
          if (res) {
            router.push("/");
          }
        })
        .catch(() => {
          localStorage.removeItem("loginUser");
        });
    }
  });
};
</script>
<style lang="scss" scoped>
.login {
  background: url("@/assets/images/loginbg.jpg") center/cover;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  .login-container {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
    padding: 40px 36px 32px;
    width: 420px;
    h2 {
      text-align: center;
      font-size: 22px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 28px;
    }
  }
  .btn-login {
    display: flex;
    justify-content: center;
    padding-top: 8px;
  }
}
</style>
