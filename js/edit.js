// 全局变量
let gifts = [];
let currentGiftIndex = -1;
let quill = null;
let audio = null;
let audioFile = null;
let audioUrl = null;
let cropper = null;
let currentFile = null;
let editId = null; // 编辑状态ID

// 服务器配置
// 服务器地址
const SERVER_URL = 'http://localhost:3000';

// 从localStorage加载数据
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('giftLetterData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            gifts = data.gifts || [];
            audioUrl = data.audioUrl || null;
            
            // 更新音乐播放器UI状态
            if (audioUrl) {
                // 优先使用保存的原始文件名
                const fileName = data.audioName || (() => {
                    // 从URL中提取文件名作为备用
                    const urlParts = audioUrl.split('/');
                    return urlParts[urlParts.length - 1];
                })();
                document.getElementById('music-info').textContent = fileName;
                
                // 更新音乐文件名显示元素
                const musicFilenameElement = document.getElementById('music-filename');
                if (musicFilenameElement) {
                    musicFilenameElement.textContent = fileName;
                    musicFilenameElement.style.color = '#666';
                }
                
                // 创建Howl实例
                if (audio) {
                    audio.unload();
                }
                audio = new Howl({
                    src: [audioUrl],
                    loop: true,
                    volume: parseFloat(document.getElementById('volume').value)
                });
            } else {
                document.getElementById('music-info').textContent = '未选择';
                
                // 清空音乐文件名显示元素
                const musicFilenameElement = document.getElementById('music-filename');
                if (musicFilenameElement) {
                    musicFilenameElement.textContent = '未选择';
                    musicFilenameElement.style.color = '#666';
                }
            }
            
            // 恢复主题色
            if (data.theme) {
                document.body.classList.remove('pink', 'white', 'blue');
                document.body.classList.add(data.theme);
                
                // 更新颜色按钮状态
                const colorBtns = document.querySelectorAll('.color-btn');
                colorBtns.forEach(btn => {
                    if (btn.dataset.color === data.theme) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }
            
            // 恢复标题
            if (data.siteTitle) {
                document.getElementById('site-title').value = data.siteTitle;
            }
            if (data.letterTitle) {
                document.getElementById('letter-title').value = data.letterTitle;
            }
            // 恢复书信内容
            if (data.letterContent && quill) {
                quill.root.innerHTML = data.letterContent;
            }
            // 恢复礼物列表
            renderGifts();
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    }
}

// 保存数据到localStorage
function saveToLocalStorage() {
    // 获取当前主题色
    const currentTheme = document.body.classList.contains('pink') ? 'pink' : 
                        document.body.classList.contains('white') ? 'white' : 'blue';
    
    const data = {
        gifts: gifts,
        audioUrl: audioUrl,
        audioName: audioFile ? audioFile.name : null,
        siteTitle: document.getElementById('site-title').value,
        letterTitle: document.getElementById('letter-title').value,
        letterContent: quill ? quill.root.innerHTML : '',
        theme: currentTheme
    };
    localStorage.setItem('giftLetterData', JSON.stringify(data));
    console.log('数据已保存到本地存储');
}

// 保存编辑状态到后端
async function saveEditState() {
    try {
        // 获取当前主题色
        const currentTheme = document.body.classList.contains('pink') ? 'pink' : 
                            document.body.classList.contains('white') ? 'white' : 'blue';
        
        const data = {
            editId: editId,
            gifts: gifts,
            audioUrl: audioUrl,
            audioName: audioFile ? audioFile.name : null,
            siteTitle: document.getElementById('site-title').value,
            letterTitle: document.getElementById('letter-title').value,
            letterContent: quill ? quill.root.innerHTML : '',
            theme: currentTheme
        };
        
        const response = await fetch(`${SERVER_URL}/api/save-edit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (result.success) {
            editId = result.editId;
            console.log('编辑状态已保存到后端');
            showSaveStatus('💾 编辑状态保存成功啦～');

            // 更新当前编辑ID显示
            updateCurrentEditId();
            return result.editId;
        }
    } catch (error) {
        console.error('保存编辑状态失败:', error);
    }
    return null;
}

// 显示保存状态
function showSaveStatus(message) {
    // 创建或获取保存状态元素
    let saveStatus = document.getElementById('save-status');
    if (!saveStatus) {
        saveStatus = document.createElement('div');
        saveStatus.id = 'save-status';
        saveStatus.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateY(-20px);
        `;
        document.body.appendChild(saveStatus);
    }
    
    // 设置消息并显示
    saveStatus.textContent = message;
    saveStatus.style.opacity = '1';
    saveStatus.style.transform = 'translateY(0)';
    
    // 3秒后隐藏
    setTimeout(() => {
        saveStatus.style.opacity = '0';
        saveStatus.style.transform = 'translateY(-20px)';
    }, 3000);
}

// 从后端加载编辑状态
async function loadEditState(loadEditId) {
    try {
        const response = await fetch(`${SERVER_URL}/api/load-edit?editId=${loadEditId}`);
        const result = await response.json();
        if (result.success) {
            const data = result.data;
            editId = data.editId;
            gifts = data.gifts || [];
            audioUrl = data.audioUrl || null;
            
            // 更新音乐播放器UI状态
            if (audioUrl) {
                // 优先使用保存的原始文件名
                const fileName = data.audioName || (() => {
                    // 从URL中提取文件名作为备用
                    const urlParts = audioUrl.split('/');
                    return urlParts[urlParts.length - 1];
                })();
                document.getElementById('music-info').textContent = fileName;
                
                // 更新音乐文件名显示元素
                const musicFilenameElement = document.getElementById('music-filename');
                if (musicFilenameElement) {
                    musicFilenameElement.textContent = fileName;
                    musicFilenameElement.style.color = '#666';
                }
                
                // 创建Howl实例
                if (audio) {
                    audio.unload();
                }
                audio = new Howl({
                    src: [audioUrl],
                    loop: true,
                    volume: parseFloat(document.getElementById('volume').value)
                });
            } else {
                document.getElementById('music-info').textContent = '未选择';
                
                // 清空音乐文件名显示元素
                const musicFilenameElement = document.getElementById('music-filename');
                if (musicFilenameElement) {
                    musicFilenameElement.textContent = '未选择';
                    musicFilenameElement.style.color = '#666';
                }
            }
            
            // 恢复主题色
            if (data.theme) {
                document.body.classList.remove('pink', 'white', 'blue');
                document.body.classList.add(data.theme);
                
                // 更新颜色按钮状态
                const colorBtns = document.querySelectorAll('.color-btn');
                colorBtns.forEach(btn => {
                    if (btn.dataset.color === data.theme) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }
            
            // 恢复标题
            if (data.siteTitle) {
                document.getElementById('site-title').value = data.siteTitle;
            }
            if (data.letterTitle) {
                document.getElementById('letter-title').value = data.letterTitle;
            }
            // 恢复书信内容
            if (data.letterContent && quill) {
                quill.root.innerHTML = data.letterContent;
            }
            // 恢复礼物列表
            renderGifts();
            
            showSaveStatus('🔄 编辑状态恢复成功啦～');

            return true;
        }
    } catch (error) {
        console.error('加载编辑状态失败:', error);
        showSaveStatus('加载编辑状态失败');
    }
    return false;
}

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

// 初始化字体选择器
function initFontSelector() {
    const fontSelect = document.getElementById('font-select');
    const fontPreview = document.getElementById('font-preview');
    
    if (fontSelect && fontPreview) {
        // 字体选择事件
        fontSelect.addEventListener('change', function() {
            const selectedFont = this.value;
            
            // 更新预览区域字体
            fontPreview.style.fontFamily = selectedFont;
            
            // 更新页面全局字体
            document.body.style.fontFamily = selectedFont;
            
            // 更新Quill编辑器字体
            if (quill) {
                const editor = document.querySelector('.ql-editor');
                if (editor) {
                    editor.style.fontFamily = selectedFont;
                }
            }
            
            // 更新礼物备注字体
            const giftNotes = document.querySelectorAll('.gift-note');
            giftNotes.forEach(note => {
                note.style.fontFamily = selectedFont;
            });
            
            console.log('字体已更新为:', selectedFont);
        });
        
        // 初始化预览字体
        fontPreview.style.fontFamily = fontSelect.value;
    }
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
    initFontSelector();
    
    // 清理可能存在的事件监听器
    const giftGrid = document.getElementById('gift-grid');
    giftGrid.innerHTML = giftGrid.innerHTML;
    
    // 检查URL参数中是否有editId
    const urlParams = new URLSearchParams(window.location.search);
    const urlEditId = urlParams.get('editId');
    if (urlEditId) {
        // 延迟加载编辑状态，确保页面元素已初始化
        setTimeout(() => {
            loadEditState(urlEditId);
        }, 500);
    } else {
        // 从localStorage加载数据
        loadFromLocalStorage();
    }
    
    // 初始化表情掉落动画
    initEmojiRain();
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
        placeholder: '请输入书信内容...',
        // 设置默认字体
        formats: ['font', 'size', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block', 'header', 'list', 'bullet', 'indent', 'link', 'image', 'color', 'background', 'align'],
        defaultFont: 'Comic Neue'
    });
    
    // 确保编辑器内容使用可爱字体
    quill.on('editor-change', function() {
        const editor = document.querySelector('.ql-editor');
        if (editor) {
            editor.style.fontFamily = "'Comic Neue', 'Nunito', 'Microsoft YaHei', Arial, sans-serif";
            editor.style.fontSize = '18px';
        }
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
    // 重置文件输入
    document.getElementById('gift-file').value = '';
    
    // 如果是添加新礼物，清空备注并隐藏媒体预览
    if (currentGiftIndex === -1) {
        document.getElementById('gift-note').value = '';
        const currentMediaPreview = document.getElementById('current-media-preview');
        const mediaPreviewContent = document.getElementById('media-preview-content');
        currentMediaPreview.style.display = 'none';
        mediaPreviewContent.innerHTML = '';
    }
}

// 关闭礼物编辑弹窗
function closeGiftModal() {
    document.getElementById('gift-modal').style.display = 'none';
}

// 处理文件选择，添加裁剪步骤
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    currentFile = file;
    
    if (file.type.startsWith('image/')) {
        // 图片需要裁剪
        openCropModal(file);
    } else {
        // 视频直接上传
        saveGiftWithFile(file);
    }
}

// 打开裁剪弹窗
function openCropModal(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.getElementById('crop-image');
        img.src = e.target.result;
        
        // 初始化裁剪器
        if (cropper) {
            cropper.destroy();
        }
        
        cropper = new Cropper(img, {
            aspectRatio: 1, // 1:1比例
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.8, // 默认裁剪区域大小
            cropBoxMovable: true,
            cropBoxResizable: true
        });
        
        // 显示裁剪弹窗
        document.getElementById('crop-modal').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// 关闭裁剪弹窗
function closeCropModal() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    document.getElementById('crop-modal').style.display = 'none';
    currentFile = null;
}

// 全局变量：存储裁剪后的文件
let croppedFile = null;
// 全局变量：跟踪添加礼物的状态
let isAddingGift = false;

// 确认裁剪
async function confirmCrop() {
    if (!cropper || isAddingGift) return;
    
    try {
        console.log('开始裁剪图片');
        // 设置添加礼物状态
        isAddingGift = true;
        
        // 获取裁剪后的图片
        const canvas = cropper.getCroppedCanvas({
            width: 800,
            height: 800,
            fillColor: '#fff',
            imageSmoothingEnabled: true
        });
        
        // 将canvas转换为blob
        canvas.toBlob(function(blob) {
            console.log('裁剪完成，创建文件对象');
            // 创建新的File对象
            croppedFile = new File([blob], currentFile.name, {
                type: currentFile.type,
                lastModified: Date.now()
            });
            
            console.log('关闭裁剪弹窗');
            // 关闭裁剪弹窗，返回礼物编辑弹窗
            closeCropModal();
            
            console.log('显示提示信息');
            // 显示提示信息，让用户填写备注
            alert('✂️ 裁剪完成啦～请填写礼物备注后点击保存哦 🎁');

            
            console.log('裁剪流程完成，礼物编辑弹窗应该仍然打开');
            
            // 重置添加礼物状态
            isAddingGift = false;
        }, currentFile.type);
    } catch (error) {
        console.error('裁剪失败:', error);
        alert('😢 裁剪失败了～请再试一次吧 💪');

        // 重置添加礼物状态
        isAddingGift = false;
    }
}

// 保存礼物（带文件参数）
async function saveGiftWithFile(file) {
    if (isAddingGift) return;
    
    const noteInput = document.getElementById('gift-note');
    const note = noteInput.value;
    
    try {
        console.log('开始上传文件:', file.name);
        // 设置添加礼物状态
        isAddingGift = true;
        
        // 上传文件到服务器
        const url = await uploadFileToServer(file);
        console.log('文件上传成功，URL:', url);
        
        let gift;
        if (currentGiftIndex === -1) {
            // 添加新礼物
            gift = {
                id: Date.now(),
                file: file,
                url: url,
                note: note,
                type: file.type.startsWith('image/') ? 'image' : 'video'
            };
            gifts.push(gift);
            console.log('新礼物添加成功:', gift.id);
        } else {
            // 编辑现有礼物，保留原始ID
            gift = gifts[currentGiftIndex];
            gift.file = file;
            gift.url = url;
            gift.note = note;
            gift.type = file.type.startsWith('image/') ? 'image' : 'video';
            // 保留原始ID
            console.log('礼物编辑成功:', gift.id);
        }
        
        // 重新渲染礼物列表
        renderGifts();
        // 关闭弹窗
        closeGiftModal();
        // 保存到本地存储
        saveToLocalStorage();
        // 显示保存成功提示
        showSaveStatus('🎉 礼物保存成功啦～');

        console.log('礼物保存完成');
    } catch (error) {
        console.error('保存礼物失败:', error);
        console.error('错误详情:', error.message);
        // 显示更详细的错误信息
        alert('😢 上传失败了～请再试一次吧 💪\n\n错误信息: ' + error.message);

    } finally {
        // 重置添加礼物状态
        isAddingGift = false;
        // 重置裁剪文件
        croppedFile = null;
    }
}

// 保存礼物
function saveGift() {
    if (isAddingGift) {
        alert('⏰ 礼物正在添加中，请稍候哦～ 🎀');
        return;
    }

    
    const fileInput = document.getElementById('gift-file');
    const noteInput = document.getElementById('gift-note');
    const note = noteInput.value;
    
    console.log('开始保存礼物');
    console.log('currentGiftIndex:', currentGiftIndex);
    console.log('fileInput.files.length:', fileInput.files.length);
    console.log('croppedFile:', croppedFile);
    console.log('note:', note);
    
    // 如果是编辑现有礼物且没有选择新文件，只更新备注
    if (currentGiftIndex !== -1 && !fileInput.files.length && !croppedFile) {
        console.log('编辑现有礼物，只更新备注');
        const gift = gifts[currentGiftIndex];
        // 更新备注
        gift.note = note;
        // 重新渲染礼物列表
        renderGifts();
        // 关闭弹窗
        closeGiftModal();
        // 保存到本地存储
        saveToLocalStorage();
        // 显示保存成功提示
        showSaveStatus('📝 礼物备注更新成功啦～');

        return;
    }
    
    // 检查是否有裁剪后的文件
    if (croppedFile) {
        console.log('使用裁剪后的文件保存礼物');
        // 使用裁剪后的文件
        saveGiftWithFile(croppedFile);
    } else if (fileInput.files.length) {
        console.log('处理用户选择的文件');
        // 处理文件选择
        handleFileSelect({ target: fileInput });
    } else {
        console.log('没有选择文件');
        alert('🎁 请先选择礼物素材哦～');
        return;

    }
}

// 渲染礼物列表
function renderGifts() {
    const giftGrid = document.getElementById('gift-grid');
    giftGrid.innerHTML = '';
    
    gifts.forEach((gift, index) => {
        const giftItem = document.createElement('div');
        giftItem.className = 'gift-item';
        
        let mediaElement = '';
        if (gift.type === 'image') {
            mediaElement = `<img src="${gift.url}" alt="礼物图片" class="gift-media">
            <button onclick="previewImage(${index})" class="preview-btn">预览</button>`;
        } else {
            mediaElement = `<video src="${gift.url}" class="gift-media">
            <button onclick="this.previousElementSibling.play()" class="preview-btn">播放</button>`;
        }
        
        giftItem.innerHTML = `
            <div class="gift-media-container">
                ${mediaElement}
            </div>
            <div class="gift-note">${gift.note || '无备注'}</div>
            <div class="gift-actions">
                <button onclick="editGift(${index})" class="edit-btn">编辑</button>
                <button onclick="confirmAndDelete(${index})" class="delete-btn">删除</button>
            </div>
        `;
        
        giftGrid.appendChild(giftItem);
    });
}

// 添加一次性事件监听器
function addSingleEventListeners() {
    const giftGrid = document.getElementById('gift-grid');
    
    // 点击媒体文件
    giftGrid.addEventListener('click', function(e) {
        if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
            const giftItem = e.target.closest('.gift-item');
            const deleteBtn = giftItem.querySelector('.delete-btn');
            const index = parseInt(deleteBtn.dataset.index);
            if (!isNaN(index)) {
                if (e.target.tagName === 'IMG') {
                    previewImage(index);
                } else if (e.target.tagName === 'VIDEO') {
                    e.target.play();
                }
            }
        }
    });
    
    // 点击编辑按钮
    giftGrid.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-btn')) {
            e.stopPropagation();
            const index = parseInt(e.target.dataset.index);
            if (!isNaN(index)) {
                editGift(index);
            }
        }
    });
    

}

