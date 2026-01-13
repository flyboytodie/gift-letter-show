const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// 配置中间件
app.use(cors());
app.use(express.static('public'));

// 确保存储目录存在
const storageDirs = ['public/images', 'public/videos', 'public/audio'];
storageDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 配置Multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = 'public/images';
    if (file.mimetype.startsWith('video/')) {
      dir = 'public/videos';
    } else if (file.mimetype === 'audio/mpeg') {
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
  const fileUrl = `${serverHost}/${req.file.path.replace('public/', '')}`;
  
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

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`File upload API: http://localhost:${PORT}/api/upload`);
});
