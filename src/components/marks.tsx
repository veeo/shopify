import type { ReactNode } from "react";
import { PIcon } from "@/components/polaris-icon";
import type { OrbId } from "@/lib/prototype";

export function ShopifyMark({ className = "h-6 w-[22px]", tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const bag = tone === "dark" ? "#101010" : "white";
  const shade = tone === "dark" ? "#5E8E3E" : "#C3C3C3";
  return (
    <svg className={className} viewBox="0 0 22 25" aria-hidden="true">
      <path
        fill={bag}
        d="M15.006 2.914s-.281.08-.743.221c-.08-.261-.201-.562-.362-.884C13.379 1.247 12.595.705 11.671.705c-.06 0-.12 0-.201.02-.02-.04-.06-.06-.08-.1-.402-.442-.924-.643-1.547-.623C8.638.042 7.433.905 6.468 2.452 5.785 3.537 5.263 4.903 5.123 5.968 3.736 6.39 2.772 6.691 2.752 6.711 2.049 6.932 2.029 6.952 1.949 7.615 1.828 8.118 0 22.281 0 22.281L15.187 24.913V2.874c-.08.02-.141.02-.181.04Zm-3.515 1.085c-.804.241-1.688.522-2.551.783.241-.944.723-1.888 1.286-2.511.221-.221.522-.482.863-.643.342.723.422 1.708.402 2.371ZM9.863.805c.281 0 .522.06.723.181-.321.16-.643.422-.944.723-.763.824-1.346 2.11-1.587 3.335-.723.221-1.446.442-2.109.643.422-1.909 2.049-4.822 3.917-4.882ZM7.513 11.854c.08 1.286 3.475 1.567 3.676 4.601.141 2.39-1.265 4.018-3.294 4.138-2.451.161-3.797-1.286-3.797-1.286l.522-2.21s1.346 1.025 2.431.944c.703-.04.964-.623.944-1.025-.1-1.687-2.873-1.587-3.053-4.359-.161-2.31 1.366-4.661 4.741-4.882 1.306-.08 1.969.241 1.969.241l-.763 2.893s-.864-.402-1.888-.321c-1.487.1-1.507 1.044-1.487 1.265Zm4.781-8.096c0-.603-.08-1.467-.362-2.19.924.181 1.366 1.205 1.567 1.828-.362.1-.763.221-1.205.362Z"
      />
      <path
        fill={shade}
        d="M15.691 24.831 22 23.264s-2.712-18.342-2.732-18.462c-.02-.121-.12-.201-.221-.201-.1 0-1.868-.04-1.868-.04s-1.085-1.045-1.487-1.447v21.717Z"
      />
    </svg>
  );
}

export function SidekickGlyph({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 17" aria-hidden="true">
      <path
        fill="white"
        d="M7.54.005c.582.026 1.191.103 1.766.185 2.174.313 2.941.833 4.42 2.383.402.048.697.126 1.002.429.659.656 1.038 1.887 1.11 2.798.028.345-.022.707 0 1.051.064.916.112 1.832.143 2.749.013.457.044 1.028-.008 1.48-.26 2.244-1.795 4.587-4.07 5.179-.415.108-.913.156-1.34.205-.572.065-1.171.119-1.746.134-.163.007-.327.014-.49.019-.796.021-1.592-.003-2.385-.071-1.21-.097-2.135-.162-3.181-.836-.266-.169-.516-.361-.746-.576-1.244-1.18-1.969-2.806-2.013-4.52-.005-.211.01-.424.017-.634.015-.472.037-.943.048-1.415.015-.613.009-1.227.04-1.839.017-.353.061-.7.091-1.052.026-.294.03-.59.063-.884.063-.562.248-1.335.523-1.83.089-.16.2-.305.326-.437.887-.924 3.018-2.032 4.26-2.333.59-.143 1.198-.177 1.803-.19.117-.002.249 0 .366.005Zm.31 10.491c-1.077.068-1.396.666-2.202 1.188-.794.514-2.09 1.079-3.063.961-.327-.039-.75-.208-1.034-.372.463 1.14 1.227 2.192 2.392 2.686.175.076.358.135.544.177.245.055.533.083.785.114.96.11 1.927.16 2.893.15.747-.007 1.494-.056 2.236-.146.323-.039.795-.084 1.102-.151.713-.156 1.304-.534 1.801-1.059.571-.602.808-1.048 1.131-1.784-.243.175-.772.36-1.076.387-.946.082-2.122-.397-2.91-.879-.908-.555-1.387-1.369-2.599-1.271Zm1.82 1.914c.517-.035.777.439.483.857-.891 1.267-2.431 1.43-3.686.624-.07-.051-.14-.104-.209-.158-.313-.245-.718-.655-.378-1.049.381-.44 1.005-.014 1.435.104.31.087.633.119.954.092.257-.024.508-.092.742-.199.231-.108.403-.247.66-.271ZM3.396 8.4c-.735.072-1.272.727-1.2 1.462.072.735.727 1.273 1.462 1.201.735-.072 1.273-.726 1.201-1.462-.072-.735-.727-1.273-1.463-1.201Zm8.756 0c-.736.065-1.28.715-1.215 1.45.066.737.717 1.28 1.453 1.214.735-.067 1.277-.716 1.211-1.451-.066-.735-.714-1.278-1.449-1.213ZM3.08 4.097c-.088.018-.18.041-.256.09-.312.207-.625.615-.827.921-.286.433-.48.922-.567 1.434-.029.171-.038.363-.067.526 1.455-.633 2.983.245 4.262.881 1.481.736 2.926.816 4.44.128 1.36-.619 2.93-1.653 4.474-1.043.023.009.046.018.068.028l.022-.002c.016-.072-.029-.386-.078-.45-.196-.254-.453-.473-.675-.705-.374-.392-.84-1.02-.993-1.541-.675.143-1.992-.057-2.712-.114-.428-.034-.852-.033-1.281-.04-.212-.004-.569-.041-.768-.003-.467.09-1.237 1.721-1.564 1.506-.196-.129-.322-.72-.361-.953-.013-.072-.026-.146-.033-.218-.36.205-.7.402-1 .696-.334.329-.692 1.042-1.068 1.267-.374.222-.577-1.38-.583-1.578-.009-.284-.018-.542-.016-.818-.108-.005-.316-.018-.418-.012Z"
      />
    </svg>
  );
}

const imageOrb: Partial<Record<OrbId, string>> = {
  chief: "/assets/orb-chief.png",
  ideas: "/assets/orb-ideas.png",
  trends: "/assets/orb-trends.png",
  slack: "/assets/orb-slack.png",
  grok: "/assets/orb-grok.png",
  muse: "/assets/orb-muse.png",
  store: "/assets/orb-store.png",
  agentic: "/assets/orb-agentic.png",
};

export function Orb({ id, size = 32 }: { id: OrbId; size?: number }) {
  if (id === "sidekick") {
    return (
      <span
        className="relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#672ff4] text-white shadow-[inset_0_0_2px_rgba(255,255,255,0.35)]"
        style={{ width: size, height: size }}
      >
        <PIcon name="Sidekick" size={Math.round(size * 0.62)} />
      </span>
    );
  }
  const src = imageOrb[id];
  if (src) {
    return (
      <span className="relative shrink-0 overflow-hidden rounded-full bg-[#1a1b1a]" style={{ width: size, height: size }}>
        <img alt="" src={src} className="h-full w-full object-cover" />
      </span>
    );
  }
  if (id === "customers") {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full bg-[#3a3a3a] text-[11px] font-semibold text-white"
        style={{ width: size, height: size }}
      >
        C
      </span>
    );
  }
  if (id === "orders") {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full bg-[#2a2a2a] text-[13px] text-white"
        style={{ width: size, height: size }}
      >
        #
      </span>
    );
  }
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7c5cff] to-[#56d6c2] text-[11px] font-semibold text-white"
      style={{ width: size, height: size }}
    >
      +
    </span>
  );
}

export function IconButton({
  label,
  children,
  onClick,
  active,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`grid size-8 place-items-center rounded-full text-[#101010] transition duration-200 ease-out hover:bg-[#f3f3f3] ${
        active ? "bg-[#f3f3f3]" : "bg-transparent"
      }`}
    >
      {children}
    </button>
  );
}

export function ChipButton({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "secondary" | "primary";
  onClick: () => void;
}) {
  return (
    <s-button variant={tone === "primary" ? "primary" : "secondary"} onClick={onClick}>
      {label}
    </s-button>
  );
}
