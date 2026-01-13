// 全局变量
let gifts = [];
let currentGiftIndex = -1;
let quill = null;
let audio = null;
let audioFile = null;
let audioUrl = null;

// 服务器配置
// 从全局变量或默认值获取API URL
const SERVER_URL = window.REACT_APP_API_URL || window.location.origin;

// 上传文件到服务器
function uploadFileToServer(file) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        
        fetch(`${SERVER_URL}/api/upload`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                reject(data.error);
            } else {
                resolve(data.url);
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            reject(error);
        });
    });
}

// 初始化页面
function initPage() {
    initQuill();
    initColorPicker();
    initGiftManagement();
    initMusicPlayer();
    initGenerateButtons();
    initModals();
    initSortable();
}

// 初始化富文本编辑器
function initQuill() {
    quill = new Quill('#letter-content', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                ['blockquote', 'code-block'],
                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['clean']
            ]
        },
        placeholder: '请输入书信内容...'
    });
}

// 初始化颜色选择器
function initColorPicker() {
    const colorBtns = document.querySelectorAll('.color-btn');
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有按钮的active类
            colorBtns.forEach(b => b.classList.remove('active'));
            // 添加当前按钮的active类
            btn.classList.add('active');
            // 更改body的颜色类
            const color = btn.dataset.color;
            document.body.className = color;
        });
    });
}

// 初始化礼物管理
function initGiftManagement() {
    // 添加礼物按钮
    document.getElementById('add-gift').addEventListener('click', () => {
        currentGiftIndex = -1;
        openGiftModal();
    });
}

// 打开礼物编辑弹窗
function openGiftModal() {
    document.getElementById('gift-modal').style.display = 'block';
    // 重置表单
    document.getElementById('gift-file').value = '';
    document.getElementById('gift-note').value = '';
}

// 关闭礼物编辑弹窗
function closeGiftModal() {
    document.getElementById('gift-modal').style.display = 'none';
}

// 保存礼物
async function saveGift() {
    const fileInput = document.getElementById('gift-file');
    const noteInput = document.getElementById('gift-note');
    
    if (!fileInput.files.length) {
        alert('请选择礼物素材');
        return;
    }
    
    const file = fileInput.files[0];
    const note = noteInput.value;
    
    try {
        // 上传文件到服务器
        const url = await uploadFileToServer(file);
        
        const gift = {
            id: Date.now(),
            file: file,
            url: url,
            note: note,
            type: file.type.startsWith('image/') ? 'image' : 'video'
        };
        
        if (currentGiftIndex === -1) {
            gifts.push(gift);
        } else {
            gifts[currentGiftIndex] = gift;
        }
        
        renderGifts();
        closeGiftModal();
    } catch (error) {
        console.error('保存礼物失败:', error);
        alert('上传失败，请重试');
    }
}

// 渲染礼物列表
function renderGifts() {
    const giftGrid = document.getElementById('gift-grid');
    giftGrid.innerHTML = '';
    
    gifts.forEach((gift, index) => {
        const giftItem = document.createElement('div');
        giftItem.className = 'gift-item';
        giftItem.dataset.index = index;
        
        let mediaElement = '';
        if (gift.type === 'image') {
            mediaElement = `<img src="${gift.url}" alt="礼物图片" onclick="previewImage(${index})">`;
        } else {
            mediaElement = `<video src="${gift.url}" onclick="this.play()"></video>`;
        }
        
        giftItem.innerHTML = `
            ${mediaElement}
            <div class="gift-note">${gift.note || '无备注'}</div>
            <div class="gift-actions">
                <button onclick="editGift(${index})">编辑</button>
                <button onclick="deleteGift(${index})">删除</button>
            </div>
        `;
        
        giftGrid.appendChild(giftItem);
    });
}

// 编辑礼物
function editGift(index) {
    currentGiftIndex = index;
    const gift = gifts[index];
    document.getElementById('gift-note').value = gift.note;
    openGiftModal();
}

// 删除礼物
function deleteGift(index) {
    if (confirm('确定要删除这个礼物吗？')) {
        gifts.splice(index, 1);
        renderGifts();
    }
}

// 预览图片
function previewImage(index) {
    const gift = gifts[index];
    if (gift.type === 'image') {
        // 这里可以实现图片预览功能
        console.log('预览图片:', gift.url);
    }
}



// 初始化生成按钮
function initGenerateButtons() {
    // 预览按钮
    document.getElementById('preview-btn').addEventListener('click', function() {
        previewShowPage();
    });
    
    // 生成按钮
    document.getElementById('generate-btn').addEventListener('click', function() {
        generateShowPackage();
    });
}

