import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  MessageCircle, 
  Send, 
  X, 
  Mic, 
  User, 
  Bot,
  Minimize2,
  Maximize2,
  Languages
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Reads the API key from the .env.local file
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export const KrishiChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState('en'); // 'en', 'mr', 'hi'
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const translations = {
    en: {
      initialMessage: 'Hello! I\'m Krishi AI 🌱 How can I help you with your farming today?',
      cropSuggestions: 'Crop Suggestions 🌾',
      weatherUpdates: 'Weather Updates ☀️',
      marketPrices: 'Market Prices 💰',
      pestControl: 'Pest Control 🐛',
      apiKeyNotSet: 'The AI is not configured. Please ensure your Gemini API key is set in the .env.local file.',
      typingPlaceholder: 'Type your farming question...',
      onlineStatus: '🟢 Online - Ready to help',
      chatWithKrishiAI: 'Chat with Krishi AI 🌱',
    },
    mr: {
      initialMessage: 'नमस्कार! मी कृषी AI आहे 🌱 आज मी तुमच्या शेतीत कशी मदत करू शकतो?',
      cropSuggestions: 'पीक सूचना 🌾',
      weatherUpdates: 'हवामान अपडेट ☀️',
      marketPrices: 'बाजारभाव 💰',
      pestControl: 'कीड नियंत्रण 🐛',
      apiKeyNotSet: 'AI कॉन्फिगर केलेले नाही. कृपया खात्री करा की तुमची Gemini API की .env.local फाइलमध्ये सेट आहे.',
      typingPlaceholder: 'तुमचा शेतीविषयक प्रश्न टाइप करा...',
      onlineStatus: '🟢 ऑनलाइन - मदतीसाठी तयार',
      chatWithKrishiAI: 'कृषी AI सोबत चॅट करा 🌱',
    },
    hi: {
      initialMessage: 'नमस्ते! मैं कृषि AI हूँ 🌱 आपकी खेती में कैसे मदद कर सकता हूँ?',
      cropSuggestions: 'फसल सुझाव 🌾',
      weatherUpdates: 'मौसम अपडेट ☀️',
      marketPrices: 'बाजार मूल्य 💰',
      pestControl: 'कीट नियंत्रण 🐛',
      apiKeyNotSet: 'AI कॉन्फ़िगर नहीं है। कृपया सुनिश्चित करें कि आपकी Gemini API की .env.local फ़ाइल में सेट है।',
      typingPlaceholder: 'अपना खेती का सवाल टाइप करें...',
      onlineStatus: '🟢 ऑनलाइन - मदद के लिए तैयार',
      chatWithKrishiAI: 'कृषि AI के साथ चैट करें 🌱',
    }
  };

  useEffect(() => {
    setMessages([
      {
        id: '1',
        type: 'bot',
        content: translations[language as keyof typeof translations].initialMessage,
        timestamp: new Date()
      }
    ]);
  }, [language]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickReplies = [
    { text: translations[language as keyof typeof translations].cropSuggestions, value: language === 'hi' ? 'मेरे क्षेत्र के लिए फसल सुझाएं' : 'suggest crops for my region' },
    { text: translations[language as keyof typeof translations].weatherUpdates, value: language === 'hi' ? 'खेती के लिए मौसम का पूर्वानुमान' : 'weather forecast for farming' },
    { text: translations[language as keyof typeof translations].marketPrices, value: language === 'hi' ? 'मौजूदा बाजार मूल्य' : 'current market prices' },
    { text: translations[language as keyof typeof translations].pestControl, value: language === 'hi' ? 'कीट नियंत्रण सलाह' : 'pest control advice' }
  ];

  const callGeminiAPI = async (conversationHistory: Message[]): Promise<string> => {
    if (!GEMINI_API_KEY) {
        return translations[language as keyof typeof translations].apiKeyNotSet;
    }

    const getLanguageName = () => {
      switch (language) {
        case 'mr': return 'Marathi';
        case 'hi': return 'Hindi';
        default: return 'English';
      }
    };

    const systemPrompt = `You are an Agentic AI agricultural assistant for Indian farmers, named Krishi AI. Your primary goal is to provide actionable, data-driven advice.

**User Language:** ${getLanguageName()}

**Agentic Capabilities:**
- **Analyze User Input:** Extract key information like location, soil type, crop, and specific problem from the conversation.
- **Data Integration (Simulated):** Access and process real-time data for weather, market prices, and pest alerts.
- **Provide Actionable Advice:** Offer clear, step-by-step guidance based on the conversation history.
- **Personalized Recommendations:** Tailor advice to the user's specific context.

**Response Guidelines:**
- Respond ONLY in the user's specified language (${getLanguageName()}).
- Maintain the context of the entire conversation.
- Use simple language with farming emojis.
- Provide actionable advice with specific data points (e.g., prices in ₹, weather in °C).
- Mention specific Indian crop varieties and government schemes when relevant.
- If you need more information to provide a precise answer, ask clarifying questions.
`;

    const historyForAPI = conversationHistory.slice(1).map(msg => ({
      role: msg.type === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: historyForAPI,
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
                ]
            }),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else if (data.promptFeedback && data.promptFeedback.blockReason) {
            return `Response blocked due to: ${data.promptFeedback.blockReason}`;
        }
         else {
            throw new Error('Invalid API response format');
        }
    } catch (error) {
        console.error('Gemini API Error:', error);
        return '⚠️ माफ करें, मुझे तकनीकी समस्या आ रही है। कृपया बाद में कोशिश करें।\n\nSorry, I\'m experiencing technical difficulties. Please try again later.';
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setMessage('');
    setIsTyping(true);

    try {
      const botResponseContent = await callGeminiAPI(newMessages);

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponseContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: '⚠️ Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (value: string) => {
    setMessage(value);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="chat-floating-btn h-16 w-16 rounded-full shadow-2xl"
        >
          <MessageCircle className="h-8 w-8" />
        </Button>
        
        <div className="absolute bottom-20 right-0 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg animate-pulse">
          {translations[language as keyof typeof translations].chatWithKrishiAI}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`w-96 ${isMinimized ? 'h-16' : 'h-[600px]'} flex flex-col shadow-2xl border-0 overflow-hidden transition-all duration-300`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">Krishi AI</h3>
              <p className="text-xs opacity-90">{translations[language as keyof typeof translations].onlineStatus}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-auto h-8 text-xs bg-primary-foreground/10 border-0 text-primary-foreground focus:ring-0">
                <Languages className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="mr">मराठी</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-muted/20">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                   {msg.type === 'bot' && (
                    <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex-shrink-0 flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  
                  <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                    msg.type === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-background border border-border rounded-bl-none'
                  }`}>
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                    <span className={`text-xs opacity-70 mt-1 block ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {msg.type === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex-shrink-0 flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start gap-3">
                   <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex-shrink-0 flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                  <div className="bg-background border border-border px-4 py-3 rounded-2xl rounded-bl-none">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies & Input */}
            <div className="p-4 border-t border-border flex-shrink-0">
                {messages.length <= 2 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {quickReplies.map((reply, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleQuickReply(reply.value)}
                      >
                        {reply.text}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex space-x-2">
                  <Input
                    placeholder={translations[language as keyof typeof translations].typingPlaceholder}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 rounded-full border-border focus:border-primary"
                  />
                  
                  <Button
                    onClick={handleSendMessage}
                    size="icon"
                    className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 flex-shrink-0"
                    disabled={!message.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};