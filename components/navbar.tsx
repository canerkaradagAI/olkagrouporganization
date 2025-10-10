
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Users,
  Building2,
  MapPin,
  BrainCircuit,
  Settings,
  Home,
  Menu,
  LogOut,
  User,
  Database
} from 'lucide-react'

export function Navbar() {
  const { data: session } = useSession() || {}
  const [isOpen, setIsOpen] = useState(false)

  const navigationItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/organization', label: 'Organizasyon Şeması', icon: Building2 },
    { href: '/employees', label: 'Çalışanlar', icon: Users },
    { href: '/positions', label: 'Pozisyonlar', icon: BrainCircuit },
  ]

  const moreItems = [
    { href: '/management', label: 'Yönetim Organizasyonu', icon: Building2 },
    { href: '/org-chart', label: 'Ağaç Görünümü', icon: Building2 },
    { href: '/departments', label: 'Departmanlar', icon: Building2 },
    { href: '/locations', label: 'Lokasyonlar', icon: MapPin },
    { href: '/test-db', label: 'Veritabanı Test', icon: Database },
  ]

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  if (!session) {
    return null
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Building2 className="h-6 w-6" />
              <span className="font-bold text-lg">Olka Group</span>
            </Link>
            
            {/* Caner butonu - logo'nun hemen yanında */}
            <div className="bg-red-500 text-white px-3 py-1 rounded-md font-bold">
              Caner
            </div>
            
            <div className="hidden md:flex items-center space-x-4 ml-8">
              {navigationItems?.map((item) => (
                <Link
                  key={item?.href}
                  href={item?.href || '#'}
                  className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md hover:bg-accent"
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item?.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Daha Fazla Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sm font-medium">
                  Daha Fazla
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {moreItems?.map((item) => (
                  <DropdownMenuItem key={item?.href} asChild>
                    <Link
                      href={item?.href || '#'}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item?.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Menü</SheetTitle>
                    <SheetDescription>
                      Organizasyon Portalı Menüsü
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-col space-y-2 mt-6">
                    {[...navigationItems, ...moreItems]?.map((item) => (
                      <Link
                        key={item?.href}
                        href={item?.href || '#'}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md hover:bg-accent"
                      >
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item?.label}</span>
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback>
                      {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session?.user?.name || 'Kullanıcı'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Ayarlar</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Çıkış Yap</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
