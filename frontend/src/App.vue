<template>
  <keep-alive>
    <router-view />
  </keep-alive>
</template>

<style>
/* 全局样式 */
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100%;
}

/* 全局过渡效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background-color: #f5f5f5;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background-color: #c0c4cc;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #909399;
}
</style> 