/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SidebarContext = createContext()

export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  // Close sidebar on route change (mobile nav)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false)
  }, [location.pathname])

  // Close sidebar on wide screens
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 769px)')
    const handler = (e) => { if (e.matches) setIsOpen(false) }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [])

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, toggle: () => setIsOpen(o => !o) }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
