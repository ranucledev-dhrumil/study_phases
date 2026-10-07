const DRAFT_KEY = "draft:active";
const ITEMS_KEY = "items";
const DRAFT_DEBOUNCE_MS = 500;

let currentType = "link";
let draftSaveTimer = null;
let editingId = null;

const $ = (id) => document.getElementById(id);

const tabCaptureBtn = $("tab-capture-btn");
const tabVaultBtn = $("tab-vault-btn");
const captureView = $("capture-view");
const vaultView = $("vault-view");
const vaultCount = $("vault-count");

const linkFields = $("link-fields");
const snippetFields = $("snippet-fields");
const draftBanner = $("draft-banner");

const linkTitleEl = $("link-title");
const linkUrlEl = $("link-url");
const linkDescEl = $("link-description");
const snippetTitleEl = $("snippet-title");
const snippetCodeEl = $("snippet-code");
const tagsEl = $("item-tags");

async function getItems() {
  const result = await chrome.storage.local.get(ITEMS_KEY);
  return Array.isArray(result[ITEMS_KEY]) ? result[ITEMS_KEY] : [];
}

async function setItems(items) {
  await chrome.storage.local.set({ [ITEMS_KEY]: items });
}

async function getDraft() {
  const result = await chrome.storage.local.get(DRAFT_KEY);
  return result[DRAFT_KEY] || null;
}

async function saveDraftNow() {
  const draft = {
    type: currentType,
    linkTitle: linkTitleEl.value,
    linkUrl: linkUrlEl.value,
    linkDescription: linkDescEl.value,
    snippetTitle: snippetTitleEl.value,
    snippetCode: snippetCodeEl.value,
    tags: tagsEl.value,
  };
  await chrome.storage.local.set({ [DRAFT_KEY]: draft });
}

function hasMeaningfulContent() {
  if (currentType === "link") {
    return linkDescEl.value.trim() || tagsEl.value.trim();
  }
  return snippetTitleEl.value.trim() || snippetCodeEl.value.trim() || tagsEl.value.trim();
}

function scheduleDraftSave() {
  clearTimeout(draftSaveTimer);
  draftSaveTimer = setTimeout(async () => {
    try {
      if (hasMeaningfulContent()) await saveDraftNow();
      else await clearDraft();
    } catch (error) {
      console.error("Could not save draft:", error);
    }
  }, DRAFT_DEBOUNCE_MS);
}

async function clearDraft() {
  clearTimeout(draftSaveTimer);
  await chrome.storage.local.remove(DRAFT_KEY);
  draftBanner.classList.add("hidden");
}

[linkTitleEl, linkDescEl, snippetTitleEl, snippetCodeEl, tagsEl].forEach((el) => {
  el.addEventListener("input", scheduleDraftSave);
});

$("discard-draft-btn").addEventListener("click", async () => {
  await clearDraft();
  await populateFromActiveTab();
});

function setType(type, persistDraft = true) {
  currentType = type;
  $("type-link-btn").classList.toggle("active", type === "link");
  $("type-snippet-btn").classList.toggle("active", type === "snippet");
  linkFields.classList.toggle("hidden", type !== "link");
  snippetFields.classList.toggle("hidden", type !== "snippet");
  if (persistDraft) scheduleDraftSave();
}

$("type-link-btn").addEventListener("click", () => setType("link"));
$("type-snippet-btn").addEventListener("click", () => setType("snippet"));

function showCaptureTab() {
  tabCaptureBtn.classList.add("active");
  tabVaultBtn.classList.remove("active");
  captureView.classList.remove("hidden");
  vaultView.classList.add("hidden");
}

async function showVaultTab() {
  tabCaptureBtn.classList.remove("active");
  tabVaultBtn.classList.add("active");
  captureView.classList.add("hidden");
  vaultView.classList.remove("hidden");
  await renderVaultList();
}

tabCaptureBtn.addEventListener("click", showCaptureTab);
tabVaultBtn.addEventListener("click", showVaultTab);

async function getActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab || {};
  } catch {
    return {};
  }
}

async function populateFromActiveTab() {
  const tab = await getActiveTab();
  linkTitleEl.value = tab.title || "";
  linkUrlEl.value = tab.url || "";
  linkDescEl.value = "";
  snippetTitleEl.value = "";
  snippetCodeEl.value = "";
  tagsEl.value = "";
  setType("link", false);
}

