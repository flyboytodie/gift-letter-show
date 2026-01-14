// 全局变量
let gifts = [];
let currentImageIndex = 0;
let audio = null;
// 获取URL参数
function getUrlParams() {
    const params = {};
    const search = window.location.search;
    if (search) search.substring(1).split('&').forEach((pair)=>{
        const [key, value] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value);
    });
    return params;
}
// 加载展示数据
async function loadShowData() {
    try {
        const params = getUrlParams();
        const showId = params.id;
        if (!showId) {
            document.body.innerHTML = `
                <div style="text-align: center; margin-top: 100px;">
                    <h1>\u{9519}\u{8BEF}</h1>
                    <p>\u{7F3A}\u{5C11}\u{5C55}\u{793A}ID\u{FF0C}\u{8BF7}\u{901A}\u{8FC7}\u{6B63}\u{786E}\u{7684}\u{94FE}\u{63A5}\u{8BBF}\u{95EE}\u{3002}</p>
                </div>
            `;
            return;
        }
        // 从后端获取数据
        const response = await fetch(`/api/get-show?id=${showId}`);
        const result = await response.json();
        if (result.success) {
            const data = result.data;
            // 应用主题色
            if (data.theme) {
                document.body.classList.remove('pink', 'white', 'blue');
                document.body.classList.add(data.theme);
            }
            // 更新页面标题
            document.title = data.siteTitle;
            document.getElementById('site-title').textContent = data.siteTitle;
            // 更新书信标题和内容
            document.getElementById('letter-title').textContent = data.letterTitle;
            document.getElementById('letter-content').innerHTML = data.letterContent;
            // 更新礼物列表
            gifts = data.gifts;
            renderGifts();
            // 初始化音频
            if (data.audioUrl) {
                audio = new Howl({
                    src: [
                        data.audioUrl
                    ],
                    loop: true,
                    volume: 0.5,
                    autoplay: true
                });
                // 尝试自动播放
                audio.play();
                // 更新播放按钮文本
                document.getElementById('play-btn').textContent = "\u6682\u505C";
                // 更新音乐文件名显示
                if (data.audioName) document.getElementById('music-name').textContent = data.audioName;
            }
        } else document.body.innerHTML = `
                <div style="text-align: center; margin-top: 100px;">
                    <h1>\u{9519}\u{8BEF}</h1>
                    <p>${result.error || "\u83B7\u53D6\u5C55\u793A\u6570\u636E\u5931\u8D25"}</p>
                </div>
            `;
    } catch (error) {
        console.error("\u52A0\u8F7D\u6570\u636E\u5931\u8D25:", error);
        document.body.innerHTML = `
            <div style="text-align: center; margin-top: 100px;">
                <h1>\u{9519}\u{8BEF}</h1>
                <p>\u{52A0}\u{8F7D}\u{6570}\u{636E}\u{5931}\u{8D25}\u{FF0C}\u{8BF7}\u{7A0D}\u{540E}\u{91CD}\u{8BD5}\u{3002}</p>
            </div>
        `;
    }
}
// 渲染礼物列表
function renderGifts() {
    const giftGrid = document.getElementById('gift-grid');
    giftGrid.innerHTML = '';
    gifts.forEach((gift, index)=>{
        const giftItem = document.createElement('div');
        giftItem.className = 'gift-item';
        // 创建媒体容器
        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'gift-media-container';
        // 创建媒体元素
        let mediaElement;
        if (gift.type === 'image') {
            mediaElement = document.createElement('img');
            mediaElement.src = gift.url;
            mediaElement.alt = "\u793C\u7269\u56FE\u7247";
            mediaElement.className = 'gift-media';
            mediaElement.onclick = function() {
                openImageModal(index);
            };
        } else {
            mediaElement = document.createElement('video');
            mediaElement.src = gift.url;
            mediaElement.className = 'gift-media';
            mediaElement.onclick = function() {
                this.play();
            };
        }
        // 创建备注元素
        const noteElement = document.createElement('div');
        noteElement.className = 'gift-note';
        noteElement.textContent = gift.note || "\u65E0\u5907\u6CE8";
        // 组装元素
        mediaContainer.appendChild(mediaElement);
        giftItem.appendChild(mediaContainer);
        giftItem.appendChild(noteElement);
        // 添加到网格
        giftGrid.appendChild(giftItem);
    });
}
// 初始化页面
function initPage() {
    initMusicPlayer();
    initImageModal();
    loadShowData();
    initEmojiRain();
}
// 初始化音乐播放器
function initMusicPlayer() {
    document.getElementById('play-btn').addEventListener('click', function() {
        if (audio) {
            if (audio.playing()) {
                audio.pause();
                this.textContent = "\u64AD\u653E";
            } else {
                audio.play();
                this.textContent = "\u6682\u505C";
            }
        }
    });
    document.getElementById('volume').addEventListener('input', function() {
        if (audio) audio.volume(parseFloat(this.value));
    });
}
// 初始化图片弹窗
function initImageModal() {
    // 关闭按钮
    document.querySelector('.close').addEventListener('click', closeImageModal);
    // 点击弹窗外部关闭
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('image-modal');
        if (e.target === modal) closeImageModal();
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
    const imageGifts = gifts.filter((gift)=>gift.type === 'image');
    if (imageGifts.length === 0) return;
    // 计算当前图片在图片礼物中的索引
    let currentImageGiftIndex = imageGifts.findIndex((gift)=>{
        return gift.url === gifts[currentImageIndex].url;
    });
    // 更新索引
    currentImageGiftIndex = (currentImageGiftIndex + direction + imageGifts.length) % imageGifts.length;
    // 找到对应的礼物索引
    const giftIndex = gifts.findIndex((gift)=>{
        return gift.url === imageGifts[currentImageGiftIndex].url;
    });
    // 打开新图片
    openImageModal(giftIndex);
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
    // 页面加载后自动触发一些表情掉落
    setTimeout(()=>{
        createEmojiRain(letterContent, emojis);
    }, 500);
    // 每隔一段时间触发表情掉落
    setInterval(()=>{
        createEmojiRain(letterContent, emojis);
    }, 2000);
}
// 创建表情掉落效果
function createEmojiRain(container, emojis) {
    // 限制同时显示的表情数量
    const existingEmojis = container.querySelectorAll('.emoji-rain');
    if (existingEmojis.length > 20) return;
    // 创建多个表情
    const emojiCount = Math.floor(Math.random() * 5) + 3;
    for(let i = 0; i < emojiCount; i++){
        const emoji = document.createElement('div');
        emoji.className = 'emoji-rain';
        emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        // 随机位置和样式
        const left = Math.random() * 100;
        const fontSize = Math.random() * 25 + 20;
        const duration = Math.random() * 4 + 2;
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

//# sourceMappingURL=show.2fe1864d.js.map
