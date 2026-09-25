import UXOSBrandLogo from "@/src/components/ui/UXOSBrandLogo";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <img
        src="/launchops-logo.png"
        alt="UXOS logo mark"
        className="w-full h-full object-contain drop-shadow-sm"
      />
    </div>
  );
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return <UXOSBrandLogo isDarkMode={dark} />;
}

export default Logo;
