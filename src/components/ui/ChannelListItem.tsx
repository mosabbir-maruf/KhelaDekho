import Tv from "lucide-react/dist/esm/icons/tv";

interface ChannelItem {
  name: string;
  url?: string;
  logo?: string | null;
  group?: string | null;
  extra?: string;
}

interface ChannelListItemProps {
  item: ChannelItem;
  selected: boolean;
  onClick: () => void;
  showGroup?: boolean;
  showExtra?: boolean;
}

export function ChannelListItem({ item, selected, onClick, showGroup, showExtra }: ChannelListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left border p-3 transition-all cursor-pointer group ${
        selected
          ? "border-red-500/30 bg-red-500/[0.03]"
          : "border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`relative w-8 h-8 border flex items-center justify-center shrink-0 overflow-hidden transition-all ${
          selected
            ? "border-red-500/20 bg-red-500/10"
            : "border-border-alt bg-hover group-hover:border-red-500/20 group-hover:bg-red-500/10"
        }`}>
          {item.logo ? (
            <img src={item.logo} alt="" className="w-full h-full object-cover" />
          ) : (
            <Tv className={`w-3.5 h-3.5 transition-colors ${
              selected ? "text-red-400" : "text-fg-dim group-hover:text-red-400"
            }`} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-xs font-mono font-semibold truncate transition-colors ${
            selected ? "text-red-400" : "text-fg group-hover:text-red-400"
          }`}>
            {item.name}
          </div>
          {showGroup && item.group && (
            <div className="text-[9px] font-mono text-fg-dim mt-0.5">{item.group.toUpperCase()}</div>
          )}
          {showExtra && item.extra && (
            <div className="text-[9px] font-mono text-fg-dim mt-0.5">{item.extra}</div>
          )}
        </div>
      </div>
    </button>
  );
}
