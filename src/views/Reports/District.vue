<template>
  <div class="container">
    <div class="query-card">
      <el-form :inline="true" ref="form" label-width="80px">
        <el-form-item label="统计日期">
          <el-date-picker
            v-model="date"
            type="daterange"
            align="center"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYYMMDD"
          >
          </el-date-picker>
        </el-form-item>
        <el-form-item label="统计维度">
          <el-radio-group v-model="viewMode" @change="onViewModeChange">
            <el-radio-button label="province">按省份</el-radio-button>
            <el-radio-button label="city">按城市</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <MetricSelector storage-key="district" :metrics="districtMetrics" @change="onMetricsChange" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="exportData">导出</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="result-card">
      <ul class="result-show">
        <li v-for="(item, index) in searchItems" :key="index">
          {{ item.label }}
          <span class="count">{{ fmtVal(item.name, item.value) }}</span>
        </li>
        <template v-for="(count, key) in filterData">
          <li v-if="count !== 0" :key="key">
            {{ key }}
            <span class="count">{{ count }}</span>
          </li>
        </template>
      </ul>
      <el-table v-loading="loading" :data="tableData" style="width: 100%">
        <el-table-column type="index" label="序号" width="50">
        </el-table-column>
        <el-table-column v-if="viewMode === 'city'" prop="province" label="省份" width="120">
        </el-table-column>
        <el-table-column prop="area" :label="viewMode === 'province' ? '省份' : '城市'">
        </el-table-column>
        <el-table-column
          v-for="item in searchItems"
          :key="item.name"
          :prop="item.name"
          :label="item.label"
        >
        </el-table-column>
      </el-table>
      <!-- <el-pagination
        @current-change="handleCurrentChange"
        :page-size="params.max_results"
        layout="prev, pager, next"
        :total="totalNum"
      >
      </el-pagination> -->
    </div>
  </div>
</template>

<script>
import dayjs from "dayjs";
import { exportExcel } from "@/utils/export";
import { loadMetrics, DISTRICT_METRICS, formatMetricValue } from "@/utils/metrics";
import store from "@/store";
import api from "@/http/api";
import MetricSelector from "@/components/MetricSelector.vue";
export default {
  name: "DistrictPage",
  components: { MetricSelector },
  data() {
    return {
      date: [],
      districtMetrics: DISTRICT_METRICS,
      searchItems: loadMetrics('district', DISTRICT_METRICS),
      tableData: [],
      totalNum: 0,
      params: {
        site_id: store.state.site.site_id,
        start_date: "",
        end_date: "",
        metrics: "pv_count,visitor_count",
        method: "visit/district/a",
        start_index: 0,
        max_results: 40,
        viewType: "",
        area: "",
      },
      filterData: {
        pv_count: 0,
        visitor_count: 0,
      },
      current: 0,
      loading: false,
      viewMode: 'province',
    };
  },
  created() {
    const firstDay = dayjs().startOf("month").format("YYYYMMDD");
    const yesterday = dayjs().subtract(1, "day").format("YYYYMMDD");
    this.date = [firstDay, yesterday];
    // 初始化表格标题
    let _json = {};
    this.searchItems.forEach((item) => {
      _json[item.label] = item.name;
    });
    this.json_fields = { 城市: "area", ..._json };
  },
  methods: {
    fmtVal(name, val) {
      return formatMetricValue(name, val);
    },
    onMetricsChange(metrics) {
      this.searchItems = metrics.map(m => ({ ...m }));
    },
    onViewModeChange() {
      this.tableData.length = 0;
      const filter = {};
      this.searchItems.forEach(m => { filter[m.name] = 0; });
      this.filterData = filter;
    },
    onSearch() {
      this.params.site_id = store.state.site.site_id;
      this.params.metrics = this.searchItems.map(m => m.name).join(',');
      this.params.start_index = 0;
      this.totalNum = 0;
      this.current = 0;
      this.tableData.length = 0;
      const filter = {};
      this.searchItems.forEach(m => { filter[m.name] = 0; });
      this.filterData = filter;
      this.getData();
    },
    getData(areaItem) {
      const that = this;
      that.params.start_date = that.date[0];
      that.params.end_date = that.date[1];
      that.loading = true;

      if (that.viewMode === 'province') {
        // 按省份：只查 visit/district/a
        that.params.method = "visit/district/a";
        that.params.viewType = "";
        that.params.area = "";
        api.getData(that.params).then((res) => {
          if (!res) { that.loading = false; return; }
          if (res.header.desc === "success") {
            let resData = res.body.data[0].result;
            that.searchItems.map((item, index) => {
              return (item.value = resData.sum[0][index]);
            });
            resData.items[0].forEach((item) => {
              that.tableData.push({ area: item[0].name || item[0].area });
            });
            resData.items[1].forEach((dataRow, index) => {
              that.searchItems.forEach((search, index2) => {
                that.tableData[index][search.name] = dataRow[index2];
              });
            });
            that.tableData = that.jsonsor(that.tableData, "pv_count");
            that.loading = false;
          }
        });
        return;
      }

      // 按城市：先查省份再递归查城市
      if (!areaItem) {
        that.params.method = "visit/district/a";
        that.params.viewType = "";
        that.params.area = "";
      } else {
        that.params.method = "visit/district/top";
        that.params.viewType = "city";
        that.params.area = areaItem.area;
      }
      api.getData(that.params).then((res) => {
        if (!res) { that.loading = false; return; }
        if (res.header.desc === "success") {
          let resData = res.body.data[0].result;
          if (!areaItem) {
            that.totalNum += resData.total;
            that.searchItems.map((item, index) => {
              return (item.value = resData.sum[0][index]);
            });
            resData.items[0].forEach((item) => {
              that.getData(item[0]);
            });
          } else {
            let len = that.tableData.length;
            resData.items[0].forEach((item) => {
              that.tableData.push({
                province: areaItem.name,
                area: item[0].name,
              });
            });
            resData.items[1].forEach((item) => {
              that.searchItems.forEach((search, index2) => {
                that.tableData[len][search.name] = item[index2];
              });
              len++;
            });
            that.current++;
            if (that.current === that.totalNum) {
              let _table = that.jsonsor(that.tableData, "pv_count");
              that.tableData = _table;
              that.loading = false;
            }
          }
        }
      });
    },
    jsonsor(arr, sortBy) {
      var getSortFun = function (sortBy) {
        var sortFun = function (a, b) {
          return a[sortBy] > b[sortBy] ? -1 : 1;
        };
        return sortFun;
      };
      var orderarr = arr.sort(getSortFun(sortBy));
      return orderarr;
    },
    handleCurrentChange(num) {
      let that = this;
      that.params.start_index = (num - 1) * that.params.max_results;
      that.getData();
    },
    exportData() {
      exportExcel(this.tableData, `访问地区TOP10_${this.date.join("_")}`);
    },
  },
};
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.query-card, .result-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  padding: 20px 24px;
}
.query-card :deep(.el-form-item) { margin-bottom: 0; }
.result-show {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 20px;
  li {
    list-style: none;
    margin: 8px 24px;
    font-size: 14px;
    color: #666;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .count {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
  }
}
:deep(.el-table) {
  --el-table-border-color: #f0f0f0;
  .el-table__header th {
    background: #fafafa;
    font-weight: 600;
    color: #333;
  }
}
</style>
