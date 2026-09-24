"use client";

import React, { useState } from 'react';
import { Search, ChevronLeft, Plus, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  sender: 'user' | 'support';
  text: string;
  time: string;
}

interface SupportApp {
  id: string;
  name: string;
  subtitle: string;
  iconBg: string;
  iconContent: React.ReactNode;
  statusText: string;
  statusDotColor: 'green' | 'yellow' | 'orange';
  description: string;
}

const SUPPORT_APPS: SupportApp[] = [];

interface TesterSupportViewProps {
  isDarkMode: boolean;
  onSubmitTicket?: (ticket: { subject: string; message: string; projectId?: string }) => Promise<void>;
}

export default function TesterSupportView({ isDarkMode, onSubmitTicket }: TesterSupportViewProps) {
  const [selectedApp, setSelectedApp] = useState<SupportApp | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedApp) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
      time: `Sent ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };

    setMessages(prev => ({
      ...prev,
      [selectedApp.id]: [...(prev[selectedApp.id] || []), newMessage]
    }));
    setInputText('');

    // Simulated instant reply from support
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'support',
        text: "Thank you for reaching out. We have logged your query and an admin will update you shortly.",
        time: `Sent ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      };
      setMessages(prev => ({
        ...prev,
        [selectedApp.id]: [...(prev[selectedApp.id] || []), reply]
      }));
    }, 1200);
  };

  // If in chat mode
  if (selectedApp) {
    const currentMessages = messages[selectedApp.id] || [];

    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Chat Top Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedApp(null)}
            className="w-12 h-12 rounded-2xl bg-[#4F37FE] hover:bg-[#432EE0] text-white flex items-center justify-center shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[3]" />
          </button>

          <div>
            <h1 className={`text-[24px] font-black tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
              {selectedApp.name}
            </h1>
            <p className="text-[13px] text-slate-400 font-medium">
              {selectedApp.subtitle}
            </p>
          </div>
        </div>

        {/* Chat Main Frame */}
        <div className={`rounded-3xl border p-8 shadow-xs flex flex-col justify-between min-h-[580px] ${
          isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80'
        }`}>
          {/* Message Thread Area */}
          <div className="space-y-6 flex-1 overflow-y-auto pr-2">
            {currentMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-md px-6 py-3.5 rounded-2xl text-[15px] font-medium leading-relaxed ${
                    msg.sender === 'user'
                      ? isDarkMode
                        ? 'bg-[#1E202E] text-slate-100'
                        : 'bg-[#EDEDF0] text-slate-800'
                      : 'bg-[#4F37FE] text-white'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 font-medium mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="pt-6 flex items-center gap-3">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => alert("Upload query screenshot or document")}
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors shrink-0 cursor-pointer ${
                isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Input Field */}
            <input
              type="text"
              placeholder="Describe your query here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className={`flex-1 px-5 py-3.5 rounded-2xl border text-[14px] outline-none transition-colors ${
                isDarkMode 
                  ? 'bg-[#181926] border-white/10 text-white placeholder:text-slate-500 focus:border-[#4F37FE]' 
                  : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-[#4F37FE]'
              }`}
            />

            {/* Send Button */}
            <button
              type="submit"
              className="px-10 py-3.5 rounded-2xl bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[15px] font-bold shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Support Apps List
  const filteredApps = SUPPORT_APPS.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Search Bar */}
      <div className={`relative flex items-center rounded-2xl border px-4 py-3 shadow-xs ${
        isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80'
      }`}>
        <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full bg-transparent text-[15px] outline-none placeholder:text-slate-400 ${
            isDarkMode ? 'text-white' : 'text-slate-800'
          }`}
        />
      </div>

      {/* Grid of Support Apps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApps.map((app) => {
          const dotColorClass = 
            app.statusDotColor === 'green' ? 'bg-[#10B981]' :
            app.statusDotColor === 'orange' ? 'bg-[#F97316]' :
            'bg-[#EAB308]';

          return (
            <div
              key={app.id}
              className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-xs transition-shadow duration-200 ${
                isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80'
              }`}
            >
              {/* Top Details Area */}
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                    style={{ backgroundColor: app.iconBg }}
                  >
                    {app.iconContent}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`text-[19px] font-extrabold truncate ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
                      {app.name}
                    </h3>
                    <p className="text-[13px] text-slate-400 font-medium truncate">
                      {app.subtitle}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center -space-x-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-white dark:ring-slate-900">
                          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=80" alt="avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-white dark:ring-slate-900">
                          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&auto=format&fit=crop&q=80" alt="avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-6 h-5 rounded-full bg-[#4F37FE] text-white text-[10px] font-bold flex items-center justify-center ring-1 ring-white dark:ring-slate-900">
                          4+
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 ml-1">
                        <span className={`w-2 h-2 rounded-full ${dotColorClass}`}></span>
                        <span>{app.statusText}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#4F37FE]/40 to-transparent my-4"></div>

                <div>
                  <h4 className={`text-[15px] font-extrabold mb-1.5 ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
                    Description
                  </h4>
                  <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4">
                    {app.description}
                  </p>
                </div>
              </div>

              {/* Card Bottom Strip */}
              <div className={`p-4 mx-2 mb-2 rounded-2xl flex items-center justify-center ${
                isDarkMode ? 'bg-[#181926]' : 'bg-[#F2F3FF]'
              }`}>
                <button
                  onClick={() => setSelectedApp(app)}
                  className="w-full py-3 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[14px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                >
                  Open Chat
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Storage Note */}
      <div className="pt-6">
        <p className="text-[14px] text-slate-500 dark:text-slate-400 font-normal">
          Note: Once testing is completed, the data will be deleted from the backend for storage management.
        </p>
      </div>
    </div>
  );
}
