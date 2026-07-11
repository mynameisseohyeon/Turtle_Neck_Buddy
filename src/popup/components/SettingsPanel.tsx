const REMINDER_INTERVALS = [20, 30, 40, 50, 60] as const;

type SettingsPanelProps = {
  reminderIntervalMinutes: number;
  onChangeReminderInterval: (intervalMinutes: number) => Promise<void>;
  onOpenOnboarding: () => void;
};

export function SettingsPanel({
  reminderIntervalMinutes,
  onChangeReminderInterval,
  onOpenOnboarding
}: SettingsPanelProps) {
  return (
    <section className="settings-panel" aria-label="알림 설정">
      <label>
        <span>알림 간격</span>
        <select
          value={reminderIntervalMinutes}
          onChange={(event) => void onChangeReminderInterval(Number(event.target.value))}
        >
          {REMINDER_INTERVALS.map((interval) => (
            <option key={interval} value={interval}>
              {interval}분
            </option>
          ))}
        </select>
      </label>
      <label className="toggle-control">
        <span>알림 사용</span>
        <input type="checkbox" defaultChecked />
      </label>
      <button type="button" className="ghost-button">
        오늘 기록 초기화
      </button>
      <button type="button" className="ghost-button" onClick={onOpenOnboarding}>
        처음 사용 안내 다시 보기
      </button>
    </section>
  );
}
