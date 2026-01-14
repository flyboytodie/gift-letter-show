const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// 配置中间件
app.use(cors());
app.use(express.static('public'));
app.use(express.static('../')); // 提供前端静态文件
app.use(express.json()); // 解析JSON请求

// 确保存储目录存在
const storageDirs = ['public/images', 'public/videos', 'public/audio', 'data'];
storageDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 存储展示数据
const showData = {};

// 配置Multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = 'public/images';
    if (file.mimetype.startsWith('video/')) {
      dir = 'public/videos';
    } else if (file.mimetype.startsWith('audio/')) {
      dir = 'public/audio';
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// 文件上传API
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // 构建文件URL（使用动态主机名）
  const serverHost = req.protocol + '://' + req.get('host');
  // 确保正确移除public前缀并统一使用正斜杠
  const relativePath = req.file.path
    .replace(/^public[\\/]/, '')  // 移除public前缀（支持正斜杠和反斜杠）
    .replace(/\\/g, '/');  // 将所有反斜杠替换为正斜杠
  const fileUrl = `${serverHost}/${relativePath}`;
  
  res.json({
    url: fileUrl,
    filename: req.file.filename,
    path: req.file.path
  });
});

// 健康检查API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 保存展示数据API
app.post('/api/save-show', (req, res) => {
  try {
    const data = req.body;
    // 生成唯一ID
    const showId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // 保存数据
    showData[showId] = data;
    
    // 同时保存到文件，防止服务器重启数据丢失
    const dataPath = path.join(__dirname, 'data', `${showId}.json`);
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    // 构建分享链接
    const serverHost = req.protocol + '://' + req.get('host');
    const shareUrl = `${serverHost}/show.html?id=${showId}`;
    
    res.json({
      success: true,
      showId: showId,
      shareUrl: shareUrl,
      message: '展示数据保存成功'
    });
  } catch (error) {
    console.error('保存展示数据失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '保存失败，请重试' 
    });
  }
});

// 获取展示数据API
app.get('/api/get-show', (req, res) => {
  try {
    const showId = req.query.id;
    if (!showId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少展示ID' 
      });
    }
    
    // 从内存或文件中获取数据
    let data;
    if (showData[showId]) {
      data = showData[showId];
    } else {
      // 尝试从文件加载
      const dataPath = path.join(__dirname, 'data', `${showId}.json`);
      if (fs.existsSync(dataPath)) {
        data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        showData[showId] = data; // 缓存到内存
      } else {
        return res.status(404).json({ 
          success: false, 
          error: '展示数据不存在' 
        });
      }
    }
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('获取展示数据失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取失败，请重试' 
    });
  }
});

// 保存编辑状态API
app.post('/api/save-edit', (req, res) => {
  try {
    const data = req.body;
    // 生成唯一编辑ID或使用客户端提供的ID
    const editId = data.editId || (Date.now().toString(36) + Math.random().toString(36).substr(2));
    
    // 保存编辑状态数据
    const editDataPath = path.join(__dirname, 'data', `edit_${editId}.json`);
    fs.writeFileSync(editDataPath, JSON.stringify(data, null, 2));
    
    res.json({
      success: true,
      editId: editId,
      message: '编辑状态保存成功'
    });
  } catch (error) {
    console.error('保存编辑状态失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '保存失败，请重试' 
    });
  }
});

// 加载编辑状态API
app.get('/api/load-edit', (req, res) => {
  try {
    const editId = req.query.editId;
    if (!editId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少编辑ID' 
      });
    }
    
    // 加载编辑状态数据
    const editDataPath = path.join(__dirname, 'data', `edit_${editId}.json`);
    if (fs.existsSync(editDataPath)) {
      const data = JSON.parse(fs.readFileSync(editDataPath, 'utf8'));
      res.json({
        success: true,
        data: data
      });
    } else {
      return res.status(404).json({ 
        success: false, 
        error: '编辑状态不存在' 
      });
    }
  } catch (error) {
    console.error('加载编辑状态失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '加载失败，请重试' 
    });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`File upload API: http://localhost:${PORT}/api/upload`);
  console.log(`Save show API: http://localhost:${PORT}/api/save-show`);
  console.log(`Get show API: http://localhost:${PORT}/api/get-show`);
  console.log(`Save edit API: http://localhost:${PORT}/api/save-edit`);
  console.log(`Load edit API: http://localhost:${PORT}/api/load-edit`);
});
