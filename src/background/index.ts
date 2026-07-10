import type {
  BackgroundToOverlayMessage,
  CurrentSiteOverlayPermissionState,
  PopupToBackgroundMessage
} from "../shared/overlayMessages";
import {
  DEFAULT_OVERLAY_SETTINGS,
  DEFAULT_REMINDER_INTERVAL_MINUTES,
  normalizeOverlaySettings,
  OVERLAY_SETTINGS_STORAGE_KEY
} from "../shared/overlaySettings";

const REMINDER_ALARM_NAME = "turtle-neck-buddy-reminder";
const OVERLAY_SCRIPT_FILE = "content/overlay.js";

async function showExtensionNotice(message: string) {
  try {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Turtle Neck Buddy",
      message
    });
    return true;
  } catch {
    return false;
  }
}

function getSupportedOrigin(urlString?: string): { hostname: string; originPattern: string } | null {
  if (!urlString) {
    return null;
  }

  try {
    const url = new URL(urlString);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return {
      hostname: url.hostname,
      originPattern: `${url.origin}/*`
    };
  } catch {
    return null;
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getOverlaySettings() {
  const storedSettings = await chrome.storage.local.get(OVERLAY_SETTINGS_STORAGE_KEY);
  return normalizeOverlaySettings(storedSettings[OVERLAY_SETTINGS_STORAGE_KEY]);
}

async function saveDefaultOverlaySettings() {
  const storedSettings = await chrome.storage.local.get(OVERLAY_SETTINGS_STORAGE_KEY);

  if (storedSettings[OVERLAY_SETTINGS_STORAGE_KEY]) {
    return getOverlaySettings();
  }

  await chrome.storage.local.set({
    [OVERLAY_SETTINGS_STORAGE_KEY]: DEFAULT_OVERLAY_SETTINGS
  });

  return DEFAULT_OVERLAY_SETTINGS;
}

function scheduleReminderAlarm(intervalMinutes: number) {
  void chrome.alarms.create(REMINDER_ALARM_NAME, {
    delayInMinutes: intervalMinutes,
    periodInMinutes: intervalMinutes
  });
}

function canShowReminder(settings: Awaited<ReturnType<typeof getOverlaySettings>>, now = Date.now()) {
  if (!settings.overlayEnabled) {
    return false;
  }

  if (!settings.lastReminderShownAt) {
    return true;
  }

  const lastShownAt = new Date(settings.lastReminderShownAt).getTime();

  if (!Number.isFinite(lastShownAt)) {
    return true;
  }

  return now - lastShownAt >= settings.reminderIntervalMinutes * 60 * 1000;
}

async function markReminderShown(settings: Awaited<ReturnType<typeof getOverlaySettings>>, now = new Date()) {
  await chrome.storage.local.set({
    [OVERLAY_SETTINGS_STORAGE_KEY]: {
      ...settings,
      lastReminderShownAt: now.toISOString()
    }
  });
}

async function getCurrentSiteOverlayPermission(): Promise<CurrentSiteOverlayPermissionState> {
  const tab = await getActiveTab();
  const supportedOrigin = getSupportedOrigin(tab?.url);

  if (!supportedOrigin) {
    return {
      isSupported: false,
      origin: null,
      hostname: null,
      granted: false,
      reason: "unsupported-url"
    };
  }

  const granted = await chrome.permissions.contains({ origins: [supportedOrigin.originPattern] });

  return {
    isSupported: true,
    origin: supportedOrigin.originPattern,
    hostname: supportedOrigin.hostname,
    granted
  };
}

async function showOverlayInActiveTab() {
  const tab = await getActiveTab();
  const supportedOrigin = getSupportedOrigin(tab?.url);

  if (!tab?.id || !supportedOrigin) {
    return { ok: false, reason: "unsupported-url" as const };
  }

  const granted = await chrome.permissions.contains({ origins: [supportedOrigin.originPattern] });

  if (!granted) {
    return { ok: false, reason: "permission-required" as const };
  }

  const message: BackgroundToOverlayMessage = {
    type: "SHOW_STRETCH_REMINDER",
    payload: {
      reminderId: `preview-${Date.now()}`,
      triggeredAt: new Date().toISOString()
    }
  };

  try {
    await chrome.tabs.sendMessage(tab.id, message);
    return { ok: true };
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [OVERLAY_SCRIPT_FILE]
      });
      await chrome.tabs.sendMessage(tab.id, message);
      return { ok: true };
    } catch {
      return { ok: false, reason: "injection-failed" as const };
    }
  }
}

async function deliverScheduledReminder(settings: Awaited<ReturnType<typeof getOverlaySettings>>) {
  let overlayDelivered = false;

  try {
    overlayDelivered = (await showOverlayInActiveTab()).ok;
  } catch {
    overlayDelivered = false;
  }

  // Chrome internal pages cannot host content scripts, so retain a visible fallback there.
  const delivered = overlayDelivered
    ? true
    : await showExtensionNotice("목 쉬는 시간이에요. 30초만 스트레칭해요.");

  if (delivered) {
    await markReminderShown(settings);
  }
}

async function showOverlayFromActionClick(tab: chrome.tabs.Tab) {
  const supportedOrigin = getSupportedOrigin(tab.url);

  if (!tab.id || !supportedOrigin) {
    showExtensionNotice("이 페이지에는 거북이를 띄울 수 없어요. http 또는 https 페이지에서 다시 눌러주세요.");
    return;
  }

  const message: BackgroundToOverlayMessage = {
    type: "SHOW_STRETCH_REMINDER",
    payload: {
      reminderId: `action-${Date.now()}`,
      triggeredAt: new Date().toISOString()
    }
  };

  try {
    await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [OVERLAY_SCRIPT_FILE]
      });
      await chrome.tabs.sendMessage(tab.id, message);
    } catch {
      showExtensionNotice("현재 페이지에 거북이를 띄우지 못했어요. 페이지를 새로고침한 뒤 다시 눌러주세요.");
    }
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void saveDefaultOverlaySettings().then((settings) => {
    scheduleReminderAlarm(settings.reminderIntervalMinutes);
  });
});

chrome.action.onClicked.addListener((tab) => {
  void showOverlayFromActionClick(tab);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== REMINDER_ALARM_NAME) {
    return;
  }

  void getOverlaySettings().then((settings) => {
    if (!canShowReminder(settings)) {
      return;
    }

    void deliverScheduledReminder(settings);
  });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[OVERLAY_SETTINGS_STORAGE_KEY]) {
    return;
  }

  const settings = normalizeOverlaySettings(changes[OVERLAY_SETTINGS_STORAGE_KEY].newValue);
  void chrome.alarms.clear(REMINDER_ALARM_NAME, () => {
    if (settings.overlayEnabled) {
      scheduleReminderAlarm(settings.reminderIntervalMinutes || DEFAULT_REMINDER_INTERVAL_MINUTES);
    }
  });
});

chrome.runtime.onMessage.addListener((message: PopupToBackgroundMessage, _sender, sendResponse) => {
  if (message.type === "GET_CURRENT_SITE_OVERLAY_PERMISSION") {
    void getCurrentSiteOverlayPermission().then((payload) => {
      sendResponse({
        type: "CURRENT_SITE_OVERLAY_PERMISSION",
        payload
      });
    });
    return true;
  }

  if (message.type === "PREVIEW_OVERLAY_ON_CURRENT_TAB") {
    void showOverlayInActiveTab().then((payload) => {
      sendResponse({
        type: "OVERLAY_PREVIEW_RESULT",
        payload
      });
    });
    return true;
  }

  return undefined;
});
