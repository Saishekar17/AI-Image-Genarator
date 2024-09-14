// app/components/ChatAssistant.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faImage, faDownload } from '@fortawesome/free-solid-svg-icons';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DownloadIcon } from 'lucide-react';
import { ArrowDownOnSquareIcon } from '@heroicons/react/16/solid';



interface Message {
  text?: string;
  isUser?: boolean;
  type?: 'text' | 'image';
  url?: string;
}

const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  const displayMessage = (message: string, isUser: boolean) => {
    setMessages(prev => [...prev, { text: message, isUser, type: 'text' }]);
  };

  const downloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'generated-image.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download the image. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    displayMessage(input, true);
    setInput('');
    setIsLoading(true);

    const apiUrl = input.startsWith('/image')
      ? 'https://backend.buildpicoapps.com/aero/run/image-generation-api?pk=v1-Z0FBQUFBQm01Vm5sdFExNXRNTGJ6M0Y5TkF6d0tQTnZlSHZqbm1mdTVINFlxb3JYak9yVnpxUTc3bndOUUdzSGt6UHd6cTR1U240czZ6WlZxaFUwalNGNzBsVFNIZFZqNHc9PQ=='
      : 'https://backend.buildpicoapps.com/aero/run/llm-api?pk=v1-Z0FBQUFBQm01Vm5sdFExNXRNTGJ6M0Y5TkF6d0tQTnZlSHZqbm1mdTVINFlxb3JYak9yVnpxUTc3bndOUUdzSGt6UHd6cTR1U240czZ6WlZxaFUwalNGNzBsVFNIZFZqNHc9PQ==';

    try {
      const prependPersona = apiUrl.includes('llm-api');
      const prompt = prependPersona
        ? "Follow instructions precisely! If the user asks to generate, create or make an image, photo, or picture by describing it, You will reply with '/image' + description. Otherwise, You will respond normally. Avoid additional explanations." + input
        : input.startsWith('/image') ? input.substring(6).trim() : input;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();

      if (data.status === 'success') {
        if (input.toLowerCase().startsWith('/image')) {
          handleImageResponse(data);
        } else {
          if (data.text.trim().toLowerCase().startsWith('/image')) {
            const imageDescription = data.text.substring(data.text.toLowerCase().indexOf('/image') + 6).trim();
            const imageData = await fetch('https://backend.buildpicoapps.com/aero/run/image-generation-api?pk=v1-Z0FBQUFBQm01Vm5sdFExNXRNTGJ6M0Y5TkF6d0tQTnZlSHZqbm1mdTVINFlxb3JYak9yVnpxUTc3bndOUUdzSGt6UHd6cTR1U240czZ6WlZxaFUwalNGNzBsVFNIZFZqNHc9PQ==', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: imageDescription })
            }).then(res => res.json());
            handleImageResponse(imageData);
          } else {
            displayMessage(data.text, false);
          }
        }
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      console.error('Error:', error);
      displayMessage('An error occurred. Please try again.', false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageResponse = (imageData: { status: string; imageUrl: string }) => {
    if (imageData.status === 'success') {
      setMessages(prev => [...prev, { type: 'image', url: imageData.imageUrl }]);
    } else {
      displayMessage('Failed to generate image. Please try again.', false);
    }
  };

  const displayLargeImage = (imageUrl: string) => {
    // Implementation for displaying large image
  };

  return (
    <div className="container mx-auto px-4 h-full relative max-w-md">
      <div className="py-6 px-8 rounded max-w-md mx-auto h-full flex flex-col">
        <div id="chatbox" ref={chatboxRef} className="flex flex-col h-full overflow-y-scroll pb-16 flex-grow mb-20 space-y-2">
          {messages.map((msg, index) => (
            msg.type === 'image' ? (
              <div key={index} className="mx-auto mt-2 relative w-48 h-48 bg-center border-4 rounded-xl border-gray-700 bg-cover" style={{ backgroundImage: `url(${msg.url})` }} onClick={() => msg.url && displayLargeImage(msg.url)}>
                <button className="absolute bottom-0 right-0 p-2 text-yellow-500 rounded-tl hover:bg-blue-500 hover:text-white" onClick={(e) => {
                    e.stopPropagation();
                    msg.url && downloadImage(msg.url);
                  }}>
                  <FontAwesomeIcon icon={faImage} />
                </button>
              </div>
            ) : (
              <p key={index} className={`chat-message block ${msg.isUser ? 'text-right text-gray-500 text-sm mr-5 font-bold mt-2 bg-white rounded-tr-lg rounded-br-lg rounded-bl-md' : 'text-white mt-2 bg-gray-600 rounded-tr-lg rounded-br-lg rounded-bl-md text-sm mr-5 '} px-4 py-2`}>
                {msg.text}
              </p>
            )
          ))}
        </div>
        <div className="fixed bottom-0 left-0 w-full py-2 px-4 max-w-md mx-auto ml-auto mr-auto md:bottom-0 md:left-auto md:right-auto md:transform" style={{ zIndex: 10 }}>
          <form onSubmit={handleSubmit}>
            <div className="flex w-full">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className='border border-white text-white font-bold mb-5'
                placeholder="Type your message..."
              />
            </div>
            <Button variant="outline" type="submit" className="w-full hover:bg-gray-300 mb-4 font-extrabold" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Send'}
            </Button>
          </form>
        </div>
      </div>
      {isLoading && (
        <div className="spinner absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"></div>
      )}
    </div>
    
  );
};

export default ChatAssistant;