// 直接删除礼物
function confirmAndDelete(index) {
    console.log('删除按钮被点击，索引:', index);
    console.log('当前gifts数组长度:', gifts.length);
    
    // 直接执行删除操作，不弹出确认框
    if (index >= 0 && index < gifts.length) {
        // 执行删除
        gifts.splice(index, 1);
        console.log('删除后gifts数组长度:', gifts.length);
        // 重新渲染
        renderGifts();
        // 保存到本地存储
        saveToLocalStorage();
        showSaveStatus('🗑️ 礼物删除成功啦～');
    } else {
        console.error('索引超出范围:', index);
        alert('😢 删除失败了～索引超出范围啦 💪');
    }
}

// 编辑礼物
function editGift(index) {
    currentGiftIndex = index;
    const gift = gifts[index];
    document.getElementById('gift-note').value = gift.note;
    
    // 显示当前媒体文件预览
    const currentMediaPreview = document.getElementById('current-media-preview');
    const mediaPreviewContent = document.getElementById('media-preview-content');
    
    if (gift && gift.url) {
        // 显示预览区域
        currentMediaPreview.style.display = 'block';
        
        // 根据礼物类型显示不同的预览
        if (gift.type === 'image') {
            mediaPreviewContent.innerHTML = `<img src="${gift.url}" alt="礼物图片" style="max-width: 100%; max-height: 200px; border-radius: 3px;">`;
        } else if (gift.type === 'video') {
            mediaPreviewContent.innerHTML = `<video src="${gift.url}" style="max-width: 100%; max-height: 200px; border-radius: 3px;" controls></video>`;
        }
    } else {
        // 隐藏预览区域
        currentMediaPreview.style.display = 'none';
        mediaPreviewContent.innerHTML = '';
    }
    
    openGiftModal();
}

