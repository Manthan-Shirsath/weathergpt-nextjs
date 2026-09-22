import { ChatWindow } from "@/components/chat/ChatWindow";

export const metadata = {
  title: "WeatherGPT | SkyCast",
};

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] w-full">
      <ChatWindow />
    </div>
  );
}
