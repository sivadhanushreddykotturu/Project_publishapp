"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Facebook, Instagram, Linkedin, Moon, Send, Sun, Twitter } from "lucide-react"

interface FooterdemoProps {
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onTabChange?: (tab: string) => void;
}

function Footerdemo({ isDarkMode: parentDarkMode, onToggleDarkMode, onTabChange }: FooterdemoProps) {
  const [localDarkMode, setLocalDarkMode] = React.useState(true)
  const [isChatOpen, setIsChatOpen] = React.useState(false)

  const isDark = parentDarkMode !== undefined ? parentDarkMode : localDarkMode

  const handleDarkModeChange = (checked: boolean) => {
    if (onToggleDarkMode) {
      onToggleDarkMode()
    } else {
      setLocalDarkMode(checked)
    }
  }

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark])

  return (
    <footer className={`relative border-t transition-colors duration-300 ${
      isDark ? 'bg-[#050505] border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
    }`}>
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <h2 className={`mb-4 text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Stay Connected</h2>
            <p className={`mb-6 text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              Join our newsletter for the latest updates and exclusive offers.
            </p>
            <form className="relative" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Enter your email"
                className={`pr-12 backdrop-blur-sm ${
                  isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8 rounded-full bg-indigo-600 text-white transition-transform hover:scale-105"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Subscribe</span>
              </Button>
            </form>
            <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl" />
          </div>
          <div>
            <h3 className={`mb-4 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick Links</h3>
            <nav className="space-y-2 text-sm">
              <button
                onClick={() => onTabChange?.("home")}
                className={`block text-left transition-colors cursor-pointer w-full bg-transparent border-0 p-0 ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => onTabChange?.("home")}
                className={`block text-left transition-colors cursor-pointer w-full bg-transparent border-0 p-0 ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                About Us
              </button>
              <button
                onClick={() => onTabChange?.("solutions")}
                className={`block text-left transition-colors cursor-pointer w-full bg-transparent border-0 p-0 ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                Solutions
              </button>
              <button
                onClick={() => onTabChange?.("pricing")}
                className={`block text-left transition-colors cursor-pointer w-full bg-transparent border-0 p-0 ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                Pricing
              </button>
              <button
                onClick={() => onTabChange?.("resources")}
                className={`block text-left transition-colors cursor-pointer w-full bg-transparent border-0 p-0 ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                Resources
              </button>
            </nav>
          </div>
          <div>
            <h3 className={`mb-4 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Contact Us</h3>
            <address className={`space-y-2 text-sm not-italic ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <p>HITEC City, Madhapur</p>
              <p>Hyderabad, Telangana 500081</p>
              <p>Phone: +91 40 4567 8900</p>
              <p>Email: hello@launchops.com</p>
            </address>
          </div>
          <div className="relative">
            <h3 className={`mb-4 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Follow Us</h3>
            <div className="mb-6 flex space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className={`rounded-full ${isDark ? 'border-white/5 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                      <Facebook className="h-4 w-4" />
                      <span className="sr-only">Facebook</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Follow us on Facebook</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className={`rounded-full ${isDark ? 'border-white/5 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                      <Twitter className="h-4 w-4" />
                      <span className="sr-only">Twitter</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Follow us on Twitter</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className={`rounded-full ${isDark ? 'border-white/5 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                      <Instagram className="h-4 w-4" />
                      <span className="sr-only">Instagram</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Follow us on Instagram</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className={`rounded-full ${isDark ? 'border-white/5 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                      <Linkedin className="h-4 w-4" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Connect with us on LinkedIn</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center space-x-2">
              <Sun className={`h-4 w-4 ${isDark ? 'text-gray-500' : 'text-amber-500'}`} />
              <Switch
                id="dark-mode"
                checked={isDark}
                onCheckedChange={handleDarkModeChange}
              />
              <Moon className={`h-4 w-4 ${isDark ? 'text-indigo-400' : 'text-gray-400'}`} />
              <Label htmlFor="dark-mode" className="sr-only">
                Toggle dark mode
              </Label>
            </div>
          </div>
        </div>
        <div className={`mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-center md:flex-row ${
          isDark ? 'border-white/5' : 'border-slate-200'
        }`}>
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              © 2026 LaunchOps. All rights reserved.
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-slate-400'}`}>
              Founded by Nandha Kishore · Hyderabad, India
            </p>
          </div>
          <nav className="flex gap-4 text-sm">
            <a href="#" className={`transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-slate-500 hover:text-indigo-600'}`}>
              Privacy Policy
            </a>
            <a href="#" className={`transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-slate-500 hover:text-indigo-600'}`}>
              Terms of Service
            </a>
            <a href="#" className={`transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-slate-500 hover:text-indigo-600'}`}>
              Cookie Settings
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export { Footerdemo }
