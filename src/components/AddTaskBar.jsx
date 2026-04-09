import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AddTaskBar({ onAdd }) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
  }

  return (
    <div
      className="px-4 pb-6 pt-3"
      style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 0px) + 16px)' }}
    >
      <motion.div
        animate={{
          boxShadow: focused
            ? '0 0 0 1px rgba(255,255,255,0.18), 0 8px 32px rgba(0,0,0,0.5)'
            : '0 0 0 1px rgba(255,255,255,0.07), 0 4px 20px rgba(0,0,0,0.4)',
        }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Add a task…"
          className="flex-1 bg-transparent focus:outline-none"
          style={{
            color: '#f4f4f5',
            caretColor: '#fff',
            fontSize: '16px',
          }}
        />

        <AnimatePresence>
          {value.trim() && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
              whileTap={{ scale: 0.88 }}
              onClick={submit}
              className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.12)',
                boxShadow: '0 0 12px rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
