import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { LayoutDashboard, Users2, FileBarChart, Bell, Settings, LogOut, LogIn, ClipboardList } from 'lucide-react'
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuLink } from './ui/navigation-menu'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { Logo } from './Logo'

interface User {
  role: string
}

export function Header() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastPendingCount = useRef(0)

  useEffect(() => {
    // Initialize audio element
    const audio = new Audio('/notification.mp3')
    audio.preload = 'auto'
    // Load the audio file immediately
    audio.load()
    audioRef.current = audio
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const checkStatus = () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          // Check both role and email for admin access
          setIsAdmin(payload?.role === 'ADMIN' || payload?.email === 'admin@admin.com')
          setIsLoggedIn(true)
        } catch (error) {
          console.error('Error decoding token:', error)
          setIsAdmin(false)
          setIsLoggedIn(false)
        }
      } else {
        setIsAdmin(false)
        setIsLoggedIn(false)
      }
    }

    checkStatus()
    window.addEventListener('storage', checkStatus)
    
    return () => {
      window.removeEventListener('storage', checkStatus)
    }
  }, [])

  // Check for pending approvals
  useEffect(() => {
    const checkPendingApprovals = async () => {
      if (!isAdmin) return

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.error('No token found')
          return
        }

        const response = await fetch('/api/admin/users/pending', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        const pendingCount = data.users?.length || 0
        setPendingApprovals(pendingCount)

        // Play sound if there are new pending approvals
        if (pendingCount > lastPendingCount.current && audioRef.current) {
          try {
            await audioRef.current.play().catch((e) => {
              console.warn('Notification sound playback failed:', e)
            })
          } catch (error) {
            console.error('Error playing notification sound:', error)
          }
        }
        lastPendingCount.current = pendingCount
      } catch (error) {
        console.error('Error checking pending approvals:', error)
        // Reset pending count on error to prevent stale data
        setPendingApprovals(0)
      }
    }

    if (isAdmin) {
      // Initial check
      checkPendingApprovals()
      
      // Check every 15 seconds for new pending approvals
      const interval = setInterval(checkPendingApprovals, 15000)
      return () => clearInterval(interval)
    }
  }, [isAdmin])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const handleSettings = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload?.role === 'ADMIN' || payload?.email === 'admin@admin.com') {
        router.push('/settings')
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Error accessing settings:', error)
      router.push('/login')
    }
  }

  return (
    <TooltipProvider>
      <div className="border-b bg-white/75 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center px-4">
          <Logo />
          
          <NavigationMenu className="ml-8">
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <Button 
                  variant={router.pathname === '/' ? 'default' : 'ghost'} 
                  className="gap-2" 
                  asChild
                >
                  <NavigationMenuLink className="cursor-pointer" onClick={() => router.push('/')}>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </NavigationMenuLink>
                </Button>
              </NavigationMenuItem>

              {!isLoggedIn && (
                <NavigationMenuItem>
                  <Button 
                    variant="ghost"
                    className="gap-2" 
                    onClick={() => router.push('/login')}
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </Button>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="ml-auto flex items-center gap-4">
            {isAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="relative" 
                    onClick={() => router.push('/settings')}
                  >
                    <Bell className="h-4 w-4" />
                    {pendingApprovals > 0 && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center animate-pulse"
                        variant="destructive"
                      >
                        {pendingApprovals}
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{pendingApprovals} pending approval{pendingApprovals !== 1 ? 's' : ''}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {isAdmin && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={router.pathname === '/responses' ? 'default' : 'outline'} 
                      size="icon" 
                      onClick={() => router.push('/responses')}
                    >
                      <ClipboardList className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Responses</p>
                  </TooltipContent>
                </Tooltip>


                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={router.pathname === '/settings' ? 'default' : 'outline'} 
                      size="icon" 
                      onClick={handleSettings}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}