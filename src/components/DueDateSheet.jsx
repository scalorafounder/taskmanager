import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DueDateSheet({ taskTitle, onConfirm, onSkip }) {
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  // Default to 24 hours from now in local datetime-local format
  useEffect(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const pad = n => String(n).padStart(2, '0')
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    setValue(local)
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  const handleSet = () => {
    if (!value) { onSkip(); return }
    onConfirm(new Date(value).getTime())
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0"
        style={{ background: 'rgba(0,0,0,0.65)', zIndex: 60 }}
        onClick={onSkip}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 42 }}
        className="fixed left-0 right-0 bottom-0"
        style={{
          zIndex: 61,
          background: '#1a1a1e',
          borderRadius: '28px 28px 0 0',
          paddingBottom: 'max(28px, env(safe-area-inset-bottom, 0px) + 16px)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        <div className="px-5 pt-4 pb-2">
          {/* Heading */}
          <h3
            className="text-base font-semibold mb-1 truncate"
            style={{ color: '#f4f4f5' }}
          >
            Set due date
          </h3>
          <p
            className="text-sm mb-5 truncate"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            "{taskTitle}"
          </p>

          {/* DateTime input */}
          <div
            className="rounded-2xl px-4 py-3 mb-5"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <input
              ref={inputRef}
              type="datetime-local"
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-full bg-transparent focus:outline-none"
              style={{
                color: '#f4f4f5',
                fontSize: '16px',
                lineHeight: '1.5',
                colorScheme: 'dark',
              }}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onSkip}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              Skip
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSet}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#f4f4f5',
                boxShadow: '0 0 16px rgba(255,255,255,0.06)',
              }}
            >
              Set due date
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
