<template>
  <div class="container">
    <el-form :inline="true" ref="form" label-width="80px">
      <el-form-item label="统计日期">
        <el-date-picker
          v-model="date"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
      <el-form-item label="url关键字">
        <el-input v-model="filterKeyword" clearable> </el-input>
      </el-form-item>
      <el-form-item>
        <MetricSelector :storage-key="metricsKey" :metrics="pageMetrics" @change="onMetricsChange" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="success" @click="exportData">导出</el-button>
      </el-form-item>
    </el-form>
    <div class="result-container">
      <ul class="result-show">
        <li v-for="(item, index) in searchItems" :key="index">
          {{ item.label }}
          <span class="count">{{ item.value }}</span>
        </li>
      </ul>
      <ul v-if="filterKeyword" class="result-show">
        <li v-for="(count, key) in filterData" v-show="count !== 0 && getMetricLabel(key)" :key="key">
          关键字{{ getMetricLabel(key) }}
          <span class="count">{{ count }}</span>
        </li>
      </ul>
      <el-table v-loading="loading" :data="tableData" style="width: 100%">
        <el-table-column type="index" label="序号" width="50"> </el-table-column>
        <el-table-column prop="url" label="页面URL"> </el-table-column>
        <el-table-column
          v-for="item in searchItems"
          :key="item.name"
          :prop="item.name"
          :label="item.label"
        >
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalNum"
        >
        </el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from "dayjs";
import store from "@/store";
import api from "@/http/api";
import { exportExcel } from "@/utils/export";
import { loadMetrics, VISITED_PAGE_METRICS } from "@/utils/metrics";
import MetricSelector from "@/components/MetricSelector.vue";
export default {
  name: "PageView",
  components: { MetricSelector },
  emits: ["updateKeyword"],
  props: {
    metricsKey: {
      type: String,
      default: 'visitedpage',
    },
    keyword: {
      type: String,
    },
  },
  data() {
    return {
      date: "",
      filterKeyword: this.keyword || "",
      pageMetrics: VISITED_PAGE_METRICS,
      searchItems: loadMetrics(this.metricsKey, VISITED_PAGE_METRICS),
      json_fields: {},
      tableData: [],
      totalNum: 0,
      currentPage: 1,
      pageSize: 20,
      params: {
        site_id: store.state.site.site_id,
        start_date: "",
        end_date: "",
        metrics: "",
        method: "visit/toppage/a",
        start_index: 0,
        max_results: 20,
      },
      filterData: {
        pv_count: 0,
        visitor_count: 0,
      },
      loading: false,
    };
  },
  created() {
    let that = this;
    // // 初始化日期
    let now = new Date();
    let nowTime = now.getTime();
    let oneDayTime = 24 * 60 * 60 * 1000;
    // 月初
    let FirstTime = new Date(nowTime - (now.getDate() - 1) * oneDayTime);
    let yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    this.date = [
      dayjs(FirstTime).format("YYYYMMDD"),
      dayjs(yesterday).format("YYYYMMDD"),
    ];

    // 初始化表格标题
    let _json = {};
    that.searchItems.forEach((item) => {
      _json[item.label] = item.name;
    });
    that.json_fields = { 页面URL: "url", ..._json };

    // 页面初始化查询
    // that.getData();
  },
  methods: {
    getMetricLabel(name) {
      const m = this.pageMetrics.find(item => item.name === name);
      return m ? m.label : '';
    },
    onMetricsChange(metrics) {
      this.searchItems = metrics.map(m => ({ ...m }));
    },
    onSearch() {
      let that = this;
      that.params.site_id = store.state.site.site_id;
      let _metrics = [];
      that.searchItems.forEach((item) => {
        _metrics.push(item.name);
      });
      that.params.metrics = _metrics.join(",");
      that.params.start_date = that.date[0];
      that.params.end_date = that.date[1];
      that.params.start_index = 0;
      that.params.max_results = that.pageSize;
      that.currentPage = 1;
      that.getData();
    },
    getData() {
      let that = this;
      that.tableData.length = 0;
      that.filterData = {
        pv_count: 0,
        visitor_count: 0,
      };
      that.loading = true;
      api.getData(that.params).then((res) => {
        if (!res) { that.loading = false; return; }
        if (res.header.desc === "success") {
          let resData = res.body.data[0].result;
          that.totalNum = resData.total;
          // 数据总览
          that.searchItems.map((item, index) => {
            return (item.value = resData.sum[0][index]);
          });
          if (that.filterKeyword) {
            if (that.params.max_results !== resData.total) {
              that.params.start_index = 0;
              that.params.max_results = resData.total;
              that.getData();
            } else {
              // 按关键词筛选
              resData.items[0].forEach((url, index) => {
                if (
                  url[0].name
                    .toLowerCase()
                    .indexOf(that.filterKeyword.toLowerCase()) !== -1
                ) {
                  let searchs = {};
                  that.searchItems.forEach((search, index2) => {
                    searchs[search.name] = resData.items[1][index][index2];
                    if (
                      ["pv_count", "visitor_count"].indexOf(search.name) !== -1
                    ) {
                      that.filterData[search.name] +=
                        resData.items[1][index][index2];
                    }
                  });
                  that.tableData.push({ url: url[0].name, ...searchs });
                }
              });
              that.loading = false;
            }
          } else {
            // 表格数据格式化
            resData.items[0].forEach((url) => {
              that.tableData.push({ url: url[0].name });
            });
            resData.items[1].forEach((item, index) => {
              that.searchItems.forEach((search, index2) => {
                that.tableData[index][search.name] = item[index2];
              });
            });
            that.loading = false;
          }
        }
      });
    },
    handleCurrentChange(num) {
      this.params.start_index = (num - 1) * this.params.max_results;
      this.getData();
    },
    handleSizeChange(size) {
      this.pageSize = size;
      this.params.max_results = size;
      this.params.start_index = 0;
      this.currentPage = 1;
      this.getData();
    },
    exportData() {
      const exportArr = this.tableData.map(row => {
        const obj = { 页面URL: row.url };
        this.searchItems.forEach(item => {
          obj[item.label] = row[item.name];
        });
        return obj;
      });
      exportExcel(exportArr, `受访页面_${this.date.join('_')}`);
    },
  },
};
</script>

<style scoped lang="less">
.result-show {
  display: flex;
  justify-content: center;
  padding: 24px 0;
  li {
    list-style: none;
    margin: 0 20px;
    font-size: 30px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    .count {
      font-weight: bold;
      color: burlywood;
    }
  }
}
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin: 24px 0 16px;
}
</style>
