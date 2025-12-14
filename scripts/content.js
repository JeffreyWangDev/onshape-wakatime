
function popup_error(message, is_error=true) {
    try {
        let container = document.getElementById("onshape-wakatime-info-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "onshape-wakatime-info-container";
            container.style.position = "fixed";
            container.style.top = "12px";
            container.style.right = "12px";
            container.style.zIndex = "2147483647";
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.gap = "8px";
            document.body.appendChild(container);
        }

        const item = document.createElement("div");
        item.textContent = message;
        item.style.maxWidth = "360px";
        item.style.padding = "10px 12px";
        item.style.borderRadius = "6px";
        item.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        if (!is_error) {
            item.style.background = "#f0f7ff";
            item.style.color = "#083b6e";
            item.style.border = "1px solid #b9daff";
        } else {
            item.style.background = "#ffeded";
            item.style.color = "#7a1212";
            item.style.border = "1px solid #f5b5b5";
        }
        item.style.fontFamily = "Segoe UI, Roboto, Helvetica, Arial, sans-serif";
        item.style.fontSize = "13px";
        item.style.lineHeight = "18px";
        

        const close = document.createElement("button");
        close.type = "button";
        close.textContent = "✕";
        close.setAttribute("aria-label", "Dismiss error");
        close.style.marginLeft = "8px";
        close.style.border = "none";
        close.style.background = "transparent";
        close.style.color = "#7a1212";
        close.style.cursor = "pointer";
        close.style.fontSize = "14px";
        close.style.float = "right";
        close.addEventListener("click", () => {
            item.remove();
            if (container && container.childElementCount === 0) {
                container.remove();
            }
        });

        const title = document.createElement("div");
        if (is_error){
            title.textContent = "Onshape WakaTime: Error";
        }
        
        else{
            title.textContent = "WakaTime For Onshape";
        }

        title.style.fontWeight = "600";
        title.style.marginBottom = "4px";
        const body = document.createElement("div");
        body.textContent = message;

        item.innerHTML = "";
        item.appendChild(close);
        item.appendChild(title);
        item.appendChild(body);

        container.appendChild(item);

        setTimeout(() => {
            if (item && item.isConnected) {
                item.remove();
                if (container && container.childElementCount === 0) {
                    container.remove();
                }
            }
        },10000);
    } catch (_) {
        alert(message);
    }
}

function check_if_installed_correctly() {
    errors = chrome.storage.local.get().then((items) => {
        api_key = items.apiKey;
        if (!api_key || api_key.length == 0 || items.msg.includes("API key invalid")) {
            popup_error("It looks like your WakaTime API key is not set or is invalid. Open the extension popup and set your API key to enable tracking. (Click on the green WakaTime icon in the top right of your browser)");
        }
        else if (!items.enabled) {
            popup_error("The Onshape WakaTime extension is currently disabled. Open the extension popup and enable it to start tracking.");
        }
        else if (items.msg && items.msg.length > 0 && !items.msg.includes("successfully")) {
            popup_error("There was an error sending heartbeats:" + items.msg);
        }


    });
}

function waitForCanvas() {
    if (!window.location.href.includes("cad.onshape.com")) {
        return
    }
    if (document.getElementById("canvas")) {

        a = document.getElementById("canvas")
        a.addEventListener("click",
            handleClick
        );
        check_if_installed_correctly();
        
        return true;
        
    }
    window.setTimeout(waitForCanvas, 500);
}
const core = new WakaCore();
function handleClick() {
    
    if (!window.location.href.includes("cad.onshape.com")) {
        return
    }
    let url = window.location.href;
    let heatbeat = core.buildHeartbeat(url);
    // console.log(heatbeat);
    try{
        chrome.storage.local.set({ currentProject: core.getProjectName() });
        chrome.storage.local.get("heartbeats").then((item) => {
            if (!item.heartbeats) {
                item.heartbeats = []
            }
            item.heartbeats.push(heatbeat)
            chrome.storage.local.set({ heartbeats: item.heartbeats })
          });
    }catch(e){
        popup_error("An error occurred. Usually this is because you have not refreshed your page after installing the extension. Please refresh the page and try again.");
    }

}

