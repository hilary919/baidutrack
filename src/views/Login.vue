<template>
  <div class="login">
    <div class="login-container">
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
  background: url("@/assets/images/loginbg.jpg");
  background-size: cover;
  height: 100vh;
  position: relative;

  .login-container {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: rgba(206, 231, 241, 0.5);
    border-radius: 20px;
    padding: 30px;
    font-size: 24px;
    width: 400px;
  }
}
</style>
