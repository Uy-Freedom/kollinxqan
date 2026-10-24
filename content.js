// سىز تەمىنلىگەن تەرجىمە فۇنكسىيەسى
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 8000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal  
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

async function translateGoogle(text){
    if(!text || !text.trim()) return text;
    try{
        const r = await fetchWithTimeout(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(0,400))}&langpair=en|ug`,
            { timeout: 8000 }
        );
        if(!r.ok) return text;
        const d = await r.json();
        const t = d.responseData?.translatedText;
        if(t && t !== text && !/mymemory|quota|limit/i.test(t)) return t;
    }catch{}
    return text;
}

// تەڭشەكلەرنى تەكشۈرۈپ تەتبىقلاش
function applySettings(settings) {
    let styleTag = document.getElementById('helper-custom-styles');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'helper-custom-styles';
        document.head.appendChild(styleTag);
    }

    let cssRules = '';
    if (settings.blockAds) {
        cssRules += ' iframe, .ads, .advertisement, [id*="ad-"], [class*="ad-"] { display: none !important; }\n';
    }
    if (settings.blockMedia) {
        cssRules += ' img, video, audio { display: none !important; }\n';
    }
    if (settings.blockNSFW) {
        // ناشايان رەسىملەرنى ئۆلچەملىك سۈزۈش (مەسىلەن، ئادەتتىكى بەت رەسىملىرىنى غۇۋالاشتۇرۇش ياكى يوشۇرۇش)
        cssRules += ' img[alt*="nsfw"], img[class*="adult"] { filter: blur(20px) !important; }\n';
    }
    styleTag.textContent = cssRules;
}

// باشلىنىشتا تەڭشەكلەرنى ئوقۇش
chrome.storage.local.get(['blockAds', 'blockMedia', 'blockNSFW', 'translatorActive'], (data) => {
    applySettings(data);
    window.isTranslatorActive = !!data.translatorActive;
});

// ئۇچۇر ئالماشتۇرۇش
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateSettings') {
        applySettings(request);
    } else if (request.action === 'toggleTranslator') {
        window.isTranslatorActive = request.active;
    }
});

// باسقان يەرنى تەرجىمە قىلىش ئىقتىدارى
document.addEventListener('click', async (e) => {
    if (!window.isTranslatorActive) return;
    
    const target = e.target;
    if (target && target.innerText && target.innerText.trim().length > 0) {
        // ئەگەر ئۇ بەت ئىچىدىكى كىچىك تېكىست بولسا
        const originalText = target.innerText;
        if (target.dataset.translated) return; // ئاللىقاچان تەرجىمە قىلىنغان بولسا
        
        target.style.backgroundColor = '#fff3cd'; // ۋاقىتلىق رەڭ بېرىش
        const translated = await translateGoogle(originalText);
        
        if (translated && translated !== originalText) {
            target.innerText = translated;
            target.dataset.translated = 'true';
            target.style.backgroundColor = '#d4edda'; // مۇۋەپپەقىيەتلىك رەڭگى
        } else {
            target.style.backgroundColor = '';
        }
    }
}, true);