// 删除礼物
function deleteGift(index) {
    console.log('删除按钮被点击，索引:', index);
    console.log('当前gifts数组长度:', gifts.length);
    console.log('当前gifts数组:', gifts);
    
    // 显示确认对话框
    const confirmed = confirm('确定要删除这个礼物吗？删除后无法恢复。');
    console.log('用户确认:', confirmed);
    
    if (confirmed) {
        console.log('执行删除操作，索引:', index);
        if (index >= 0 && index < gifts.length) {
            // 执行删除
            gifts.splice(index, 1);
            console.log('删除后gifts数组长度:', gifts.length);
            // 重新渲染
            renderGifts();
            // 保存到本地存储
            saveToLocalStorage();
            showSaveStatus('礼物删除成功');
        } else {
            console.error('索引超出范围:', index);
            alert('删除失败：索引超出范围');
        }
    } else {
        console.log('用户取消删除操作');
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
            mediaElement = `<img src="${gift.url}" alt="礼物图片" class="gift-media">`;
        } else {
            mediaElement = `<video src="${gift.url}" class="gift-media"></video>`;
        }
        
        html += `
            <div class="gift-item">
                <div class="gift-media-container">
                    ${mediaElement}
                </div>
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
async function generateShowPackage() {
    try {
        // 保存编辑状态
        await saveEditState();
        
        const siteTitle = document.getElementById('site-title').value || '我的礼物';
        const letterTitle = document.getElementById('letter-title').value || '生日祝福';
        const letterContent = quill.root.innerHTML;
        
        // 获取当前主题色
        const currentTheme = document.body.classList.contains('pink') ? 'pink' : 
                            document.body.classList.contains('white') ? 'white' : 'blue';
        
        // 准备展示数据
        const showData = {
            siteTitle: siteTitle,
            letterTitle: letterTitle,
            letterContent: letterContent,
            gifts: gifts.map(gift => ({
                id: gift.id,
                url: gift.url,
                note: gift.note,
                type: gift.type
            })),
            audioUrl: audioUrl,
            audioName: audioFile ? audioFile.name : null,
            theme: currentTheme
        };
        
        // 保存到后端并获取分享链接
        const response = await fetch(`${SERVER_URL}/api/save-show`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(showData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 显示生成成功信息和分享链接
            let editLink = '';
            if (editId) {
                editLink = `<p style="margin-top: 10px;">编辑链接（用于后续修改）：</p>
                <p style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; word-break: break-all;">
                    ${SERVER_URL}/edit.html?editId=${editId}
                </p>`;
            }
            
            document.getElementById('generate-info').innerHTML = `
                <p style="color: green;">生成成功！请将以下链接分享给对方：</p>
                <p style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; word-break: break-all;">
                    ${result.shareUrl}
                </p>
                ${editLink}
                <p style="color: blue;">注意：此链接永久有效，请妥善保管。</p>
            `;
            
            // 复制链接到剪贴板
            try {
                await navigator.clipboard.writeText(result.shareUrl);
                document.getElementById('generate-info').innerHTML += `
                    <p style="color: green; font-size: 14px;">✅ 分享链接已复制到剪贴板</p>
                `;
            } catch (clipboardError) {
                console.log('无法复制到剪贴板:', clipboardError);
            }
        } else {
            document.getElementById('generate-info').innerHTML = `
                <p style="color: red;">生成失败: ${result.error}</p>
            `;
        }
    } catch (error) {
        console.error('生成分享链接失败:', error);
        document.getElementById('generate-info').innerHTML = `
            <p style="color: red;">生成失败，请重试。</p>
        `;
    }
}

// 更新当前编辑ID显示
function updateCurrentEditId() {
    const currentEditIdElement = document.getElementById('current-edit-id');
    if (currentEditIdElement) {
        if (editId) {
            currentEditIdElement.textContent = `当前编辑ID: ${editId} (可用于后续恢复编辑)`;
        } else {
            currentEditIdElement.textContent = '未保存编辑状态';
        }
    }
}

// 初始化弹窗
function initModals() {
    // 关闭礼物弹窗
    document.querySelector('#gift-modal .close').addEventListener('click', closeGiftModal);
    
    // 关闭预览弹窗
    document.querySelector('#preview-modal .close').addEventListener('click', function() {
        document.getElementById('preview-modal').style.display = 'none';
    });
    
    // 关闭裁剪弹窗
    document.querySelector('#crop-modal .close').addEventListener('click', closeCropModal);
    document.getElementById('cancel-crop').addEventListener('click', closeCropModal);
    document.getElementById('confirm-crop').addEventListener('click', confirmCrop);
    
    // 点击弹窗外部关闭
    window.addEventListener('click', function(e) {
        const giftModal = document.getElementById('gift-modal');
        const previewModal = document.getElementById('preview-modal');
        const cropModal = document.getElementById('crop-modal');
        
        if (e.target === giftModal) {
            closeGiftModal();
        }
        
        if (e.target === previewModal) {
            previewModal.style.display = 'none';
        }
        
        if (e.target === cropModal) {
            closeCropModal();
        }
    });
    
    // 保存礼物按钮
    document.getElementById('save-gift').addEventListener('click', saveGift);
    
    // 文件选择事件
    document.getElementById('gift-file').addEventListener('change', handleFileSelect);
    
    // 标题和内容变化时自动保存
    document.getElementById('site-title').addEventListener('input', saveToLocalStorage);
    document.getElementById('letter-title').addEventListener('input', saveToLocalStorage);
    
    // 延迟添加Quill监听，确保Quill已初始化
    setTimeout(() => {
        if (quill) {
            quill.on('text-change', saveToLocalStorage);
            console.log('已添加Quill文本变化监听');
        }
    }, 500);
    
    // 恢复编辑状态按钮
    const loadEditBtn = document.getElementById('load-edit-btn');
    if (loadEditBtn) {
        loadEditBtn.addEventListener('click', function() {
            const editIdInput = document.getElementById('edit-id-input');
            const inputEditId = editIdInput.value.trim();
            if (inputEditId) {
                loadEditState(inputEditId);
            } else {
                alert('请输入编辑ID');
            }
        });
    }
}

// 初始化拖拽排序
function initSortable() {
    const giftGrid = document.getElementById('gift-grid');
    new Sortable(giftGrid, {
        animation: 150,
        ghostClass: 'sortable-ghost', // 添加拖拽时的幽灵元素样式
        chosenClass: 'sortable-chosen', // 添加选中元素的样式
        dragClass: 'sortable-drag', // 添加拖拽元素的样式
        onStart: function(evt) {
            // 排序开始时的视觉反馈
            const draggedElement = evt.item;
            draggedElement.style.opacity = '0.5';
        },
        onEnd: function(evt) {
            // 排序结束时的视觉反馈
            const draggedElement = evt.item;
            draggedElement.style.opacity = '1';
            
            // 重新排序礼物数组
            const draggedGift = gifts.splice(evt.oldIndex, 1)[0];
            gifts.splice(evt.newIndex, 0, draggedGift);
            // 重新渲染礼物列表，确保删除按钮的index值与当前gifts数组顺序一致
            renderGifts();
            // 保存到本地存储
            saveToLocalStorage();
            showSaveStatus('礼物顺序已更新');
        }
    });
}

// 初始化音乐播放器
function initMusicPlayer() {
    // 音乐上传按钮点击事件
    document.getElementById('music-upload-btn').addEventListener('click', function() {
        document.getElementById('music-upload').click();
    });
    
    // 音乐上传
    document.getElementById('music-upload').addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('audio/')) {
            try {
                // 先更新音乐信息，显示正在上传
                document.getElementById('music-info').textContent = '上传中...';
                
                // 上传文件到服务器
                const url = await uploadFileToServer(file);
                
                // 替换音乐
                if (audio) {
                    audio.unload();
                    showSaveStatus('🎵 音乐已替换～');
                } else {
                    showSaveStatus('🎵 音乐保存成功啦～');
                }
                
                audioFile = file;
                audioUrl = url;
                document.getElementById('music-info').textContent = file.name;
                
                // 更新音乐文件名显示元素
                const musicFilenameElement = document.getElementById('music-filename');
                if (musicFilenameElement) {
                    musicFilenameElement.textContent = file.name;
                    musicFilenameElement.style.color = '#666';
                }
                
                // 创建新的Howl实例
                audio = new Howl({
                    src: [url],
                    loop: true,
                    volume: parseFloat(document.getElementById('volume').value)
                });
                
                // 保存到本地存储
                saveToLocalStorage();

            } catch (error) {
                console.error('上传音乐失败:', error);
                document.getElementById('music-info').textContent = '上传失败';
                alert('😢 音乐上传失败了～请再试一次吧 💪');

            }
        } else if (file) {
            alert('🎵 请选择音频文件哦～');
        }
    });
    
    // 清除音乐
    document.getElementById('clear-music').addEventListener('click', function() {
        if (audio) {
            audio.unload();
            audio = null;
        }
        audioFile = null;
        audioUrl = null;
        document.getElementById('music-info').textContent = '未选择';
        document.getElementById('play-btn').textContent = '播放';
        
        // 清空音乐文件名显示元素
        const musicFilenameElement = document.getElementById('music-filename');
        if (musicFilenameElement) {
            musicFilenameElement.textContent = '未选择';
            musicFilenameElement.style.color = '#666';
        }
        
        // 保存到本地存储
        saveToLocalStorage();
        showSaveStatus('🎵 音乐已清除～');
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
        } else {
            showSaveStatus('🎵 请先选择音乐哦～');
        }
    });
    
    // 音量控制
    document.getElementById('volume').addEventListener('input', function() {
        const volume = parseFloat(this.value);
        if (audio) {
            audio.volume(volume);
        }
    });
}

// 初始化表情掉落动画
function initEmojiRain() {
    const letterContent = document.querySelector('.letter-content');
    
    // 可爱表情集合
    const emojis = ['😊', '🥰', '🤩', '🌟', '🎀', '🎉', '✨', '💖', '🌸', '🦋', '🌈', '💝', '💗', '💓', '💞'];
    
    // 当用户输入时触发表情掉落
    if (quill) {
        quill.on('text-change', function() {
            // 随机决定是否触发，避免过于频繁
            if (Math.random() > 0.7) {
                createEmojiRain(letterContent, emojis);
            }
        });
    }
}

// 创建表情掉落效果
function createEmojiRain(container, emojis) {
    // 限制同时显示的表情数量
    const existingEmojis = container.querySelectorAll('.emoji-rain');
    if (existingEmojis.length > 10) return;
    
    // 创建多个表情
    const emojiCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < emojiCount; i++) {
        const emoji = document.createElement('div');
        emoji.className = 'emoji-rain';
        emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        
        // 随机位置和样式
        const left = Math.random() * 100;
        const fontSize = Math.random() * 20 + 20;
        const duration = Math.random() * 3 + 2;
        
        emoji.style.position = 'absolute';
        emoji.style.left = `${left}%`;
        emoji.style.top = '-30px';
        emoji.style.fontSize = `${fontSize}px`;
        emoji.style.pointerEvents = 'none';
        emoji.style.zIndex = '10';
        emoji.style.animation = `emojiFall ${duration}s ease-in-out forwards`;
        
        container.appendChild(emoji);
        
        // 动画结束后移除
        setTimeout(() => {
            emoji.remove();
        }, duration * 1000);
    }
}

// 页面加载完成后初始化
window.onload = initPage;
