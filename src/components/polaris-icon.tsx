import { polarisIcons, type PolarisIconName } from "@/components/polaris-icons";

// Matches s-icon: 16px glyphs centred in a 20px box, line icons drawn with a 1.5px round stroke.
export function PIcon({ name, size = 20 }: { name: PolarisIconName; size?: number }) {
  const icon = polarisIcons[name];
  return (
    <svg
      viewBox={icon.viewBox}
      width={size}
      height={size}
      aria-hidden="true"
      fill={icon.stroke ? "none" : "currentColor"}
      stroke={icon.stroke ? "currentColor" : undefined}
      strokeWidth={icon.stroke ? 1.5 : undefined}
      strokeLinecap={icon.stroke ? "round" : undefined}
      strokeLinejoin={icon.stroke ? "round" : undefined}
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
}

export type { PolarisIconName };
