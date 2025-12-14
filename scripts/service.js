
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.msg === "forceSendHeartbeat") {
    sendHeartbeat().then(() => {
      sendResponse({ success: true });
    }).catch(() => {
      sendResponse({ success: false });
    });
    return true; 
  }
});
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    chrome.storage.local.set({
      apiKey: "",
      heartbeats: [],
      enabled: true,
      msg: "",
      api_url: "https://hackatime.hackclub.com/api/hackatime/v1"
    });
  }
});

function sendHeartbeat() {
  console.log("Sending heartbeat");
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get().then((items) => {
        let enabled = items.enabled;
        if (!enabled) {
          chrome.storage.local.set({ msg: "Please enable the extension first." });
          reject(new Error("Extension disabled"));
          return;
        }
        let heartbeats = items.heartbeats;
        let apiKey = items.apiKey;
        if (apiKey === "") {
          chrome.storage.local.set({ msg: "Please set your WakaTime API key." });
          reject(new Error("No API key"));
          return;
        }
        let api_url = items.api_url;
        if (api_url === "") {
          chrome.storage.local.set({ msg: "Please set your WakaTime API URL." });
          reject(new Error("No API URL"));
          return;
        }
        try {
          if (heartbeats.length === 0) {
            chrome.storage.local.set({ msg: "No heartbeats to send, click around the OnShape interface to generate some." });
            reject(new Error("No heartbeats"));
            return;
          }
        } catch (e) {
          reject(e);
          return;
        }


        fetch(api_url + "/users/current/heartbeats.bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
              Authorization: api_url.includes("hackatime") ? `Bearer ${apiKey}` : `Basic ${apiKey}`,
          },
          body: JSON.stringify(heartbeats),
        })
          .then((response) => {
            if (response.ok) {
              chrome.storage.local.set({ heartbeats: [] });
              chrome.storage.local.set({ msg: "Heartbeats sent successfully at " + new Date().toLocaleTimeString() });
              resolve();
            } else if (response.status == 401) {
              chrome.storage.local.set({ msg: "Error: API key invalid" });
              reject(new Error("API key invalid"));
            } else if (response.status == 403) {
              chrome.storage.local.set({ msg: "Error: API key invalid" });
              reject(new Error("API key invalid"));
            }
            else {
              chrome.storage.local.set({ msg: "Error: Something went wrong! " + response.status.toString() });
              reject(new Error("API error"));
            }
          })
          .catch((error) => {
            reject(error);
          });
      }).catch((error) => {
        reject(error);
      });
    }
    catch (e) {
      console.log(e);
      reject(e);
    }
  });
}


function updateCurrentTime() {
  chrome.storage.local.get().then((items) => {
    let apiKey = items.apiKey;
    let api_url = items.api_url;
    if (apiKey === "" || api_url === "") {
      return;
    }

    fetch(api_url + "/users/current/statusbar/today", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: api_url.includes("hackatime") ? `Bearer ${apiKey}` : `Basic ${apiKey}`,
      }
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else if (response.status == 401) {
          chrome.storage.local.set({ msg: "Error: API key invalid" });
          throw new Error("API key invalid");
        } else if (response.status == 403) {
          chrome.storage.local.set({ msg: "Error: API key invalid" });
          throw new Error("API key invalid");
        } else {
          chrome.storage.local.set({ msg: "Error: Something went wrong! " + response.status.toString() });
          throw new Error("API error");
        }
      })
      .then((data) => {
        chrome.storage.local.set({ 
          currentProjectTime: data["data"]["grand_total"]["total_seconds"],
          lastTimeUpdate: new Date().toISOString()
        });
      })
      .catch((error) => {
        chrome.storage.local.set({ msg: "Error updating current time: " + error.message });
        console.log("Error updating current time:", error);
      });
  });
}

async function createHeartbeatTimer() {
  const alarm = await chrome.alarms.get("sendHeartbeat");
  if (typeof alarm === 'undefined') {
    chrome.alarms.create("sendHeartbeat", {
      delayInMinutes: 2,
      periodInMinutes: 2
    });
    sendHeartbeat().catch((error) => {
      chrome.storage.local.set({ msg: "Initial heartbeat failed: " + error.message });
      console.log("Initial heartbeat failed:", error);
    });
  }
}
createHeartbeatTimer();

async function createUpdateTimeTimer() {
  const alarm = await chrome.alarms.get("updateCurrentTime");
  if (typeof alarm === 'undefined') {
    chrome.alarms.create("updateCurrentTime", {
      delayInMinutes: 1,
      periodInMinutes: 1
    });
  }
}
createUpdateTimeTimer();



chrome.alarms.onAlarm.addListener((alarm) => {
  console.log("Alarm triggered:", alarm.name);
  if (alarm.name == "sendHeartbeat") {
    sendHeartbeat().catch((error) => {
      chrome.storage.local.set({ msg: "Scheduled heartbeat failed: " + error.message });
    });
  }
  else if (alarm.name == "updateCurrentTime") {
    updateCurrentTime();
  }
});