// 预览展示页
function previewShowPage() {
    const previewContent = document.getElementById('preview-content');
    const siteTitle = document.getElementById('site-title').value;
    const letterTitle = document.getElementById('letter-title').value;
    const letterContent = quill.root.innerHTML;
    
    // 构建预览内容
    let html = `
        <h1>${siteTitle}</h1>
        <h2>礼物</h2>
        <div class="gift-grid">
    `;
    
    gifts.forEach(gift => {
        let mediaElement = '';
        if (gift.type === 'image') {
            mediaElement = `<img src="${gift.url}" alt="礼物图片">`;
        } else {
            mediaElement = `<video src="${gift.url}"></video>`;
        }
        
        html += `
            <div class="gift-item">
                ${mediaElement}
                <div class="gift-note">${gift.note || '无备注'}</div>
            </div>
        `;
    });
    
    html += `
        </div>
        <h2>${letterTitle}</h2>
        <div class="letter-content">${letterContent}</div>
        <div class="music-player">
            <span>背景音乐: ${audioFile ? audioFile.name : '未选择'}</span>
        </div>
    `;
    
    previewContent.innerHTML = html;
    document.getElementById('preview-modal').style.display = 'block';
}

// 生成展示包
function generateShowPackage() {
    const siteTitle = document.getElementById('site-title').value || '我的礼物';
    const letterTitle = document.getElementById('letter-title').value || '生日祝福';
    const letterContent = quill.root.innerHTML;
    
    // 创建ZIP文件
    const zip = new JSZip();
    
    // 添加show.html文件
    let showHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${siteTitle}</title>
    <link rel="stylesheet" href="css/show.css">
</head>
<body>
    <div class="container">
        <header>
            <h1 id="site-title">${siteTitle}</h1>
        </header>

        <main>
            <!-- 礼物展示 -->
            <section class="gift-section">
                <h2>礼物</h2>
                <div id="gift-grid" class="gift-grid">
    `;
    
    // 添加礼物项（使用服务器URL）
    gifts.forEach((gift, index) => {
        let mediaElement = '';
        if (gift.type === 'image') {
            mediaElement = `<img src="${gift.url}" alt="礼物图片" onclick="openImageModal(${index})">`;
        } else {
            mediaElement = `<video src="${gift.url}" onclick="this.play()"></video>`;
        }
        
        showHtml += `
            <div class="gift-item">
                ${mediaElement}
                <div class="gift-note">${gift.note || '无备注'}</div>
            </div>
        `;
    });
    
    showHtml += `
                </div>
            </section>

            <!-- 书信展示 -->
            <section class="letter-section">
                <h2 id="letter-title">${letterTitle}</h2>
                <div id="letter-content" class="letter-content">${letterContent}</div>
            </section>

            <!-- 背景音乐 -->
            <section class="music-section">
                <div id="music-player" class="music-player">
                    <button id="play-btn">播放</button>
                    <input type="range" id="volume" min="0" max="1" step="0.1" value="0.5">
                    <span>背景音乐</span>
                </div>
            </section>
        </main>

        <footer>
            <p class="save-tip">✨ 这份惊喜只为你～请点击浏览器「另存为」保存整页哦 ✨</p>
        </footer>
    </div>

    <!-- 图片预览弹窗 -->
    <div id="image-modal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeImageModal()">&times;</span>
            <img id="modal-image" src="" alt="预览图片">
            <div class="modal-nav">
                <button id="prev-btn" onclick="navigateImage(-1)">上一张</button>
                <button id="next-btn" onclick="navigateImage(1)">下一张</button>
            </div>
        </div>
    </div>

    <script src="js/show.js"></script>
</body>
</html>
    `;
    
    zip.file('show.html', showHtml);
    
    // 添加CSS文件
    fetch('css/show.css')
        .then(response => response.text())
        .then(css => {
            zip.file('css/show.css', css);
            
            // 添加JS文件
            let showJs = `
// 全局变量
let gifts = [
    ${gifts.map((gift) => {
        return `{
            type: '${gift.type}',
            url: '${gift.url}'
        }`;
    }).join(',\n    ')}
];
let currentImageIndex = 0;
let audio = null;

// 初始化页面
function initPage() {
    initMusicPlayer();
    initImageModal();
}

// 初始化音乐播放器
function initMusicPlayer() {
    ${audioUrl ? `
    audio = new Howl({
        src: ['${audioUrl}'],
        loop: true,
        volume: 0.5
    });
    ` : ''}
    
    document.getElementById('play-btn').addEventListener('click', function() {
        if (audio) {
            if (audio.playing()) {
                audio.pause();
                this.textContent = '播放';
            } else {
                audio.play();
                this.textContent = '暂停';
            }
        }
    });
    
    document.getElementById('volume').addEventListener('input', function() {
        if (audio) {
            audio.volume(parseFloat(this.value));
        }
    });
}

// 初始化图片弹窗
function initImageModal() {
    // 关闭按钮
    document.querySelector('.close').addEventListener('click', closeImageModal);
    
    // 点击弹窗外部关闭
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('image-modal');
        if (e.target === modal) {
            closeImageModal();
        }
    });
}

