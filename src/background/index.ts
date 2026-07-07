const REMINDER_ALARM_NAME = "turtle-neck-buddy-reminder";

chrome.runtime.onInstalled.addListener(() => {
  void chrome.alarms.create(REMINDER_ALARM_NAME, {
    delayInMinutes: 50,
    periodInMinutes: 50
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== REMINDER_ALARM_NAME) {
    return;
  }

  // Overlay injection is intentionally handled in a later issue after optional host permission UX is in place.
  void chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "Turtle Neck Buddy",
    message: "목 쉬는 시간이에요. 30초만 스트레칭해요."
  });
});
