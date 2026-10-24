document.addEventListener('DOMContentLoaded', () => {
    // ساقلانغان تەڭشەكلەرنى ئەسلىگە كەلتۈرۈش
    chrome.storage.local.get(['blockAds', 'blockMedia', 'blockNSFW', 'translatorActive'], (data) => {
        document.getElementById('blockAds').checked = !!data.blockAds;
        document.getElementById('blockMedia').checked = !!data.blockMedia;
        document.getElementById('blockNSFW').checked = !!data.blockNSFW;
        if (data.translatorActive) {
            document.getElementById('toggleTranslator').style.backgroundColor = '#27ae60';
            document.getElementById('toggleTranslator').textContent = 'تەرجىمە ھالىتى ئوچۇق';
        }
    });

    // سۈرئەت ئۆلچەش مەشغۇلاتى
    document.getElementById('checkSpeedBtn').addEventListener('click', () => {
        const resultDiv = document.getElementById('speedResult');
        resultDiv.textContent = 'ئۆلچەۋاتىدۇ...';
        
        const startTime = new Date().getTime();
        // كىچىكرەك سىناق فايىل ياكى سۈرەتنى يۈكلەش ئارقىلىق سۈرئەت تەكشۈرۈش
        fetch('https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png?' + startTime)
            .then(response => {
                const endTime = new Date().getTime();
                const duration = (endTime - startTime) / 1000; // سىكۇنت
                const fileSizeKB = 15; // تەخمىنىي سۈرەت چوڭلۇقى
                const speedKBs = (fileSizeKB / duration).toFixed(2);
                resultDiv.textContent = `سۈرئىتى: ${speedKBs} KB/s`;
            })
            .catch(() => {
                resultDiv.textContent = 'تور سۈرئىتىنى ئۆلچەپ بولالمىدى.';
            });
    });

    // چەكلەش تەڭشەكلىرىنى ساقلاش
    const saveSettings = () => {
        const blockAds = document.getElementById('blockAds').checked;
        const blockMedia = document.getElementById('blockMedia').checked;
        const blockNSFW = document.getElementById('blockNSFW').checked;
        
        chrome.storage.local.set({ blockAds, blockMedia, blockNSFW }, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'updateSettings', blockAds, blockMedia, blockNSFW });
                }
            });
        });
    };

    document.getElementById('blockAds').addEventListener('change', saveSettings);
    document.getElementById('blockMedia').addEventListener('change', saveSettings);
    document.getElementById('blockNSFW').addEventListener('change', saveSettings);

    // تەرجىمان ھالىتىنى ئالماشتۇرۇش
    const translatorBtn = document.getElementById('toggleTranslator');
    translatorBtn.addEventListener('click', () => {
        chrome.storage.local.get(['translatorActive'], (data) => {
            const newState = !data.translatorActive;
            chrome.storage.local.set({ translatorActive: newState }, () => {
                if (newState) {
                    translatorBtn.style.backgroundColor = '#27ae60';
                    translatorBtn.textContent = 'تەرجىمە ھالىتى ئوچۇق';
                } else {
                    translatorBtn.style.backgroundColor = '#3498db';
                    translatorBtn.textContent = 'تەرجىمە ھالىتىنى قوزغىتىش';
                }
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleTranslator', active: newState });
                    }
                });
            });
        });
    });

    // تېز چۈشۈرۈش
    document.getElementById('quickDownloadBtn').addEventListener('click', () => {
        const url = document.getElementById('downloadUrl').value.trim();
        if (url) {
            chrome.downloads.download({ url: url }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    alert('چۈشۈرۈش مەغلۇپ بولدى: ' + chrome.runtime.lastError.message);
                } else {
                    alert('چۈشۈرۈش باشلاندى!');
                }
            });
        } else {
            alert('توغرا بولغان چۈشۈرۈش ئادرېسىنى كىرگۈزۈڭ!');
        }
    });
});