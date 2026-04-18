import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://your-api-domain.com/api';

const uploadApi = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 120秒超时，大文件需要更长时间
});

// 请求拦截器
uploadApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('user-storage');
  if (token) {
    try {
      const parsed = JSON.parse(token);
      if (parsed.state?.token) {
        config.headers.Authorization = `Bearer ${parsed.state.token}`;
      }
    } catch (e) {}
  }
  return config;
});

// 响应拦截器
uploadApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('user-storage');
    }
    return Promise.reject(error.response?.data || error);
  }
);

// 上传项目文件
export const uploadProject = (formData) => {
  return uploadApi.post('/upload/project', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// 分析项目结构
export const analyzeProject = (data) => {
  return uploadApi.post('/upload/analyze', data);
};

// AI查错
export const checkErrors = (data) => {
  return uploadApi.post('/upload/check-errors', data);
};

// AI修复错误
export const fixErrors = (data) => {
  return uploadApi.post('/upload/fix-errors', data);
};

// 创建项目（从上传）
export const createProject = (data) => {
  return uploadApi.post('/upload/create-project', data);
};

// 删除上传文件
export const deleteUpload = (data) => {
  return uploadApi.post('/upload/delete', data);
};

// 获取上传进度（通过XMLHttpRequest实现）
export const uploadWithProgress = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const response = JSON.parse(xhr.responseText);
        resolve(response);
      } catch (e) {
        reject(new Error('解析响应失败'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('上传失败'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('上传取消'));
    });

    AsyncStorage.getItem('user-storage').then((token) => {
      try {
        const parsed = JSON.parse(token);
        const authToken = parsed.state?.token;
        
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        });

        xhr.open('POST', `${BASE_URL}/upload/project`);
        if (authToken) {
          xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
        }
        xhr.send(formData);
      } catch (e) {
        reject(e);
      }
    });
  });
};

export default {
  uploadProject,
  analyzeProject,
  checkErrors,
  fixErrors,
  createProject,
  deleteUpload,
  uploadWithProgress,
};
