import Zap from "lucide-react/dist/esm/icons/zap";
import Shield from "lucide-react/dist/esm/icons/shield";
import Monitor from "lucide-react/dist/esm/icons/monitor";

interface StatItem {
  label: string;
  value: string;
  icon?: "zap" | "shield" | "monitor";
  highlight?: boolean;
}

interface StatsGridProps {
  items: StatItem[];
  signal?: "active" | "inactive" | "none";
}

export function StatsGrid({ items, signal = "active" }: StatsGridProps) {
  const signalColor = signal === "active" ? "bg-green-500" : signal === "inactive" ? "bg-red-500" : "bg-yellow-500";
  const signalLabel = signal === "active" ? "ACTIVE" : signal === "inactive" ? "DOWN" : "CHECKING";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <span className={`w-1.5 h-1.5 rounded-full ${signalColor} animate-pulse`} />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Signal</span>
        </div>
        <p className="font-mono text-sm font-bold text-green-500">{signalLabel}</p>
        <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Status</p>
      </div>

      {items.map((item, i) => (
        <div key={i} className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
          {item.icon === "zap" && <Zap className="w-4 h-4 text-fg-faint group-hover:text-red-500/60 mx-auto mb-2 transition-colors" />}
          {item.icon === "shield" && <Shield className="w-4 h-4 text-fg-faint group-hover:text-red-500/60 mx-auto mb-2 transition-colors" />}
          {item.icon === "monitor" && <Monitor className="w-4 h-4 text-fg-faint group-hover:text-red-500/60 mx-auto mb-2 transition-colors" />}
          <p className={`font-mono text-sm font-bold ${item.highlight ? "text-red-400" : "text-fg"}`}>{item.value}</p>
          <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
