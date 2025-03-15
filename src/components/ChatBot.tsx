import { useState, useRef, useEffect } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { Step, Message } from "../types";

interface ChatBotProps {
  currentStep: Step;
  recordingComplete: boolean;
  mintComplete: boolean;
  onStepChange: (step: Step) => void;
  messages: Message[];
  setMessages: React.Dispatch<
    React.SetStateAction<
      {
        text: string;
        sender: "agent" | "user";
      }[]
    >
  >;
  quickResponses: string[];
  setQuickResponses: React.Dispatch<React.SetStateAction<string[]>>;
  sendMessage: (message: string) => void;
}

export default function ChatBot({
  currentStep,
  recordingComplete,
  mintComplete,
  onStepChange,
  messages,
  setMessages,
  quickResponses,
  setQuickResponses,
  sendMessage,
}: ChatBotProps) {
  const [userInput, setUserInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            <div className="message-bubble">{message.text}</div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="quick-responses">
        {quickResponses.map((response, index) => (
          <button
            key={index}
            className="quick-response-btn"
            onClick={() => {
              sendMessage(response);
              setQuickResponses([]);
            }}
          >
            {response}
          </button>
        ))}
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          placeholder="Type your message..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && userInput.trim()) {
              sendMessage(userInput);
              setUserInput("");
              setQuickResponses([]);
            }
          }}
        />
        <button
          className="send-button"
          onClick={() => {
            if (userInput.trim()) {
              sendMessage(userInput);
              setUserInput("");
              setQuickResponses([]);
            }
          }}
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}
