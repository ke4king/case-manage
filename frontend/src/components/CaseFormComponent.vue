<template>
  <el-form 
    ref="caseFormRef" 
    :model="caseForm" 
    :rules="rules" 
    label-width="100px" 
    class="case-form"
    v-loading="loading"
  >
    <!-- 基本信息部分 -->
    <el-divider content-position="left">基本信息</el-divider>
    
    <!-- 案件编号只在编辑模式下显示 -->
    <el-form-item v-if="isEdit" label="案件编号" prop="case_number">
      <el-input 
        v-model="caseForm.case_number" 
        disabled
      />
    </el-form-item>
    
    <el-form-item label="案件名称" prop="case_name">
      <el-input v-model="caseForm.case_name" placeholder="请输入案件名称" />
    </el-form-item>
    
    <el-form-item label="案件类型" prop="case_types">
      <el-select 
        v-model="caseForm.case_types" 
        multiple 
        collapse-tags 
        collapse-tags-tooltip
        placeholder="请选择案件类型"
        style="width: 100%"
      >
        <el-option 
          v-for="item in caseTypeOptions" 
          :key="item.value" 
          :label="item.label" 
          :value="item.value" 
        />
      </el-select>
    </el-form-item>
    
    <el-form-item label="平台类型" prop="platform_types">
      <el-select 
        v-model="caseForm.platform_types" 
        multiple 
        collapse-tags-tooltip
        placeholder="请选择平台类型"
        style="width: 100%"
        filterable
      >
        <el-option 
          v-for="item in platformTypeOptions" 
          :key="item.value" 
          :label="item.label" 
          :value="item.value" 
        />
      </el-select>
    </el-form-item>
    
    <el-form-item label="运营时间" prop="operation_date">
      <el-date-picker
        v-model="caseForm.operation_date"
        type="date"
        placeholder="选择运营日期"
        style="width: 100%"
        value-format="YYYY-MM-DD"
      />
    </el-form-item>
    
    <el-form-item label="客服信息" prop="customer_service">
      <el-input v-model="caseForm.customer_service" placeholder="请输入客服信息" />
    </el-form-item>
    
    <el-form-item label="其他信息" prop="other_info">
      <md-editor 
        v-model="caseForm.other_info" 
        style="height: 400px" 
        :toolbars="toolbars"
        :config="editorConfig"
        class="custom-md-editor"
        @onUploadImg="onUploadImg"
      />
    </el-form-item>
    
    <!-- 技术信息部分 -->
    <el-divider content-position="left">技术信息</el-divider>
    
    <el-form-item label="CDN信息" prop="cdn_info">
      <el-input v-model="caseForm.cdn_info" placeholder="请输入CDN信息" />
    </el-form-item>
    
    <el-form-item label="服务器所在地" prop="server_location">
      <el-cascader
        v-model="locationCascaderValue"
        :options="locationOptions"
        :props="{ 
          expandTrigger: 'click',
          checkStrictly: false,
          emitPath: true
        }"
        filterable
        style="width: 100%"
        size="default"
        placeholder="请选择服务器所在地"
        @change="handleLocationCascaderChange"
      />
      <div v-if="showLocationError" class="error-tip mt-2">
        <span class="text-danger">选择中国时，省份和城市为必填项</span>
      </div>
    </el-form-item>
    
    <el-form-item label="已获得权限" prop="permissions">
      <el-select 
        v-model="caseForm.permissions" 
        multiple 
        collapse-tags-tooltip
        placeholder="选择已获得的权限"
        style="width: 100%"
        filterable
      >
        <el-option 
          v-for="item in permissionOptions" 
          :key="item.value" 
          :label="item.label" 
          :value="item.value" 
        />
      </el-select>
    </el-form-item>
    
    <!-- 数据分析部分 -->
    <el-divider content-position="left">数据分析</el-divider>
    
    <el-form-item label="平台分析" prop="platform_analysis">
      <md-editor 
        v-model="caseForm.platform_analysis" 
        style="height: 400px" 
        :toolbars="toolbars"
        :config="editorConfig"
        class="custom-md-editor"
        @onUploadImg="onUploadImg"
      />
    </el-form-item>
    
    <el-form-item label="代理分析" prop="agent_analysis">
      <md-editor 
        v-model="caseForm.agent_analysis" 
        style="height: 400px" 
        :toolbars="toolbars"
        :config="editorConfig"
        class="custom-md-editor"
        @onUploadImg="onUploadImg"
      />
    </el-form-item>
    
    <el-form-item label="会员分析" prop="member_analysis">
      <md-editor 
        v-model="caseForm.member_analysis" 
        style="height: 400px" 
        :toolbars="toolbars"
        :config="editorConfig"
        class="custom-md-editor"
        @onUploadImg="onUploadImg"
      />
    </el-form-item>
    
    <el-form-item>
      <el-button type="primary" @click="onSubmit">{{ isEdit ? '更新案件' : '创建案件' }}</el-button>
      <el-button @click="onCancel">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, watch, onMounted, defineProps, defineEmits, computed } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { ElMessage } from 'element-plus'
