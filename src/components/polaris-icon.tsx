import { polarisIcons, type PolarisIconName } from "@/components/polaris-icons";

export function PIcon({ name, size = 20 }: { name: PolarisIconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      aria-hidden="true"
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: polarisIcons[name] }}
    />
  );
}

export type { PolarisIconName };