function draftHasMeaningfulContent(draft) {
  if (!draft || !["link", "snippet"].includes(draft.type)) return false;
  if (draft.type === "link") {
    return Boolean((draft.linkDescription || "").trim() || (draft.tags || "").trim());
  }
  return Boolean(
    (draft.snippetTitle || "").trim() ||
    (draft.snippetCode || "").trim() ||
    (draft.tags || "").trim()
  );
}

async function init() {
  try {
    const [draft, items] = await Promise.all([getDraft(), getItems()]);
    vaultCount.textContent = items.length;

    if (draftHasMeaningfulContent(draft)) {
      linkTitleEl.value = draft.linkTitle || "";
      linkUrlEl.value = draft.linkUrl || "";
      linkDescEl.value = draft.linkDescription || "";
      snippetTitleEl.value = draft.snippetTitle || "";
      snippetCodeEl.value = draft.snippetCode || "";
      tagsEl.value = draft.tags || "";
      setType(draft.type, false);
      draftBanner.classList.remove("hidden");
    } else {
      if (draft) await clearDraft();
      await populateFromActiveTab();
    }
  } catch (error) {
    console.error("Initialization failed:", error);
    $("capture-status").textContent = "Could not load your vault.";
  }
}

$("save-item-btn").addEventListener("click", async () => {
  const statusEl = $("capture-status");
  statusEl.textContent = "";

  try {
    const tags = tagsEl.value.split(",").map((tag) => tag.trim()).filter(Boolean);
    let newItem;

    if (currentType === "link") {
      const title = linkTitleEl.value.trim();
      const url = linkUrlEl.value.trim();
      if (!url) {
        statusEl.textContent = "URL is required.";
        return;
      }
      newItem = {
        id: crypto.randomUUID(),
        type: "link",
        title: title || url,
        url,
        description: linkDescEl.value.trim(),
        tags,
        createdAt: Date.now(),
      };
    } else {
      const title = snippetTitleEl.value.trim();
      const code = snippetCodeEl.value.trim();
      if (!code) {
        statusEl.textContent = "Text or code is required.";
        return;
      }
      const tab = await getActiveTab();
      newItem = {
        id: crypto.randomUUID(),
        type: "snippet",
        title: title || "Untitled snippet",
        code,
        sourceUrl: tab.url || "",
        tags,
        createdAt: Date.now(),
      };
    }

    const items = await getItems();
    items.unshift(newItem);
    await setItems(items);
    vaultCount.textContent = items.length;

    statusEl.textContent = "Saved to vault ✓";
    await clearDraft();
    await populateFromActiveTab();
  } catch (error) {
    console.error("Save failed:", error);
    statusEl.textContent = "Could not save this item.";
  }
});

function safeText(value) {
  return String(value ?? "");
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = safeText(value);
  return div.innerHTML;
}

function itemSearchText(item) {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  return [
    item.title, item.description, item.code, item.url, item.sourceUrl, ...tags
  ].map(safeText).join(" ").toLowerCase();
}

function itemPreview(item) {
  if (item.type === "snippet") return safeText(item.code);
  return safeText(item.description);
}

function displayUrl(item) {
  return item.type === "link" ? item.url : item.sourceUrl;
}

