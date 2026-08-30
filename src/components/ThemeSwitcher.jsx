import { useTheme } from '../context/ThemeContext';

const OPTIONS = [
  { value: 'system', label: 'System', icon: '◐' },
  { value: 'light', label: 'Light', icon: '☀' },
  { value: 'dark', label: 'Dark', icon: '☾' },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <label className="relative inline-flex items-center gap-2 text-xs font-medium text-muted">
      <span className="sr-only">Theme</span>
      <span aria-hidden="true" className="text-sm">{OPTIONS.find((option) => option.value === theme)?.icon}</span>
      <select
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
        className="appearance-none bg-bg border border-border text-ink rounded-lg pl-2.5 pr-7 py-1.5 text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-label="Theme"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute right-2">⌄</span>
    </label>
  );
}