import { countryList } from '@/utils/country-data'
import { provinceAndCityData, codeToText } from 'element-china-area-data'

// 定义组件属性
const props = defineProps({
  // 是否为编辑模式
  isEdit: {
    type: Boolean,
    default: false
  },
  // 初始案件数据
  initialData: {
    type: Object,
    default: () => ({})
  },
  // 是否正在加载
  loading: {
    type: Boolean,
    default: false
  }
})

// 定义事件
const emit = defineEmits(['submit', 'cancel', 'validate'])

// 表单引用
const caseFormRef = ref(null)

// 服务器位置相关数据
const selectedCountry = ref('');
const selectedProvinceCity = ref([]);
const showLocationError = ref(false);
const locationCascaderValue = ref([]);

// 构建三级级联选择器的选项，简化版本
const locationOptions = computed(() => {
  const result = [];
  
  // 添加常用国家和地区直接显示在最上层
  const commonCountries = countryList.find(group => group.label === '常用地区');
  if (commonCountries && commonCountries.options) {
    commonCountries.options.forEach(country => {
      if (country.value === 'China') {
        // 中国特殊处理，添加省市作为子选项
        result.push({
          value: country.value,
          label: country.label,
          children: provinceAndCityData
        });
      } else {
        // 其他常用国家，不需要子选项
        result.push({
          value: country.value,
          label: country.label
        });
      }
    });
  }
  
  // 添加分隔项
  result.push({
    value: 'divider',
    label: '──────────',
    disabled: true
  });
  
  // 添加所有其他国家
  const otherCountries = countryList.find(group => group.label === '所有国家和地区');
  if (otherCountries && otherCountries.options) {
    // 过滤掉已经在常用国家中出现的国家
    const commonCountryValues = commonCountries ? commonCountries.options.map(c => c.value) : [];
    const filteredOptions = otherCountries.options.filter(country => !commonCountryValues.includes(country.value));
    
    // 按照字母顺序排序
    filteredOptions.sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));
    
    filteredOptions.forEach(country => {
      if (country.value === 'China' && !result.some(item => item.value === 'China')) {
        // 中国特殊处理（如果还没添加过）
        result.push({
          value: country.value,
          label: country.label,
          children: provinceAndCityData
        });
      } else {
        // 其他国家
        result.push({
          value: country.value,
          label: country.label
        });
      }
    });
  }
  
  return result;
});

// 案件表单数据，优化版
const caseForm = ref({
  case_number: '',
  case_name: '',
  case_types: [],
  platform_types: [],
  operation_date: new Date().toISOString().split('T')[0], // 默认为今天
  customer_service: '',
  other_info: '',
  cdn_info: '',
  server_location: '',  // 简化，不再区分境内外
  permissions: [],
  platform_analysis: '',
  agent_analysis: '',
  member_analysis: ''
})

// Markdown编辑器工具栏配置
const toolbars = [
  'bold',
  'underline',
  'italic',
  '-',
  'strikeThrough',
  'title',
  'sub',
  'sup',
  'quote',
  'unorderedList',
  'orderedList',
  'task',
  '-',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  'mermaid',
  'katex',
  '-',
  'revoke',
  'next',
  'save',
  'prettier',
  '=',
  'pageFullscreen',
  'fullscreen',
  'preview',
  'htmlPreview',
  'catalog',
  'github'
]

