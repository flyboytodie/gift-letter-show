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
    if (savedData) try {
        const data = JSON.parse(savedData);
        gifts = data.gifts || [];
        audioUrl = data.audioUrl || null;
        // 更新音乐播放器UI状态
        if (audioUrl) {
            // 优先使用保存的原始文件名
            const fileName = data.audioName || (()=>{
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
            if (audio) audio.unload();
            audio = new Howl({
                src: [
                    audioUrl
                ],
                loop: true,
                volume: parseFloat(document.getElementById('volume').value)
            });
        } else {
            document.getElementById('music-info').textContent = "\u672A\u9009\u62E9";
            // 清空音乐文件名显示元素
            const musicFilenameElement = document.getElementById('music-filename');
            if (musicFilenameElement) {
                musicFilenameElement.textContent = "\u672A\u9009\u62E9";
                musicFilenameElement.style.color = '#666';
            }
        }
        // 恢复主题色
        if (data.theme) {
            document.body.classList.remove('pink', 'white', 'blue');
            document.body.classList.add(data.theme);
            // 更新颜色按钮状态
            const colorBtns = document.querySelectorAll('.color-btn');
            colorBtns.forEach((btn)=>{
                if (btn.dataset.color === data.theme) btn.classList.add('active');
                else btn.classList.remove('active');
            });
        }
        // 恢复标题
        if (data.siteTitle) document.getElementById('site-title').value = data.siteTitle;
        if (data.letterTitle) document.getElementById('letter-title').value = data.letterTitle;
        // 恢复书信内容
        if (data.letterContent && quill) quill.root.innerHTML = data.letterContent;
        // 恢复礼物列表
        renderGifts();
    } catch (error) {
        console.error("\u52A0\u8F7D\u6570\u636E\u5931\u8D25:", error);
    }
}
// 保存数据到localStorage
function saveToLocalStorage() {
    // 获取当前主题色
    const currentTheme = document.body.classList.contains('pink') ? 'pink' : document.body.classList.contains('white') ? 'white' : 'blue';
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
    console.log("\u6570\u636E\u5DF2\u4FDD\u5B58\u5230\u672C\u5730\u5B58\u50A8");
}
// 保存编辑状态到后端
async function saveEditState() {
    try {
        // 获取当前主题色
        const currentTheme = document.body.classList.contains('pink') ? 'pink' : document.body.classList.contains('white') ? 'white' : 'blue';
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
            console.log("\u7F16\u8F91\u72B6\u6001\u5DF2\u4FDD\u5B58\u5230\u540E\u7AEF");
            showSaveStatus("\uD83D\uDCBE \u7F16\u8F91\u72B6\u6001\u4FDD\u5B58\u6210\u529F\u5566\uFF5E");
            // 更新当前编辑ID显示
            updateCurrentEditId();
            return result.editId;
        }
    } catch (error) {
        console.error("\u4FDD\u5B58\u7F16\u8F91\u72B6\u6001\u5931\u8D25:", error);
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
    setTimeout(()=>{
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
                const fileName = data.audioName || (()=>{
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
                if (audio) audio.unload();
                audio = new Howl({
                    src: [
                        audioUrl
                    ],
                    loop: true,
                    volume: parseFloat(document.getElementById('volume').value)
                });
            } else {
                document.getElementById('music-info').textContent = "\u672A\u9009\u62E9";
                // 清空音乐文件名显示元素
                const musicFilenameElement = document.getElementById('music-filename');
                if (musicFilenameElement) {
                    musicFilenameElement.textContent = "\u672A\u9009\u62E9";
                    musicFilenameElement.style.color = '#666';
                }
            }
            // 恢复主题色
            if (data.theme) {
                document.body.classList.remove('pink', 'white', 'blue');
                document.body.classList.add(data.theme);
                // 更新颜色按钮状态
                const colorBtns = document.querySelectorAll('.color-btn');
                colorBtns.forEach((btn)=>{
                    if (btn.dataset.color === data.theme) btn.classList.add('active');
                    else btn.classList.remove('active');
                });
            }
            // 恢复标题
            if (data.siteTitle) document.getElementById('site-title').value = data.siteTitle;
            if (data.letterTitle) document.getElementById('letter-title').value = data.letterTitle;
            // 恢复书信内容
            if (data.letterContent && quill) quill.root.innerHTML = data.letterContent;
            // 恢复礼物列表
            renderGifts();
            showSaveStatus("\uD83D\uDD04 \u7F16\u8F91\u72B6\u6001\u6062\u590D\u6210\u529F\u5566\uFF5E");
            return true;
        }
    } catch (error) {
        console.error("\u52A0\u8F7D\u7F16\u8F91\u72B6\u6001\u5931\u8D25:", error);
        showSaveStatus("\u52A0\u8F7D\u7F16\u8F91\u72B6\u6001\u5931\u8D25");
    }
    return false;
}
// 上传文件到服务器
function uploadFileToServer(file) {
    return new Promise((resolve, reject)=>{
        const formData = new FormData();
        formData.append('file', file);
        fetch(`${SERVER_URL}/api/upload`, {
            method: 'POST',
            body: formData
        }).then((response)=>{
            if (!response.ok) throw new Error('Upload failed');
            return response.json();
        }).then((data)=>{
            if (data.error) reject(data.error);
            else resolve(data.url);
        }).catch((error)=>{
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
                if (editor) editor.style.fontFamily = selectedFont;
            }
            // 更新礼物备注字体
            const giftNotes = document.querySelectorAll('.gift-note');
            giftNotes.forEach((note)=>{
                note.style.fontFamily = selectedFont;
            });
            console.log("\u5B57\u4F53\u5DF2\u66F4\u65B0\u4E3A:", selectedFont);
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
    if (urlEditId) setTimeout(()=>{
        loadEditState(urlEditId);
    }, 500);
    else loadFromLocalStorage();
    // 初始化表情掉落动画
    initEmojiRain();
}
// 初始化富文本编辑器
function initQuill() {
    quill = new Quill('#letter-content', {
        theme: 'snow',
        modules: {
            toolbar: [
                [
                    'bold',
                    'italic',
                    'underline'
                ],
                [
                    'blockquote',
                    'code-block'
                ],
                [
                    {
                        'header': 1
                    },
                    {
                        'header': 2
                    }
                ],
                [
                    {
                        'list': 'ordered'
                    },
                    {
                        'list': 'bullet'
                    }
                ],
                [
                    {
                        'color': []
                    },
                    {
                        'background': []
                    }
                ],
                [
                    {
                        'align': []
                    }
                ],
                [
                    'clean'
                ]
            ]
        },
        placeholder: "\u8BF7\u8F93\u5165\u4E66\u4FE1\u5185\u5BB9...",
        // 设置默认字体
        formats: [
            'font',
            'size',
            'bold',
            'italic',
            'underline',
            'strike',
            'blockquote',
            'code-block',
            'header',
            'list',
            'bullet',
            'indent',
            'link',
            'image',
            'color',
            'background',
            'align'
        ],
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
    colorBtns.forEach((btn)=>{
        btn.addEventListener('click', ()=>{
            // 移除所有按钮的active类
            colorBtns.forEach((b)=>b.classList.remove('active'));
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
    document.getElementById('add-gift').addEventListener('click', ()=>{
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
    if (file.type.startsWith('image/')) openCropModal(file);
    else saveGiftWithFile(file);
}
// 打开裁剪弹窗
function openCropModal(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.getElementById('crop-image');
        img.src = e.target.result;
        // 初始化裁剪器
        if (cropper) cropper.destroy();
        cropper = new Cropper(img, {
            aspectRatio: 1,
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.8,
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
        console.log("\u5F00\u59CB\u88C1\u526A\u56FE\u7247");
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
            console.log("\u88C1\u526A\u5B8C\u6210\uFF0C\u521B\u5EFA\u6587\u4EF6\u5BF9\u8C61");
            // 创建新的File对象
            croppedFile = new File([
                blob
            ], currentFile.name, {
                type: currentFile.type,
                lastModified: Date.now()
            });
            console.log("\u5173\u95ED\u88C1\u526A\u5F39\u7A97");
            // 关闭裁剪弹窗，返回礼物编辑弹窗
            closeCropModal();
            console.log("\u663E\u793A\u63D0\u793A\u4FE1\u606F");
            // 显示提示信息，让用户填写备注
            alert("\u2702\uFE0F \u88C1\u526A\u5B8C\u6210\u5566\uFF5E\u8BF7\u586B\u5199\u793C\u7269\u5907\u6CE8\u540E\u70B9\u51FB\u4FDD\u5B58\u54E6 \uD83C\uDF81");
            console.log("\u88C1\u526A\u6D41\u7A0B\u5B8C\u6210\uFF0C\u793C\u7269\u7F16\u8F91\u5F39\u7A97\u5E94\u8BE5\u4ECD\u7136\u6253\u5F00");
            // 重置添加礼物状态
            isAddingGift = false;
        }, currentFile.type);
    } catch (error) {
        console.error("\u88C1\u526A\u5931\u8D25:", error);
        alert("\uD83D\uDE22 \u88C1\u526A\u5931\u8D25\u4E86\uFF5E\u8BF7\u518D\u8BD5\u4E00\u6B21\u5427 \uD83D\uDCAA");
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
        console.log("\u5F00\u59CB\u4E0A\u4F20\u6587\u4EF6:", file.name);
        // 设置添加礼物状态
        isAddingGift = true;
        // 上传文件到服务器
        const url = await uploadFileToServer(file);
        console.log("\u6587\u4EF6\u4E0A\u4F20\u6210\u529F\uFF0CURL:", url);
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
            console.log("\u65B0\u793C\u7269\u6DFB\u52A0\u6210\u529F:", gift.id);
        } else {
            // 编辑现有礼物，保留原始ID
            gift = gifts[currentGiftIndex];
            gift.file = file;
            gift.url = url;
            gift.note = note;
            gift.type = file.type.startsWith('image/') ? 'image' : 'video';
            // 保留原始ID
            console.log("\u793C\u7269\u7F16\u8F91\u6210\u529F:", gift.id);
        }
        // 重新渲染礼物列表
        renderGifts();
        // 关闭弹窗
        closeGiftModal();
        // 保存到本地存储
        saveToLocalStorage();
        // 显示保存成功提示
        showSaveStatus("\uD83C\uDF89 \u793C\u7269\u4FDD\u5B58\u6210\u529F\u5566\uFF5E");
        console.log("\u793C\u7269\u4FDD\u5B58\u5B8C\u6210");
    } catch (error) {
        console.error("\u4FDD\u5B58\u793C\u7269\u5931\u8D25:", error);
        console.error("\u9519\u8BEF\u8BE6\u60C5:", error.message);
        // 显示更详细的错误信息
        alert("\uD83D\uDE22 \u4E0A\u4F20\u5931\u8D25\u4E86\uFF5E\u8BF7\u518D\u8BD5\u4E00\u6B21\u5427 \uD83D\uDCAA\n\n\u9519\u8BEF\u4FE1\u606F: " + error.message);
    } finally{
        // 重置添加礼物状态
        isAddingGift = false;
        // 重置裁剪文件
        croppedFile = null;
    }
}
// 保存礼物
function saveGift() {
    if (isAddingGift) {
        alert("\u23F0 \u793C\u7269\u6B63\u5728\u6DFB\u52A0\u4E2D\uFF0C\u8BF7\u7A0D\u5019\u54E6\uFF5E \uD83C\uDF80");
        return;
    }
    const fileInput = document.getElementById('gift-file');
    const noteInput = document.getElementById('gift-note');
    const note = noteInput.value;
    console.log("\u5F00\u59CB\u4FDD\u5B58\u793C\u7269");
    console.log('currentGiftIndex:', currentGiftIndex);
    console.log('fileInput.files.length:', fileInput.files.length);
    console.log('croppedFile:', croppedFile);
    console.log('note:', note);
    // 如果是编辑现有礼物且没有选择新文件，只更新备注
    if (currentGiftIndex !== -1 && !fileInput.files.length && !croppedFile) {
        console.log("\u7F16\u8F91\u73B0\u6709\u793C\u7269\uFF0C\u53EA\u66F4\u65B0\u5907\u6CE8");
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
        showSaveStatus("\uD83D\uDCDD \u793C\u7269\u5907\u6CE8\u66F4\u65B0\u6210\u529F\u5566\uFF5E");
        return;
    }
    // 检查是否有裁剪后的文件
    if (croppedFile) {
        console.log("\u4F7F\u7528\u88C1\u526A\u540E\u7684\u6587\u4EF6\u4FDD\u5B58\u793C\u7269");
        // 使用裁剪后的文件
        saveGiftWithFile(croppedFile);
    } else if (fileInput.files.length) {
        console.log("\u5904\u7406\u7528\u6237\u9009\u62E9\u7684\u6587\u4EF6");
        // 处理文件选择
        handleFileSelect({
            target: fileInput
        });
    } else {
        console.log("\u6CA1\u6709\u9009\u62E9\u6587\u4EF6");
        alert("\uD83C\uDF81 \u8BF7\u5148\u9009\u62E9\u793C\u7269\u7D20\u6750\u54E6\uFF5E");
        return;
    }
}
// 渲染礼物列表
function renderGifts() {
    const giftGrid = document.getElementById('gift-grid');
    giftGrid.innerHTML = '';
    gifts.forEach((gift, index)=>{
        const giftItem = document.createElement('div');
        giftItem.className = 'gift-item';
        let mediaElement = '';
        if (gift.type === 'image') mediaElement = `<img src="${gift.url}" alt="\u{793C}\u{7269}\u{56FE}\u{7247}" class="gift-media">
            <button onclick="previewImage(${index})" class="preview-btn">\u{9884}\u{89C8}</button>`;
        else mediaElement = `<video src="${gift.url}" class="gift-media">
            <button onclick="this.previousElementSibling.play()" class="preview-btn">\u{64AD}\u{653E}</button>`;
        giftItem.innerHTML = `
            <div class="gift-media-container">
                ${mediaElement}
            </div>
            <div class="gift-note">${gift.note || "\u65E0\u5907\u6CE8"}</div>
            <div class="gift-actions">
                <button onclick="editGift(${index})" class="edit-btn">\u{7F16}\u{8F91}</button>
                <button onclick="confirmAndDelete(${index})" class="delete-btn">\u{5220}\u{9664}</button>
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
                if (e.target.tagName === 'IMG') previewImage(index);
                else if (e.target.tagName === 'VIDEO') e.target.play();
            }
        }
    });
    // 点击编辑按钮
    giftGrid.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-btn')) {
            e.stopPropagation();
            const index = parseInt(e.target.dataset.index);
            if (!isNaN(index)) editGift(index);
        }
    });
}
// 直接删除礼物
function confirmAndDelete(index) {
    console.log("\u5220\u9664\u6309\u94AE\u88AB\u70B9\u51FB\uFF0C\u7D22\u5F15:", index);
    console.log("\u5F53\u524Dgifts\u6570\u7EC4\u957F\u5EA6:", gifts.length);
    // 直接执行删除操作，不弹出确认框
    if (index >= 0 && index < gifts.length) {
        // 执行删除
        gifts.splice(index, 1);
        console.log("\u5220\u9664\u540Egifts\u6570\u7EC4\u957F\u5EA6:", gifts.length);
        // 重新渲染
        renderGifts();
        // 保存到本地存储
        saveToLocalStorage();
        showSaveStatus("\uD83D\uDDD1\uFE0F \u793C\u7269\u5220\u9664\u6210\u529F\u5566\uFF5E");
    } else {
        console.error("\u7D22\u5F15\u8D85\u51FA\u8303\u56F4:", index);
        alert("\uD83D\uDE22 \u5220\u9664\u5931\u8D25\u4E86\uFF5E\u7D22\u5F15\u8D85\u51FA\u8303\u56F4\u5566 \uD83D\uDCAA");
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
        if (gift.type === 'image') mediaPreviewContent.innerHTML = `<img src="${gift.url}" alt="\u{793C}\u{7269}\u{56FE}\u{7247}" style="max-width: 100%; max-height: 200px; border-radius: 3px;">`;
        else if (gift.type === 'video') mediaPreviewContent.innerHTML = `<video src="${gift.url}" style="max-width: 100%; max-height: 200px; border-radius: 3px;" controls></video>`;
    } else {
        // 隐藏预览区域
        currentMediaPreview.style.display = 'none';
        mediaPreviewContent.innerHTML = '';
    }
    openGiftModal();
}
// 删除礼物
function deleteGift(index) {
    console.log("\u5220\u9664\u6309\u94AE\u88AB\u70B9\u51FB\uFF0C\u7D22\u5F15:", index);
    console.log("\u5F53\u524Dgifts\u6570\u7EC4\u957F\u5EA6:", gifts.length);
    console.log("\u5F53\u524Dgifts\u6570\u7EC4:", gifts);
    // 显示确认对话框
    const confirmed = confirm("\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u4E2A\u793C\u7269\u5417\uFF1F\u5220\u9664\u540E\u65E0\u6CD5\u6062\u590D\u3002");
    console.log("\u7528\u6237\u786E\u8BA4:", confirmed);
    if (confirmed) {
        console.log("\u6267\u884C\u5220\u9664\u64CD\u4F5C\uFF0C\u7D22\u5F15:", index);
        if (index >= 0 && index < gifts.length) {
            // 执行删除
            gifts.splice(index, 1);
            console.log("\u5220\u9664\u540Egifts\u6570\u7EC4\u957F\u5EA6:", gifts.length);
            // 重新渲染
            renderGifts();
            // 保存到本地存储
            saveToLocalStorage();
            showSaveStatus("\u793C\u7269\u5220\u9664\u6210\u529F");
        } else {
            console.error("\u7D22\u5F15\u8D85\u51FA\u8303\u56F4:", index);
            alert("\u5220\u9664\u5931\u8D25\uFF1A\u7D22\u5F15\u8D85\u51FA\u8303\u56F4");
        }
    } else console.log("\u7528\u6237\u53D6\u6D88\u5220\u9664\u64CD\u4F5C");
}
// 预览图片
function previewImage(index) {
    const gift = gifts[index];
    if (gift.type === 'image') console.log("\u9884\u89C8\u56FE\u7247:", gift.url);
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
        <h2>\u{793C}\u{7269}</h2>
        <div class="gift-grid">
    `;
    gifts.forEach((gift)=>{
        let mediaElement = '';
        if (gift.type === 'image') mediaElement = `<img src="${gift.url}" alt="\u{793C}\u{7269}\u{56FE}\u{7247}" class="gift-media">`;
        else mediaElement = `<video src="${gift.url}" class="gift-media"></video>`;
        html += `
            <div class="gift-item">
                <div class="gift-media-container">
                    ${mediaElement}
                </div>
                <div class="gift-note">${gift.note || "\u65E0\u5907\u6CE8"}</div>
            </div>
        `;
    });
    html += `
        </div>
        <h2>${letterTitle}</h2>
        <div class="letter-content">${letterContent}</div>
        <div class="music-player">
            <span>\u{80CC}\u{666F}\u{97F3}\u{4E50}: ${audioFile ? audioFile.name : "\u672A\u9009\u62E9"}</span>
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
        const siteTitle = document.getElementById('site-title').value || "\u6211\u7684\u793C\u7269";
        const letterTitle = document.getElementById('letter-title').value || "\u751F\u65E5\u795D\u798F";
        const letterContent = quill.root.innerHTML;
        // 获取当前主题色
        const currentTheme = document.body.classList.contains('pink') ? 'pink' : document.body.classList.contains('white') ? 'white' : 'blue';
        // 准备展示数据
        const showData = {
            siteTitle: siteTitle,
            letterTitle: letterTitle,
            letterContent: letterContent,
            gifts: gifts.map((gift)=>({
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
            if (editId) editLink = `<p style="margin-top: 10px;">\u{7F16}\u{8F91}\u{94FE}\u{63A5}\u{FF08}\u{7528}\u{4E8E}\u{540E}\u{7EED}\u{4FEE}\u{6539}\u{FF09}\u{FF1A}</p>
                <p style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; word-break: break-all;">
                    ${SERVER_URL}/edit.html?editId=${editId}
                </p>`;
            document.getElementById('generate-info').innerHTML = `
                <p style="color: green;">\u{751F}\u{6210}\u{6210}\u{529F}\u{FF01}\u{8BF7}\u{5C06}\u{4EE5}\u{4E0B}\u{94FE}\u{63A5}\u{5206}\u{4EAB}\u{7ED9}\u{5BF9}\u{65B9}\u{FF1A}</p>
                <p style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; word-break: break-all;">
                    ${result.shareUrl}
                </p>
                ${editLink}
                <p style="color: blue;">\u{6CE8}\u{610F}\u{FF1A}\u{6B64}\u{94FE}\u{63A5}\u{6C38}\u{4E45}\u{6709}\u{6548}\u{FF0C}\u{8BF7}\u{59A5}\u{5584}\u{4FDD}\u{7BA1}\u{3002}</p>
            `;
            // 复制链接到剪贴板
            try {
                await navigator.clipboard.writeText(result.shareUrl);
                document.getElementById('generate-info').innerHTML += `
                    <p style="color: green; font-size: 14px;">\u{2705} \u{5206}\u{4EAB}\u{94FE}\u{63A5}\u{5DF2}\u{590D}\u{5236}\u{5230}\u{526A}\u{8D34}\u{677F}</p>
                `;
            } catch (clipboardError) {
                console.log("\u65E0\u6CD5\u590D\u5236\u5230\u526A\u8D34\u677F:", clipboardError);
            }
        } else document.getElementById('generate-info').innerHTML = `
                <p style="color: red;">\u{751F}\u{6210}\u{5931}\u{8D25}: ${result.error}</p>
            `;
    } catch (error) {
        console.error("\u751F\u6210\u5206\u4EAB\u94FE\u63A5\u5931\u8D25:", error);
        document.getElementById('generate-info').innerHTML = `
            <p style="color: red;">\u{751F}\u{6210}\u{5931}\u{8D25}\u{FF0C}\u{8BF7}\u{91CD}\u{8BD5}\u{3002}</p>
        `;
    }
}
// 更新当前编辑ID显示
function updateCurrentEditId() {
    const currentEditIdElement = document.getElementById('current-edit-id');
    if (currentEditIdElement) {
        if (editId) currentEditIdElement.textContent = `\u{5F53}\u{524D}\u{7F16}\u{8F91}ID: ${editId} (\u{53EF}\u{7528}\u{4E8E}\u{540E}\u{7EED}\u{6062}\u{590D}\u{7F16}\u{8F91})`;
        else currentEditIdElement.textContent = "\u672A\u4FDD\u5B58\u7F16\u8F91\u72B6\u6001";
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
        if (e.target === giftModal) closeGiftModal();
        if (e.target === previewModal) previewModal.style.display = 'none';
        if (e.target === cropModal) closeCropModal();
    });
    // 保存礼物按钮
    document.getElementById('save-gift').addEventListener('click', saveGift);
    // 文件选择事件
    document.getElementById('gift-file').addEventListener('change', handleFileSelect);
    // 标题和内容变化时自动保存
    document.getElementById('site-title').addEventListener('input', saveToLocalStorage);
    document.getElementById('letter-title').addEventListener('input', saveToLocalStorage);
    // 延迟添加Quill监听，确保Quill已初始化
    setTimeout(()=>{
        if (quill) {
            quill.on('text-change', saveToLocalStorage);
            console.log("\u5DF2\u6DFB\u52A0Quill\u6587\u672C\u53D8\u5316\u76D1\u542C");
        }
    }, 500);
    // 恢复编辑状态按钮
    const loadEditBtn = document.getElementById('load-edit-btn');
    if (loadEditBtn) loadEditBtn.addEventListener('click', function() {
        const editIdInput = document.getElementById('edit-id-input');
        const inputEditId = editIdInput.value.trim();
        if (inputEditId) loadEditState(inputEditId);
        else alert("\u8BF7\u8F93\u5165\u7F16\u8F91ID");
    });
}
// 初始化拖拽排序
function initSortable() {
    const giftGrid = document.getElementById('gift-grid');
    new Sortable(giftGrid, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
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
            showSaveStatus("\u793C\u7269\u987A\u5E8F\u5DF2\u66F4\u65B0");
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
        if (file && file.type.startsWith('audio/')) try {
            // 先更新音乐信息，显示正在上传
            document.getElementById('music-info').textContent = "\u4E0A\u4F20\u4E2D...";
            // 上传文件到服务器
            const url = await uploadFileToServer(file);
            // 替换音乐
            if (audio) {
                audio.unload();
                showSaveStatus("\uD83C\uDFB5 \u97F3\u4E50\u5DF2\u66FF\u6362\uFF5E");
            } else showSaveStatus("\uD83C\uDFB5 \u97F3\u4E50\u4FDD\u5B58\u6210\u529F\u5566\uFF5E");
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
                src: [
                    url
                ],
                loop: true,
                volume: parseFloat(document.getElementById('volume').value)
            });
            // 保存到本地存储
            saveToLocalStorage();
        } catch (error) {
            console.error("\u4E0A\u4F20\u97F3\u4E50\u5931\u8D25:", error);
            document.getElementById('music-info').textContent = "\u4E0A\u4F20\u5931\u8D25";
            alert("\uD83D\uDE22 \u97F3\u4E50\u4E0A\u4F20\u5931\u8D25\u4E86\uFF5E\u8BF7\u518D\u8BD5\u4E00\u6B21\u5427 \uD83D\uDCAA");
        }
        else if (file) alert("\uD83C\uDFB5 \u8BF7\u9009\u62E9\u97F3\u9891\u6587\u4EF6\u54E6\uFF5E");
    });
    // 清除音乐
    document.getElementById('clear-music').addEventListener('click', function() {
        if (audio) {
            audio.unload();
            audio = null;
        }
        audioFile = null;
        audioUrl = null;
        document.getElementById('music-info').textContent = "\u672A\u9009\u62E9";
        document.getElementById('play-btn').textContent = "\u64AD\u653E";
        // 清空音乐文件名显示元素
        const musicFilenameElement = document.getElementById('music-filename');
        if (musicFilenameElement) {
            musicFilenameElement.textContent = "\u672A\u9009\u62E9";
            musicFilenameElement.style.color = '#666';
        }
        // 保存到本地存储
        saveToLocalStorage();
        showSaveStatus("\uD83C\uDFB5 \u97F3\u4E50\u5DF2\u6E05\u9664\uFF5E");
    });
    // 播放/暂停按钮
    document.getElementById('play-btn').addEventListener('click', function() {
        if (audio) {
            if (audio.playing()) {
                audio.pause();
                this.textContent = "\u64AD\u653E";
            } else {
                audio.play();
                this.textContent = "\u6682\u505C";
            }
        } else showSaveStatus("\uD83C\uDFB5 \u8BF7\u5148\u9009\u62E9\u97F3\u4E50\u54E6\uFF5E");
    });
    // 音量控制
    document.getElementById('volume').addEventListener('input', function() {
        const volume = parseFloat(this.value);
        if (audio) audio.volume(volume);
    });
}
// 初始化表情掉落动画
function initEmojiRain() {
    const letterContent = document.querySelector('.letter-content');
    // 可爱表情集合
    const emojis = [
        "\uD83D\uDE0A",
        "\uD83E\uDD70",
        "\uD83E\uDD29",
        "\uD83C\uDF1F",
        "\uD83C\uDF80",
        "\uD83C\uDF89",
        "\u2728",
        "\uD83D\uDC96",
        "\uD83C\uDF38",
        "\uD83E\uDD8B",
        "\uD83C\uDF08",
        "\uD83D\uDC9D",
        "\uD83D\uDC97",
        "\uD83D\uDC93",
        "\uD83D\uDC9E"
    ];
    // 当用户输入时触发表情掉落
    if (quill) quill.on('text-change', function() {
        // 随机决定是否触发，避免过于频繁
        if (Math.random() > 0.7) createEmojiRain(letterContent, emojis);
    });
}
// 创建表情掉落效果
function createEmojiRain(container, emojis) {
    // 限制同时显示的表情数量
    const existingEmojis = container.querySelectorAll('.emoji-rain');
    if (existingEmojis.length > 10) return;
    // 创建多个表情
    const emojiCount = Math.floor(Math.random() * 3) + 1;
    for(let i = 0; i < emojiCount; i++){
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
        setTimeout(()=>{
            emoji.remove();
        }, duration * 1000);
    }
}
// 页面加载完成后初始化
window.onload = initPage;

//# sourceMappingURL=edit.49903994.js.map