async function renderVaultList(filter = $("vault-search").value, typeFilter = $("vault-filter").value) {
  const items = await getItems();
  const listEl = $("vault-list");
  const q = safeText(filter).trim().toLowerCase();

  const filtered = items.filter((item) => {
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesType && (!q || itemSearchText(item).includes(q));
  });

  if (!filtered.length) {
    listEl.innerHTML = `<div class="empty-state">${q || typeFilter !== "all" ? "No matching items." : "Your vault is empty."}</div>`;
    return;
  }

  listEl.innerHTML = filtered.map((item) => {
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const created = Number(item.createdAt);
    const date = Number.isFinite(created) && created > 0
      ? new Date(created).toLocaleDateString()
      : "Unknown date";
    const preview = itemPreview(item);
    const url = displayUrl(item);

    return `
      <article class="vault-item" data-id="${escapeHtml(item.id)}">
        <div class="item-title">${escapeHtml(item.title || "Untitled")}
          <span class="item-type">· ${escapeHtml(item.type || "item")}</span>
        </div>
        <div class="item-meta">
          ${escapeHtml(date)}${tags.length ? ` · ${escapeHtml(tags.join(", "))}` : ""}
        </div>
        ${preview ? `<div class="item-preview">${escapeHtml(preview)}</div>` : ""}
        ${url ? `<span class="item-url">${escapeHtml(url)}</span>` : ""}
        <div class="item-actions">
          ${item.type === "link" && url ? `<button class="item-action open" type="button" data-id="${escapeHtml(item.id)}">Open</button>` : ""}
          ${item.type === "snippet" ? `<button class="item-action copy" type="button" data-id="${escapeHtml(item.id)}">Copy</button>` : ""}
          <button class="item-action edit" type="button" data-id="${escapeHtml(item.id)}">Edit</button>
          <button class="item-action delete" type="button" data-id="${escapeHtml(item.id)}">Delete</button>
        </div>
      </article>
    `;
  }).join("");

  listEl.querySelectorAll(".open").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const item = (await getItems()).find((x) => x.id === btn.dataset.id);
      if (item?.url) chrome.tabs.create({ url: item.url });
    });
  });

  listEl.querySelectorAll(".copy").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const item = (await getItems()).find((x) => x.id === btn.dataset.id);
      if (!item?.code) return;
      try {
        await navigator.clipboard.writeText(item.code);
        const old = btn.textContent;
        btn.textContent = "Copied ✓";
        setTimeout(() => { btn.textContent = old; }, 1200);
      } catch {
        btn.textContent = "Copy failed";
      }
    });
  });

  listEl.querySelectorAll(".edit").forEach((btn) => {
    btn.addEventListener("click", () => openEditor(btn.dataset.id));
  });

  listEl.querySelectorAll(".delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const current = await getItems();
      const item = current.find((x) => x.id === id);
      if (!item) return;

      const confirmed = window.confirm(`Delete "${item.title || "this item"}"?`);
      if (!confirmed) return;

      const next = current.filter((x) => x.id !== id);
      await setItems(next);
      vaultCount.textContent = next.length;
      await renderVaultList();
    });
  });
}

async function openEditor(id) {
  const items = await getItems();
  const item = items.find((x) => x.id === id);
  if (!item) return;

  editingId = id;
  $("modal-type").textContent = safeText(item.type || "item").toUpperCase();
  $("modal-title").textContent = item.type === "link" ? "Edit link" : "Edit snippet";
  $("edit-title").value = safeText(item.title);
  $("edit-tags").value = Array.isArray(item.tags) ? item.tags.join(", ") : "";

  const isLink = item.type === "link";
  $("edit-url-wrap").classList.toggle("hidden", !isLink);
  $("edit-description-wrap").classList.toggle("hidden", !isLink);
  $("edit-code-wrap").classList.toggle("hidden", isLink);

  if (isLink) {
    $("edit-url").value = safeText(item.url);
    $("edit-description").value = safeText(item.description);
  } else {
    $("edit-code").value = safeText(item.code);
  }

  $("edit-status").textContent = "";
  $("item-modal").classList.remove("hidden");
  $("edit-title").focus();
}

function closeEditor() {
  editingId = null;
  $("item-modal").classList.add("hidden");
}

$("close-modal-btn").addEventListener("click", closeEditor);
$("cancel-edit-btn").addEventListener("click", closeEditor);

$("item-modal").addEventListener("click", (event) => {
  if (event.target === $("item-modal")) closeEditor();
});

$("save-edit-btn").addEventListener("click", async () => {
  if (!editingId) return;

  const status = $("edit-status");
  status.textContent = "";

  try {
    const items = await getItems();
    const index = items.findIndex((x) => x.id === editingId);
    if (index < 0) {
      status.textContent = "Item no longer exists.";
      return;
    }

    const item = { ...items[index] };
    item.title = $("edit-title").value.trim() || (item.type === "link" ? safeText(item.url) : "Untitled snippet");
    item.tags = $("edit-tags").value.split(",").map((tag) => tag.trim()).filter(Boolean);

    if (item.type === "link") {
      const url = $("edit-url").value.trim();
      if (!url) {
        status.textContent = "URL is required.";
        return;
      }
      item.url = url;
      item.description = $("edit-description").value.trim();
    } else {
      const code = $("edit-code").value.trim();
      if (!code) {
        status.textContent = "Text or code is required.";
        return;
      }
      item.code = code;
    }

    item.updatedAt = Date.now();
    items[index] = item;
    await setItems(items);
    closeEditor();
    await renderVaultList();
  } catch (error) {
    console.error("Edit failed:", error);
    status.textContent = "Could not save changes.";
  }
});

$("vault-search").addEventListener("input", () => {
  renderVaultList();
});

$("vault-filter").addEventListener("change", () => {
  renderVaultList();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("item-modal").classList.contains("hidden")) {
    closeEditor();
  }
});

init();
