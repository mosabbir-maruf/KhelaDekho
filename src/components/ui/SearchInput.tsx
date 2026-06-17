import Search from "lucide-react/dist/esm/icons/search";
import X from "lucide-react/dist/esm/icons/x";

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = "Filter..." }: SearchInputProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border-alt bg-card px-3 py-2 shrink-0">
      <Search className="w-3.5 h-3.5 text-fg-dim shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent text-xs font-mono text-fg placeholder:text-fg-faint outline-none w-full"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} className="text-fg-dim hover:text-fg">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
