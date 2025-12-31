# 服务端导出使用说明

## 技术方案

- 使用 `exceljs` 生成 XLSX 文件，支持样式、流式写入
- 使用内置 CSV 写入生成 `text/csv` 文件，兼容 Excel 2010+

## 路由

- `GET /api/v1/report/export/:type?ids[]=...`：按类型导出（当前支持 `receivable`）
- 需携带 `Authorization: Bearer <token>`

## 使用示例

### XLSX 导出（通用配置）

请求：

```
GET /api/v1/report/export/receivable?ids[]=ID1&ids[]=ID2
```

控制器调用：

```ts
await exportService.exportByEntityWithConfig(
  'receivable',
  ids,
  {
    fields: [
      { key: 'outboundDate', title: '出货日期' },
      { key: 'outboundNo', title: '货单号' },
      { key: 'customer', title: '客户' },
      { key: 'outboundOrder.weightKg', title: '重量(kg)' },
      { key: 'receivableAmount', title: '应收金额(元)' },
    ],
    sheetName: 'Sheet1',
    style: { headerBgColor: 'FFEFEFEF', fontFamily: 'Microsoft YaHei' },
  },
  'xlsx',
  res,
  '应收导出.xlsx',
);
```

### CSV 导出（通用配置）

```ts
await exportService.exportByEntityWithConfig(
  'receivable',
  ids,
  {
    fields: [
      { key: 'outboundDate', title: '出货日期' },
      { key: 'outboundNo', title: '货单号' },
      { key: 'customer', title: '客户' },
      { key: 'receivableAmount', title: '应收金额(元)' },
    ],
  },
  'csv',
  res,
  'receivable.csv',
);
```

## 性能建议

- 大数据量使用 `WorkbookWriter` 流式写入，避免内存峰值
- 查询按批次处理（500/1000），减少单次 I/O 压力
- 列宽计算基于内容长度，限制最大宽度，降低 Excel 渲染时间
- 对数值和日期设置格式，避免字符串导致的 Excel 运算性能问题
