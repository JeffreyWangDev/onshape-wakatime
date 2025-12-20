chrome.storage.local.get().then((items) => {
    let api_key = document.getElementById("api_key");
    api_key.value = items.apiKey;
    api_key.addEventListener("change", function () {
        chrome.storage.local.set({ apiKey: api_key.value });
    });

    let enabled = document.getElementById("enabled");
    let toggleSwitch = document.getElementById("toggle-switch");

    enabled.checked = items.enabled;
    if (items.enabled) {
        toggleSwitch.classList.add("active");
    }

    toggleSwitch.addEventListener("click", function () {
        enabled.checked = !enabled.checked;
        if (enabled.checked) {
            toggleSwitch.classList.add("active");
        } else {
            toggleSwitch.classList.remove("active");
        }
        chrome.storage.local.set({ enabled: enabled.checked });
    });

    enabled.addEventListener("change", function () {
        chrome.storage.local.set({ enabled: enabled.checked });
    });

    let msg = document.getElementById("msg");
    msg.innerText = items.msg;

    let api_url = document.getElementById("api_url");
    api_url.value = items.api_url;
    api_url.addEventListener("change", function () {
        chrome.storage.local.set({ api_url: api_url.value });
    });

    let sendHeartbeat = document.getElementById("sendHeartbeat");
    sendHeartbeat.addEventListener("click", function () {
        const originalText = sendHeartbeat.textContent;
        sendHeartbeat.textContent = "Sending...";
        sendHeartbeat.disabled = true;
        sendHeartbeat.style.cursor = "not-allowed";

        chrome.runtime.sendMessage({ msg: "forceSendHeartbeat" }, (response) => {
            if (response && response.success) {
                sendHeartbeat.textContent = originalText;
                sendHeartbeat.disabled = false;
                sendHeartbeat.style.backgroundColor = "#4CAF50";
                sendHeartbeat.style.cursor = "pointer";
            } else {
                sendHeartbeat.textContent = "Failed to send heartbeat";
                
                sendHeartbeat.style.backgroundColor = "#f44336";
                sendHeartbeat.style.cursor = "pointer";
                setTimeout(() => {
                    sendHeartbeat.textContent = originalText;
                    sendHeartbeat.disabled = false;
                    sendHeartbeat.style.backgroundColor = "#4CAF50";
                    
                }, 2000);
            }

        });
    });

    updateTotalTimeDisplay(items);
});

button = document.getElementById("help");
button.addEventListener("click", link_open);
function link_open() {
    chrome.tabs.create({ url: "https://github.com/JeffreyWangDev/onshape-wakatime/tree/main?tab=readme-ov-file#hackatime-implementation" });
}

function formatTime(totalSeconds) {
    if (!totalSeconds || totalSeconds === 0) {
        return "0h 0m";
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

function formatTimeAgo(dateString) {
    const now = new Date();
    const updateTime = new Date(dateString);
    const diffInSeconds = Math.floor((now - updateTime) / 1000);

    if (diffInSeconds < 60) {
        return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
    }
}

function updateTotalTimeDisplay(items) {
    let totalTimeElement = document.getElementById("total-time-value");

    if (items.currentProjectTime && items.lastTimeUpdate) {
        let totalSeconds = items.currentProjectTime;
        let timeAgo = formatTimeAgo(items.lastTimeUpdate);

        let timeText = `Time: ${formatTime(totalSeconds)}`;
        timeText += ` (updated ${timeAgo})`;

        totalTimeElement.textContent = timeText;
    } else {
        totalTimeElement.textContent = "Time: No data available";
    }
}

setInterval(function () {
    chrome.storage.local.get().then((items) => {
        let msg = document.getElementById("msg");
        msg.innerText = items.msg;
        updateTotalTimeDisplay(items);
    });
}, 1000);
