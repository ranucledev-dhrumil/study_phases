const NMH_HOST = "com.secondbrain.host";
const MENU_ID_SELECTION = "save-selection-snippet";
const MENU_ID_PAGE = "save-page-second-brain";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    // 1. Save selection menu item
    chrome.contextMenus.create({
      id: MENU_ID_SELECTION,
      title: "Save selection to Second Brain",
      contexts: ["selection"],
    });

    // 2. Save page menu item
    chrome.contextMenus.create({
      id: MENU_ID_PAGE,
      title: "Save page to Second Brain",
      contexts: ["page", "frame", "link"],
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const pageUrl = (info.menuItemId === MENU_ID_PAGE && info.linkUrl) ? info.linkUrl : (tab?.url || "");
  let hostname = pageUrl;
  try {
    hostname = new URL(pageUrl).hostname || pageUrl;
  } catch {
    // Keep the raw URL when it isn't a standard URL.
  }

  if (info.menuItemId === MENU_ID_SELECTION) {
    const selectedText = (info.selectionText || "").trim();
    if (!selectedText) return;

    // --- Path A: Existing standalone chrome.storage.local save (unchanged) ---
    const newItem = {
      id: crypto.randomUUID(),
      type: "snippet",
      title: `Snippet from ${hostname}`,
      code: selectedText,
      sourceUrl: pageUrl,
      tags: [],
      createdAt: Date.now(),
    };

    try {
      const result = await chrome.storage.local.get("items");
      const items = Array.isArray(result.items) ? result.items : [];
      items.unshift(newItem);
      await chrome.storage.local.set({ items });
    } catch (e) {
      console.warn("[Second Brain] chrome.storage.local write failed:", e);
    }

    // --- Path B: Send to Second Brain desktop app via Native Messaging ---
    const msg = {
      version: 1,
      action: "capture",
      payload: {
        title: tab?.title || `Snippet from ${hostname}`,
        url: pageUrl,
        selectedText: selectedText,
        source: "chrome",
        timestamp: Date.now(),
      },
    };
    sendToNativeHost(msg);
  } else if (info.menuItemId === MENU_ID_PAGE) {
    // Save page to Second Brain desktop app
    const msg = {
      version: 1,
      action: "capture",
      payload: {
        title: tab?.title || `Page from ${hostname}`,
        url: pageUrl,
        selectedText: "",
        source: "chrome",
        timestamp: Date.now(),
      },
    };
    sendToNativeHost(msg);
  }
});

function sendToNativeHost(msg) {
  try {
    chrome.runtime.sendNativeMessage(NMH_HOST, msg, (response) => {
      if (chrome.runtime.lastError || !response || response.ok === false) {
        const errMsg = chrome.runtime.lastError?.message || response?.error || "Second Brain app is not running";
        console.warn("[Second Brain] Native messaging error:", errMsg);
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon128.png",
          title: "Second Brain",
          message: "Second Brain isn't running. Nothing was saved. Open the app and try again.",
          priority: 1,
        });
      } else {
        console.log("[Second Brain] Desktop app acknowledged save:", response);
      }
    });
  } catch (err) {
    console.warn("[Second Brain] sendNativeMessage exception:", err);
  }
}
