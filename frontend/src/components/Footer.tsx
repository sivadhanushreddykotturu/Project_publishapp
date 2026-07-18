import { Footerdemo } from "@/components/ui/footer-section";

interface FooterProps {
  onTabChange: (tab: string) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function Footer({ onTabChange, isDarkMode = false, onToggleDarkMode }: FooterProps) {
  return (
    <div className="block" id="site-footer">
      <Footerdemo 
        isDarkMode={isDarkMode} 
        onToggleDarkMode={onToggleDarkMode} 
        onTabChange={onTabChange} 
      />
    </div>
  );
}