// 打开图片弹窗
function openImageModal(index) {
    currentImageIndex = index;
    const gift = gifts[index];
    if (gift.type === 'image') {
        document.getElementById('modal-image').src = gift.url;
        document.getElementById('image-modal').style.display = 'block';
    }
}

// 关闭图片弹窗
function closeImageModal() {
    document.getElementById('image-modal').style.display = 'none';
}

// 导航图片
function navigateImage(direction) {
    // 过滤出所有图片礼物
    const imageGifts = gifts.filter(gift => gift.type === 'image');
    if (imageGifts.length === 0) return;
    
    // 计算当前图片在图片礼物中的索引
    let currentImageGiftIndex = imageGifts.findIndex(gift => {
        return gift.url === gifts[currentImageIndex].url;
    });
    
    // 更新索引
    currentImageGiftIndex = (currentImageGiftIndex + direction + imageGifts.length) % imageGifts.length;
    
    // 找到对应的礼物索引
    const giftIndex = gifts.findIndex(gift => {
        return gift.url === imageGifts[currentImageGiftIndex].url;
    });
    
    // 打开新图片
    openImageModal(giftIndex);
}

// 页面加载完成后初始化
window.onload = initPage;
            `;
            
            zip.file('js/show.js', showJs);
            
            // 生成ZIP文件
            zip.generateAsync({ type: 'blob' })
                .then(function(blob) {
                    // 下载ZIP文件
                    saveAs(blob, `${siteTitle}.zip`);
                    
                    // 显示生成成功信息
                    document.getElementById('generate-info').innerHTML = `
                        <p style="color: green;">生成成功！请将ZIP包发送给对方，并提醒TA保存展示页。</p>
                        <p style="color: blue;">注意：展示页中的素材存储在服务器上，请确保服务器正常运行。</p>
                    `;
                })
                .catch(function(error) {
                    console.error('生成ZIP失败:', error);
                    document.getElementById('generate-info').innerHTML = `
                        <p style="color: red;">生成失败，请重试。</p>
                    `;
                });
        });
}

// 初始化弹窗
function initModals() {
    // 关闭礼物弹窗
    document.querySelector('#gift-modal .close').addEventListener('click', closeGiftModal);
    
    // 关闭预览弹窗
    document.querySelector('#preview-modal .close').addEventListener('click', function() {
        document.getElementById('preview-modal').style.display = 'none';
    });
    
    // 点击弹窗外部关闭
    window.addEventListener('click', function(e) {
        const giftModal = document.getElementById('gift-modal');
        const previewModal = document.getElementById('preview-modal');
        
        if (e.target === giftModal) {
            closeGiftModal();
        }
        
        if (e.target === previewModal) {
            previewModal.style.display = 'none';
        }
    });
    
    // 保存礼物按钮
    document.getElementById('save-gift').addEventListener('click', saveGift);
}

// 初始化拖拽排序
function initSortable() {
    const giftGrid = document.getElementById('gift-grid');
    new Sortable(giftGrid, {
        animation: 150,
        onEnd: function(evt) {
            // 重新排序礼物数组
            const draggedGift = gifts.splice(evt.oldIndex, 1)[0];
            gifts.splice(evt.newIndex, 0, draggedGift);
        }
    });
}

// 初始化音乐播放器
function initMusicPlayer() {
    // 音乐上传
    document.getElementById('music-upload').addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file && file.type === 'audio/mpeg') {
            try {
                // 上传文件到服务器
                const url = await uploadFileToServer(file);
                
                audioFile = file;
                audioUrl = url;
                document.getElementById('music-info').textContent = file.name;
                
                // 创建新的Howl实例
                if (audio) {
                    audio.unload();
                }
                
                audio = new Howl({
                    src: [url],
                    loop: true,
                    volume: 0.5
                });
            } catch (error) {
                console.error('上传音乐失败:', error);
                alert('上传失败，请重试');
            }
        } else {
            alert('请选择MP3格式的音频文件');
        }
    });
    
    // 播放/暂停按钮
    document.getElementById('play-btn').addEventListener('click', function() {
        if (audio) {
            if (audio.playing()) {
                audio.pause();
                this.textContent = '播放';
            } else {
                audio.play();
                this.textContent = '暂停';
            }
        }
    });
    
    // 音量控制
    document.getElementById('volume').addEventListener('input', function() {
        if (audio) {
            audio.volume(parseFloat(this.value));
        }
    });
}

// 页面加载完成后初始化
window.onload = initPage;
