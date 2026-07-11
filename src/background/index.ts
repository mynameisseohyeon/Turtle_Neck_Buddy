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
      iconUrl: "icons/icon.png",
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

  const settings = {
    ...DEFAULT_OVERLAY_SETTINGS,
    nextReminderAt: new Date(Date.now() + DEFAULT_REMINDER_INTERVAL_MINUTES * 60 * 1000).toISOString()
  };
  await chrome.storage.local.set({ [OVERLAY_SETTINGS_STORAGE_KEY]: settings });

  return settings;
}

function scheduleReminderAlarm(settings: Awaited<ReturnType<typeof getOverlaySettings>>) {
  const nextReminderAt = settings.nextReminderAt ? Date.parse(settings.nextReminderAt) : Number.NaN;
  const delayInMinutes = Number.isFinite(nextReminderAt)
    ? Math.max(1 / 60, (nextReminderAt - Date.now()) / 60_000)
    : settings.reminderIntervalMinutes;
  void chrome.alarms.create(REMINDER_ALARM_NAME, {
    delayInMinutes,
    periodInMinutes: settings.reminderIntervalMinutes
  });
}

function isInDoNotDisturbWindow(settings: Awaited<ReturnType<typeof getOverlaySettings>>, now = new Date()) {
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
  };
  const start = toMinutes(settings.doNotDisturbStart);
  const end = toMinutes(settings.doNotDisturbEnd);
  if (start === null || end === null || start === end) {
    return false;
  }

  const current = now.getHours() * 60 + now.getMinutes();
  return start < end ? current >= start && current < end : current >= start || current < end;
}

function canShowReminder(settings: Awaited<ReturnType<typeof getOverlaySettings>>, now = Date.now()) {
  if (!settings.overlayEnabled) {
    return false;
  }

  if (isInDoNotDisturbWindow(settings, new Date(now))) {
    return false;
  }

  if (settings.nextReminderAt) {
    const nextReminderAt = Date.parse(settings.nextReminderAt);
    return !Number.isFinite(nextReminderAt) || now >= nextReminderAt;
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
      lastReminderShownAt: now.toISOString(),
      nextReminderAt: new Date(now.getTime() + settings.reminderIntervalMinutes * 60 * 1000).toISOString()
    }
  });
}

async function snoozeReminder(snoozeMinutes: number, tabId?: number) {
  const settings = await getOverlaySettings();
  const nextSettings = {
    ...settings,
    nextReminderAt: new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString()
  };
  await chrome.storage.local.set({ [OVERLAY_SETTINGS_STORAGE_KEY]: nextSettings });
  scheduleReminderAlarm(nextSettings);

  if (tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, { type: "HIDE_STRETCH_REMINDER" } satisfies BackgroundToOverlayMessage);
    } catch {
      // The overlay can already be gone when the page navigated during snooze.
    }
  }
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
    scheduleReminderAlarm(settings);
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
      scheduleReminderAlarm(settings);
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

  if (message.type === "RESCHEDULE_STRETCH_REMINDER") {
    void getOverlaySettings().then((settings) => {
      scheduleReminderAlarm(settings);
      sendResponse({ type: "OVERLAY_PREVIEW_RESULT", payload: { ok: true } });
    });
    return true;
  }

  if (message.type === "SNOOZE_STRETCH_REMINDER") {
    void snoozeReminder(message.payload.snoozeMinutes, _sender.tab?.id).then(() => {
      sendResponse({ type: "OVERLAY_PREVIEW_RESULT", payload: { ok: true } });
    });
    return true;
  }

  return undefined;
});
