import { Button } from "@/components/ui/button";
import { Icons } from "./icons";
import { PanelContext } from "../contexts/PanelContext";
import { MessageCircleQuestion } from "lucide-react";
import { clearAllTranscriptCache } from "../lib/utils";

interface HeaderProps {
  activeTab: "transcript" | "summarize" | "copy" | "qa";
  setActiveTab: (tab: "transcript" | "summarize" | "copy" | "qa") => void;
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const { setIsOpen } = useContext(PanelContext);

  const handleClearCache = () => {
    const clearedCount = clearAllTranscriptCache();
    alert(`Cleared ${clearedCount} cached transcripts`);
  };

  return (
    <div
      ref={dragHandleRef}
      className="flex items-center justify-between border-b bg-black p-4 text-white cursor-move select-none"
    >
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"></div>
        <h1 className="text-lg font-medium">Transcript & Summary</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={() => setActiveTab("transcript")}
        >
          <Icons.refresh className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`text-white hover:bg-white/10 ${
            activeTab === "summarize" ? "bg-white/20" : ""
          }`}
          onClick={() => setActiveTab("summarize")}
        >
          <Icons.target className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`text-white hover:bg-white/10 ${
            activeTab === "copy" ? "bg-white/20" : ""
          }`}
          onClick={() => setActiveTab("copy")}
        >
          <Icons.copy className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`text-white hover:bg-white/10 ${
            activeTab === "qa" ? "bg-white/20" : ""
          }`}
          onClick={() => setActiveTab("qa")}
        >
          <MessageCircleQuestion className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          className="w-full text-white hover:bg-white/10"
          onClick={() => setIsOpen(false)}
        >
          <Icons.x className="mr-2 h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          className="px-3 py-1 text-sm text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
          onClick={handleClearCache}
          title="Clear all cached transcripts"
        >
          Clear Cache
        </Button>
      </div>
    </div>
  );
}
