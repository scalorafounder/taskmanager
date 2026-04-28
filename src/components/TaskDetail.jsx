import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function formatCountdown(ms) {
  if (ms <= 0) {
    const abs = Math.abs(ms)
    const d = Math.floor(abs / 86400000)
    const h = Math.floor((abs % 86400000) / 3600000)
    const m = Math.floor((abs % 3600000) / 60000)
    if (d > 0) return { label: `${d}d ${h}h overdue`, overdue: true }
    if (h > 0) return { label: `${h}h ${m}m overdue`, overdue: true }
    return { label: `${m}m overdue`, overdue: true }
  }
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  if (d > 1) return { label: `${d} days left`, overdue: false }
  if (d === 1) return { label: `${h}h ${m}m left tomorrow`, overdue: false }
  if (h > 0) return { label: `${h}h ${m}m left`, overdue: false }
  if (m > 0) return { label: `${m}m ${s}s left`, overdue: false }
  return { label: `${s}s left`, overdue: false }
}

function formatDueDate(ts) {
  const d = new Date(ts)
  return d.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function UrgencyBar({ dueDate, createdAt }) {
  const urgency = dueDate
    ? Math.max(0, Math.min(1, (Date.now() - createdAt) / (dueDate - createdAt)))
    : 0
  const grayStop = Math.round((1 - urgency) * 80)
  const redAlpha = (urgency * 0.55).toFixed(2)

  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height: 6, background: 'rgba(255,255,255,0.06)' }}
    >
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          background: `linear-gradient(to right,
            rgba(180,180,180,0.18) 0%,
            rgba(180,180,180,0.12) ${grayStop}%,
            rgba(255,70,70,${redAlpha}) 100%
          )`,
        }}
      />
    </div>
  )
}

export default function TaskDetail({ task, onClose, onUpdate, onToggle, onDelete }) {
  const [now, setNow] = useState(Date.now())
  const [desc, setDesc] = useState(task.description || '')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal] = useState(task.title)
  const saveTimer = useRef(null)
  const titleRef = useRef(null)
  const textareaRef = useRef(null)

  // Live countdown tick
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [desc])

  // Debounced description save
  const handleDescChange = useCallback((e) => {
    const val = e.target.value
    setDesc(val)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      onUpdate(task.id, { description: val })
    }, 500)
  }, [task.id, onUpdate])

  useEffect(() => {
    if (editingTitle && titleRef.current) {
      titleRef.current.focus()
      titleRef.current.select()
    }
  }, [editingTitle])

  const commitTitle = () => {
    const trimmed = titleVal.trim()
    if (trimmed && trimmed !== task.title) onUpdate(task.id, { title: trimmed })
    else setTitleVal(task.title)
    setEditingTitle(false)
  }

  const countdown = task.dueDate ? formatCountdown(task.dueDate - now) : null

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0"
        style={{ background: 'rgba(0,0,0,0.72)', zIndex: 50 }}
        onClick={onClose}
      />

      {/* Detail sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 44 }}
        className="fixed left-0 right-0 bottom-0 overflow-y-auto"
        style={{
          zIndex: 51,
          background: '#18181c',
          borderRadius: '28px 28px 0 0',
          maxHeight: '88dvh',
          paddingBottom: 'max(28px, env(safe-area-inset-bottom, 0px) + 16px)',
          boxShadow: '0 -12px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        <div className="px-5 pt-2 pb-4">
          {/* Top row: close + complete + delete */}
          <div className="flex items-center justify-between mb-4">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </motion.button>

            <div className="flex items-center gap-2">
              {/* Complete toggle */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => onToggle(task.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{
                  background: task.completed ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${task.completed ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  color: task.completed ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.5)',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {task.completed ? 'Done' : 'Mark done'}
              </motion.button>

              {/* Delete */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => { onDelete(task.id); onClose() }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{
                  background: 'rgba(255,80,80,0.1)',
                  border: '1px solid rgba(255,80,80,0.2)',
                  color: 'rgba(255,100,100,0.85)',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Delete
              </motion.button>
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            {editingTitle ? (
              <input
                ref={titleRef}
                value={titleVal}
                onChange={e => setTitleVal(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitTitle()
                  if (e.key === 'Escape') { setTitleVal(task.title); setEditingTitle(false) }
                }}
                className="w-full bg-transparent focus:outline-none text-xl font-bold"
                style={{ color: '#f4f4f5', fontSize: '20px', lineHeight: '1.3', borderBottom: '1px solid rgba(255,255,255,0.25)' }}
              />
            ) : (
              <h2
                className="text-xl font-bold leading-snug cursor-pointer"
                style={{ color: task.completed ? 'rgba(255,255,255,0.5)' : '#f4f4f5' }}
                onDoubleClick={() => setEditingTitle(true)}
              >
                {task.title}
              </h2>
            )}
          </div>

          {/* Due date + countdown */}
          {task.dueDate ? (
            <div
              className="rounded-2xl p-4 mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Due</p>
                  <p className="text-sm font-semibold" style={{ color: '#f4f4f5' }}>
                    {formatDueDate(task.dueDate)}
                  </p>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={countdown?.label}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.18 }}
                    className="text-right"
                  >
                    <p className="text-xs font-bold px-2 py-1 rounded-xl"
                      style={{
                        background: countdown?.overdue ? 'rgba(255,80,80,0.15)' : 'rgba(255,255,255,0.07)',
                        color: countdown?.overdue ? 'rgba(255,100,100,0.9)' : 'rgba(255,255,255,0.6)',
                        border: `1px solid ${countdown?.overdue ? 'rgba(255,80,80,0.2)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      {countdown?.label}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Urgency bar */}
              <UrgencyBar dueDate={task.dueDate} createdAt={task.createdAt || (task.dueDate - 86400000)} />
            </div>
          ) : (
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
                <path d="M12 6v6l4 2" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>No due date set</span>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />

          {/* Description / Notes */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>NOTES</p>
            <textarea
              ref={textareaRef}
              value={desc}
              onChange={handleDescChange}
              placeholder="Add notes, links, context…"
              className="w-full bg-transparent focus:outline-none resize-none"
              style={{
                color: 'rgba(255,255,255,0.75)',
                fontSize: '15px',
                lineHeight: '1.6',
                minHeight: 80,
                caretColor: '#fff',
              }}
            />
          </div>
        </div>
      </motion.div>
    </>
  )
}