// 上传图片处理函数
const uploadImage = async (file, callback) => {
  if (!file) {
    ElMessage.error('上传失败: 未选择图片');
    return;
  }
  
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('上传失败: 仅支持JPG、PNG、GIF和WEBP格式图片');
    return;
  }
  
  // 检查文件大小 (限制为5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    ElMessage.error('上传失败: 图片大小不能超过5MB');
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // 从localStorage获取JWT令牌
    const token = localStorage.getItem('token');
    
    // 图片上传路径
    const uploadUrl = '/api/v1/files/upload';
    
    // 请求前显示上传中提示
    const loadingMessage = ElMessage({
      message: '图片上传中...',
      type: 'info',
      duration: 0
    });
    
    // 调用后端上传接口
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    
    // 关闭loading消息
    loadingMessage.close();
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`上传失败: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    
    // 检查返回的URL
    if (!result.url) {
      throw new Error('上传成功但未返回图片URL');
    }
    
    // 获取当前页面的基础URL，确保图片URL是完整的
    const baseUrl = window.location.origin;
    
    // 使用完整的URL路径
    let imageUrl = result.url;
    
    // 如果URL是相对路径，转换为绝对路径
    if (imageUrl.startsWith('/')) {
      imageUrl = baseUrl + imageUrl;
    }
    
    console.log('上传成功，图片URL:', imageUrl);
    console.log('图片哈希值:', result.file_hash);
    
    // 使用完整的URL路径
    callback(imageUrl);
    
    // 显示成功消息，根据是否使用了已存在文件来调整消息
    if (result.message && result.message.includes('已存在')) {
      ElMessage.success('图片已存在，使用已有图片');
    } else {
      ElMessage.success('图片上传成功');
    }
  } catch (error) {
    console.error('上传图片时出错:', error);
    ElMessage.error(`上传失败: ${error.message}`);
  }
};

// 处理图片上传的事件函数，用于md-editor-v3
const onUploadImg = async (files, callback) => {
  if (!files || files.length === 0) {
    ElMessage.warning('未选择任何图片');
    return;
  }
  
  // 检查所有文件是否为图片
  const invalidFiles = files.filter(file => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return !allowedTypes.includes(file.type);
  });
  
  if (invalidFiles.length > 0) {
    ElMessage.error('批量上传失败: 存在不支持的文件类型，仅支持JPG、PNG、GIF和WEBP格式图片');
    return;
  }
  
  // 检查所有图片的大小
  const maxSize = 5 * 1024 * 1024; // 5MB
  const oversizeFiles = files.filter(file => file.size > maxSize);
  
  if (oversizeFiles.length > 0) {
    ElMessage.error(`批量上传失败: ${oversizeFiles.length}个图片超过5MB大小限制`);
    return;
  }
  
  try {
    ElMessage.info(`开始上传${files.length}张图片...`);
    
    const promises = files.map(file => {
      return new Promise((resolve, reject) => {
        uploadImage(file, url => {
          resolve(url);
        }).catch(err => {
          reject(err);
        });
      });
    });
    
    const results = await Promise.allSettled(promises);
    
    // 检查是否有失败的上传
    const failed = results.filter(r => r.status === 'rejected').length;
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    
    if (failed > 0) {
      ElMessage.warning(`${succeeded}张图片上传成功，${failed}张图片上传失败`);
    } else {
      ElMessage.success(`全部${succeeded}张图片上传成功`);
    }
    
    // 只返回成功的URL
    const urls = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);
    
    callback(urls);
  } catch (error) {
    console.error('批量上传图片时出错:', error);
    ElMessage.error(`批量上传失败: ${error.message}`);
  }
};

// 编辑器配置
const editorConfig = {
  autoDetectCode: true,
  showCodeRowNumber: true,
  editorExtensions: {
    highlight: {
      css: true,
      theme: 'github'
    },
    prettier: {
      enable: true
    },
    mermaid: {
      enable: true
    },
    katex: {
      enable: true
    }
  },
  defToolbars: toolbars,
  autoFocus: false,
  tabWidth: 4,
  scrollAuto: true
};

// 校验规则
const rules = ref({})

// 根据isEdit状态动态设置验证规则
watch(() => props.isEdit, (newIsEdit) => {
  const baseRules = {
    case_name: [
      { required: true, message: '请输入案件名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    case_types: [
      { required: true, message: '请选择案件类型', trigger: 'change' },
      { type: 'array', min: 1, message: '请至少选择一个案件类型', trigger: 'change' }
    ],
    platform_types: [
      { required: true, message: '请选择平台类型', trigger: 'change' },
      { type: 'array', min: 1, message: '请至少选择一个平台类型', trigger: 'change' }
    ],
    operation_date: [
      { required: true, message: '请选择运营日期', trigger: 'change' }
    ],
    server_location: [
      { 
        validator: (rule, value, callback) => {
          // 如果选择了中国但没有选择省份或城市
          if (selectedCountry.value === 'China' && (!selectedProvinceCity.value || selectedProvinceCity.value.length < 2)) {
            showLocationError.value = true;
            callback(new Error('选择中国时，省份和城市为必填项'));
          } else {
            showLocationError.value = false;
            callback();
          }
        }, 
        trigger: 'change' 
      }
    ]
  }

  // 编辑模式下添加案件编号验证
  if (newIsEdit) {
    baseRules.case_number = [
      { required: true, message: '案件编号不能为空', trigger: 'blur' },
      { max: 20, message: '长度不能超过20个字符', trigger: 'blur' }
    ]
  }

  rules.value = baseRules
}, { immediate: true })

// 选项数据
const caseTypeOptions = [
  { value: '赌博', label: '赌博' },
  { value: '诈骗', label: '诈骗' },
  { value: '色情', label: '色情' },
  { value: '非法集资', label: '非法集资' },
  { value: '其他', label: '其他' }
]

const platformTypeOptions = [
  { value: '网站', label: '网站' },
  { value: 'APP', label: 'APP' },
  { value: '微信小程序', label: '微信小程序' },
  { value: '公众号', label: '公众号' },
  { value: '其他', label: '其他' }
]

const permissionOptions = [
  { value: '后台', label: '后台' },
  { value: '数据库', label: '数据库' },
  { value: '服务器', label: '服务器' },
  { value: '支付通道', label: '支付通道' },
  { value: '其他', label: '其他' }
]

// 处理服务器位置变化 - 简化版
const handleServerLocationChange = () => {
  if (selectedCountry.value === 'China') {
    // 中国，使用省市结构
    if (selectedProvinceCity.value && selectedProvinceCity.value.length === 2) {
      const provinceCode = selectedProvinceCity.value[0];
      const cityCode = selectedProvinceCity.value[1];
      const provinceText = codeToText[provinceCode];
      const cityText = codeToText[cityCode];
      
      caseForm.value.server_location = JSON.stringify({
        country: 'China',
        province: provinceText,
        city: cityText
      });
      
      // 有效的地址选择，清除错误提示
      showLocationError.value = false;
    } else {
      // 中国但省市不完整，显示错误提示
      showLocationError.value = true;
      caseForm.value.server_location = '';
    }
  } else if (selectedCountry.value) {
    // 其他国家或地区 - 简化，不再区分境内外
    caseForm.value.server_location = JSON.stringify({
      country: selectedCountry.value
    });
  } else {
    // 未选择
    caseForm.value.server_location = '';
  }
};

// 处理级联选择器变化
const handleLocationCascaderChange = (value) => {
  if (!value || value.length === 0) {
    selectedCountry.value = '';
    selectedProvinceCity.value = [];
    showLocationError.value = false;
    caseForm.value.server_location = '';
    return;
  }
  
  // 设置国家值
  selectedCountry.value = value[0];
  
  // 如果是中国，需要处理省市
  if (value[0] === 'China') {
    if (value.length >= 3) {
      // 有完整的省市选择 [国家, 省, 市]
      selectedProvinceCity.value = [value[1], value[2]];
      showLocationError.value = false;
    } else {
      // 中国但没有完整选择省市
      selectedProvinceCity.value = value.slice(1);
      showLocationError.value = true;
    }
  } else {
    // 非中国，清空省市值
    selectedProvinceCity.value = [];
    showLocationError.value = false;
  }
  
  // 更新服务器位置
  handleServerLocationChange();
};

// 初始化服务器位置数据 - 简化版
const initServerLocation = (data) => {
  if (!data.server_location) return;
  
  try {
    const location = typeof data.server_location === 'string' 
      ? JSON.parse(data.server_location) 
      : data.server_location;
    
    if (location.country) {
      selectedCountry.value = location.country;
      
      // 构建级联选择器的值
      const cascaderValue = [location.country];
      
      // 如果是中国且有省市信息
      if (location.country === 'China' && location.province && location.city) {
        // 寻找省份的code
        let provinceCode = null;
        let cityCode = null;
        
        // 遍历省份找到匹配项
        for (const province of provinceAndCityData) {
          if (province.label === location.province) {
            provinceCode = province.value;
            cascaderValue.push(provinceCode);
            
            // 如果有省份，继续查找城市
            if (province.children) {
              for (const city of province.children) {
                if (city.label === location.city) {
                  cityCode = city.value;
                  cascaderValue.push(cityCode);
                  break;
                }
              }
            }
            break;
          }
        }
        
        if (provinceCode && cityCode) {
          selectedProvinceCity.value = [provinceCode, cityCode];
          locationCascaderValue.value = cascaderValue;
          showLocationError.value = false;
        } else {
          showLocationError.value = true;
        }
      } else {
        // 非中国，只设置国家
        locationCascaderValue.value = cascaderValue;
      }
    }
  } catch (e) {
    console.error('解析服务器位置信息失败:', e);
  }
};

// 监听初始数据变化
watch(() => props.initialData, (newVal) => {
  if (newVal && Object.keys(newVal).length > 0) {
    // 将初始数据赋值给表单
    Object.assign(caseForm.value, newVal)
    
    // 处理服务器位置
    initServerLocation(newVal);
  }
}, { immediate: true, deep: true })

// 表单提交 - 简化版
const onSubmit = async () => {
  if (!caseFormRef.value) return
  
  // 先检查如果选择了中国但未完成省市选择
  if (selectedCountry.value === 'China' && (!selectedProvinceCity.value || selectedProvinceCity.value.length < 2)) {
    showLocationError.value = true;
    ElMessage.error('选择中国时，省份和城市为必填项');
    return;
  }
  
  await caseFormRef.value.validate(async (valid) => {
    if (!valid) {
      emit('validate', false)
      return
    }
    
    // 准备提交数据
    const submitData = { ...caseForm.value }
    
    // 创建新案件时移除案件编号字段（由后端自动生成）
    if (!props.isEdit) {
      delete submitData.case_number
    }
    
    // 确保表单的operation_date字段已设置，这个是数据库中的实际字段名称
    if (!submitData.operation_date) {
      submitData.operation_date = new Date().toISOString().split('T')[0]
    }
    
    // 删除不应该提交给后端的字段，简化版
    const fieldsToRemove = [
      'creator_name',         // 由后端JOIN查询生成，非数据库字段
      'id',                   // ID通过URL参数传递
      'created_at',           // 创建时间，不应该被修改
      'updated_at',           // 更新时间，由后端自动生成
      'is_deleted',           // 删除标志，不应该通过更新操作修改
      'deleted_at',           // 删除时间，不应该通过更新操作修改
      'created_by'            // 创建者ID，不应该被修改
    ];
    
    // 删除所有不需要的字段
    fieldsToRemove.forEach(field => {
      delete submitData[field];
    });
    
    console.log('提交数据:', submitData);
    
    // 触发提交事件
    emit('submit', submitData)
  })
}

// 取消操作
const onCancel = () => {
  emit('cancel')
}

// 对外暴露重置表单方法
const resetForm = () => {
  if (caseFormRef.value) {
    caseFormRef.value.resetFields()
  }
}

// 对外暴露验证表单方法
const validateForm = async () => {
  if (!caseFormRef.value) return false
  return caseFormRef.value.validate()
}

// 组件挂载时处理初始数据
onMounted(() => {
  // 如果有初始数据，则填充表单
  if (props.initialData && Object.keys(props.initialData).length > 0) {
    Object.assign(caseForm.value, props.initialData)
    initServerLocation(props.initialData);
  }
})

// 暴露方法给父组件
defineExpose({
  resetForm,
  validateForm,
  caseForm
})
</script>

<style scoped>
.case-form {
  margin-top: 20px;
}

:deep(.el-divider__text) {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
}

.form-item-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}

.error-tip {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 5px;
}

.text-danger {
  color: #f56c6c;
}

/* 统一所有表单控件的高度 */
:deep(.el-input__wrapper),
:deep(.el-textarea__wrapper),
:deep(.el-select__wrapper),
:deep(.el-date-editor__wrapper) {
  --el-component-size: 32px;
}

/* 级联选择器样式 */
:deep(.el-cascader) {
  width: 100%;
}

:deep(.el-cascader .el-input__wrapper) {
  height: 32px;
  line-height: 32px;
  padding: 0 11px;
}

:deep(.el-cascader .el-input__inner) {
  height: 32px;
  line-height: 32px;
}

:deep(.el-cascader .el-input__suffix) {
  line-height: 32px;
}

/* 统一所有选择器的高度 */
:deep(.el-select .el-input__wrapper),
:deep(.el-date-editor .el-input__wrapper) {
  height: 32px;
  line-height: 32px;
}

:deep(.el-select .el-input__inner),
:deep(.el-date-editor .el-input__inner) {
  height: 32px;
  line-height: 32px;
}

/* MD编辑器样式优化 */
:deep(.custom-md-editor) {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

:deep(.md-editor-toolbar-wrapper) {
  background-color: #f5f7fa;
}

/* 编辑器工具栏样式优化 */
:deep(.md-editor-toolbar) {
  font-size: 16px !important;
  padding: 8px !important;
}

:deep(.md-editor-toolbar svg) {
  width: 20px !important;
  height: 20px !important;
}

:deep(.md-editor-toolbar button) {
  padding: 6px 8px !important;
  margin: 0 2px !important;
}

:deep(.md-editor-content) {
  font-size: 15px !important;
}

.mb-2 {
  margin-bottom: 10px;
}

.mt-2 {
  margin-top: 10px;
}
</style> 