function auto_set_api_key() {
    if (!window.location.href.includes("hackatime.hackclub.com")) {
        popup_error("Auto-set works only on hackatime.hackclub.com pages.");
        return;
    }
    if (window.location.href.includes("/my/settings?wakatime_autoset=0")) {
        try {
            const text = document.body ? document.body.innerText || "" : "";
            const match = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
            if (match && match[0]) {
                const key = match[0];
                chrome.storage.local.set({ apiKey: key }).then(() => {
                    popup_error("API key set automatically from this page.", false);
                    const url = new URL(window.location.href);
                    url.searchParams.delete("wakatime_autoset");
                    window.history.pushState({}, '', url);
                });
            } else {
                popup_error("Could not find an API key on this page.");
            }
        } catch (e) {
            popup_error("Failed to auto-set API key: " + (e && e.message ? e.message : "unknown error"));

        }
        return;
    }
    window.location.href = "https://hackatime.hackclub.com/my/settings?wakatime_autoset=0";
}


function popup_auto_set_api_key() {
    try {
        let container = document.getElementById("onshape-wakatime-error-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "onshape-wakatime-error-container";
            container.style.position = "fixed";
            container.style.top = "12px";
            container.style.right = "12px";
            container.style.zIndex = "2147483647";
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.gap = "8px";
            document.body.appendChild(container);
        }

        const item = document.createElement("div");
        item.style.maxWidth = "380px";
        item.style.padding = "12px";
        item.style.borderRadius = "6px";
        item.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        item.style.background = "#f0f7ff";
        item.style.color = "#083b6e";
        item.style.fontFamily = "Segoe UI, Roboto, Helvetica, Arial, sans-serif";
        item.style.fontSize = "13px";
        item.style.lineHeight = "18px";
        item.style.border = "1px solid #b9daff";

        const close = document.createElement("button");
        close.type = "button";
        close.textContent = "✕";
        close.setAttribute("aria-label", "Dismiss");
        close.style.marginLeft = "8px";
        close.style.border = "none";
        close.style.background = "transparent";
        close.style.color = "#083b6e";
        close.style.cursor = "pointer";
        close.style.fontSize = "14px";
        close.style.float = "right";
        close.addEventListener("click", () => {
            item.remove();
            if (container && container.childElementCount === 0) container.remove();
        });

        const title = document.createElement("div");
        title.textContent = "Onshape WakaTime: API Key";
        title.style.fontWeight = "600";
        title.style.marginBottom = "6px";

        const body = document.createElement("div");
        body.textContent = "It looks like your api key is invalid or not set! We can try to set it automatically from this page. This will open a new window where it will try to find your api key.";

        const action = document.createElement("button");
        action.type = "button";
        action.textContent = "Auto set API key";
        action.style.marginTop = "8px";
        action.style.padding = "6px 10px";
        action.style.borderRadius = "4px";
        action.style.border = "1px solid #1976d2";
        action.style.background = "#1976d2";
        action.style.color = "white";
        action.style.cursor = "pointer";
        action.addEventListener("click", auto_set_api_key);

        item.appendChild(close);
        item.appendChild(title);
        item.appendChild(body);
        item.appendChild(action);
        container.appendChild(item);

    } catch (_) {
        alert("Click OK, to set your API key automatically!");
        auto_set_api_key();
    }
}

function check_for_hackatime() {
    if (window.location.href.includes("hackatime.hackclub.com")) {
        if (window.location.href.includes("/my/settings?wakatime_autoset=0")) {
            auto_set_api_key();
            return;
        }
        errors = chrome.storage.local.get().then((items) => {
        api_key = items.apiKey;
        if (!api_key || api_key.length == 0 || items.msg.includes("API key invalid")) {
            popup_auto_set_api_key();
        }
    });
    }
}
check_for_hackatime()
waitForCanvas()