# ExportSelectionTable 跨页勾选说明

- 功能概述
  - 持久化跨页勾选，分页切换不丢失
  - 支持全选/取消全选，按筛选范围批量选择
  - 本地存储恢复，刷新后保留选择

- 使用方式
  - 传入 `dataSource` 与唯一键 `rowKey`
  - 提供 `onSelectionChange(ids)` 接收所选 ID
  - 若需跨页全选，提供 `fetchAllIds(queryParams)`
  - 可选提供 `fetchItemsByIds(ids)` 以分片拉取实体数据
  - `storageKey` 用于区分不同业务的勾选存储

- 关键点
  - 单变量存储：内部使用 `Set` 保存所选 ID
  - 跨页同步：分页加载后按 `selectedSet` 同步当前页 UI 勾选
  - 全选范围：通过 `fetchAllIds(queryParams)`获取满足筛选条件的全部 ID
  - 提交后端：从回调获得的 `ids` 直接提交

- 示例
  - 参考 `src/views/receivable-management/index.vue` 中的集成示例

- 单元测试
  - 见 `tests/useSelectionStore.spec.ts`
