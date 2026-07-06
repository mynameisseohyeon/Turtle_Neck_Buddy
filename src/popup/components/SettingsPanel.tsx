const REMINDER_INTERVALS = [30, 40, 50, 60] as const;

export function SettingsPanel() {
  return (
    <section className="settings-panel" aria-label="알림 설정">
      <label>
        <span>알림 간격</span>
        <select defaultValue={50}>
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
    </section>
  );
}
