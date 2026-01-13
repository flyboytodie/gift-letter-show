// 全局变量
let gifts = [];
let currentImageIndex = 0;
let audio = null;

// 初始化页面
function initPage() {
    initMusicPlayer();
    initImageModal();
}

// 初始化音乐播放器
function initMusicPlayer() {
    // 尝试加载音频文件
    try {
        audio = new Howl({
            src: ['assets/audio/music.mp3'],
            loop: true,
            volume: 0.5
        });
    } catch (error) {
        console.log('未找到音频文件');
    }
    
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
