const fs = require('fs');
let code = fs.readFileSync('components/dashboard/slot-zero-monitor.tsx', 'utf8');

// We want to transform tailwind classes that represent dark mode into their light/dark equivalents.
// For example:
// "bg-black" -> "bg-slate-50 dark:bg-black"
// "text-white" -> "text-slate-900 dark:text-white"

function replaceClass(source, pattern, lightVersion, darkVersion) {
    const rx = new RegExp(`(?<!\\w|dark:)${pattern}`, 'g');
    return source.replace(rx, `${lightVersion} dark:${darkVersion || pattern}`);
}

// Order matters
code = replaceClass(code, 'bg-black/80', 'bg-white/80', 'bg-black/80');
code = replaceClass(code, 'bg-black', 'bg-slate-50', 'bg-black');
code = replaceClass(code, 'text-white/20', 'text-slate-500', 'text-white/20');
code = replaceClass(code, 'text-white/30', 'text-slate-600', 'text-white/30');
code = replaceClass(code, 'text-white/40', 'text-slate-600', 'text-white/40');
code = replaceClass(code, 'text-white/60', 'text-slate-700', 'text-white/60');
code = replaceClass(code, 'text-white/80', 'text-slate-800', 'text-white/80');
code = replaceClass(code, 'text-white', 'text-slate-900', 'text-white');
code = replaceClass(code, 'text-white/\\[0\\.3\\]', 'text-slate-600', 'text-white/[0.3]');

code = replaceClass(code, 'border-white/5', 'border-slate-200', 'border-white/5');
code = replaceClass(code, 'border-white/10', 'border-slate-300', 'border-white/10');
code = replaceClass(code, 'border-white/20', 'border-slate-400', 'border-white/20');

code = replaceClass(code, 'bg-white/\\\[0\\.02\\\]', 'bg-white', 'bg-white/[0.02]');
code = replaceClass(code, 'bg-white/\\\[0\\.03\\\]', 'bg-slate-50', 'bg-white/[0.03]');
code = replaceClass(code, 'bg-white/5', 'bg-slate-100', 'bg-white/5');
code = replaceClass(code, 'bg-white/10', 'bg-slate-200', 'bg-white/10');

// Specifically handle charts inside ResponsiveContainer later if needed. Recharts strokes are usually set by props.
code = code.replace(/rgba\(255,255,255,0\.05\)/g, "var(--chart-grid)");
code = code.replace(/rgba\(255,255,255,0\.2\)/g, "var(--chart-axis)");
code = code.replace(/rgba\(255,255,255,0\.4\)/g, "var(--chart-label)");
code = code.replace(/rgba\(0,0,0,0\.95\)/g, "var(--chart-bg)");

fs.writeFileSync('components/dashboard/slot-zero-monitor.tsx', code);
