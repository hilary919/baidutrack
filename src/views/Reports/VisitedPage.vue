<template>
  <PageView metrics-key="visitedpage" :keyword="keyword" @updateKeyword="updateKeyword" />
</template>

<script>
import PageView from "@/components/PageView";
export default {
  name: "VisitedPage",
  components: { PageView },
  data() {
    return { keyword: "" };
  },
  methods: {
    updateKeyword(keyword) {
      this.keyword = keyword;
    },
  },
};
</script>
