'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ children, isOpen, onClose }: { children: React.ReactNode, isOpen: boolean, onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div ref={modalRef} className="bg-white p-6 rounded-lg shadow-xl relative">
        {children}
      </div>
    </div>,
    document.body
  )
}