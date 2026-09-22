import { ChatWindow } from "@/components/chat/ChatWindow";

export const metadata = {
  title: "AI Agents Hub | WeatherGPT",
};

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] w-full">
      <ChatWindow />
    </div>
  );
}
