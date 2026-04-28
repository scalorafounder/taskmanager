import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

// ── Shared helpers ─────────────────────────────────────────────────────────────

function CheckCircle({ checked, onToggle, size = 22 }) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.82 }}
      className="flex-shrink-0 flex items-center justify-center rounded-full"
      style={{
        width: size, height: size,
        border: checked ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
        background: checked ? 'rgba(255,255,255,0.9)' : 'transparent',
        boxShadow: checked ? '0 0 16px rgba(255,255,255,0.25), 0 2px 8px rgba(0,0,0,0.3)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <AnimatePresence>
        {checked && (
          <motion.svg
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
            width={size * 0.52} height={size * 0.52}
            viewBox="0 0 14 14" fill="none"
          >
            <path d="M2 7l3.5 3.5L12 3" stroke="#0c0c0e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

function formatShortDue(ts) {
  const diffMs = ts - Date.now()
  const diffDays = Math.floor(diffMs / 86400000)
  const d = new Date(ts)
  if (diffMs < 0) return 'Overdue'
  if (diffDays === 0) return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'short' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function UrgencyGradient({ dueDate, createdAt, borderRadius }) {
  if (!dueDate) return null
  const start = createdAt || dueDate - 86400000
  const urgency = Math.max(0, Math.min(1, (Date.now() - start) / (dueDate - start)))
  const grayStop = Math.round((1 - urgency) * 85)
  const redAlpha = (urgency * 0.38).toFixed(2)
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        borderRadius,
        background: `linear-gradient(to right, transparent 0%, rgba(180,180,180,0.05) ${grayStop}%, rgba(255,65,65,${redAlpha}) 100%)`,
        zIndex: 0,
      }}
    />
  )
}

// ── SubTaskCard — full task bar for children inside a group ───────────────────

function SubTaskCard({ sub, groupId, onToggle, onDelete, onExpand, gradientTick }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: sub.id })
  const isOverdue = sub.dueDate && Date.now() > sub.dueDate && !sub.completed

  const borderColor = sub.completed
    ? 'rgba(74,222,128,0.4)'
    : isOverdue
    ? 'rgba(255,80,80,0.35)'
    : 'rgba(255,255,255,0.07)'

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.96 }}
      transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative overflow-hidden"
      style={{ borderRadius: 18, opacity: isDragging ? 0.25 : 1 }}
    >
      {/* Urgency gradient */}
      {sub.dueDate && !sub.completed && (
        <UrgencyGradient
          key={gradientTick}
          dueDate={sub.dueDate}
          createdAt={sub.createdAt}
          borderRadius={18}
        />
      )}

      <div
        className="relative flex items-center gap-3 px-4 py-3 z-10"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${borderColor}`,
          borderRadius: 18,
          boxShadow: sub.completed
            ? '0 2px 10px rgba(0,0,0,0.25), 0 0 0 1px rgba(74,222,128,0.08)'
            : isOverdue
            ? '0 2px 10px rgba(0,0,0,0.25), 0 0 10px rgba(255,80,80,0.1)'
            : '0 2px 10px rgba(0,0,0,0.25)',
        }}
      >
        {/* Checkbox — isolated from drag */}
        <div onPointerDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
          <CheckCircle checked={sub.completed} onToggle={() => onToggle(groupId, sub.id)} size={20} />
        </div>

        {/* Title + due date — drag handle AND expand tap */}
        <div
          {...attributes}
          {...listeners}
          className="flex-1 min-w-0 touch-none select-none"
          style={{ cursor: isDragging ? 'grabbing' : 'default' }}
          onClick={() => !isDragging && onExpand?.(groupId, sub.id)}
        >
          <p
            className="text-sm font-medium truncate"
            style={{ color: sub.completed ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.88)' }}
          >
            {sub.title}
          </p>
          {sub.dueDate && !sub.completed && (
            <span
              className="inline-flex items-center gap-1 text-xs"
              style={{ color: isOverdue ? 'rgba(255,100,100,0.85)' : 'rgba(255,255,255,0.38)' }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6v6l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {formatShortDue(sub.dueDate)}
            </span>
          )}
        </div>

        {/* Delete — isolated from drag */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onPointerDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete(groupId, sub.id) }}
          className="w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0"
          style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.15)' }}
        >
          <svg width="8" height="8" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="rgba(255,100,100,0.8)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </motion.button>
      </div>
    </motion.div>
  )
}

// ── TaskItem ──────────────────────────────────────────────────────────────────

export default function TaskItem({
  task,
  onToggle,
  onToggleSub,
  onDelete,
  onDeleteSub,
  onRename,
  onAddSub,
  onExpand,
  onExpandSub,
  onClearPendingRename,
  isDragOverlay = false,
  isDropTarget = false,
  gradientTick,
}) {
  const [editingName, setEditingName] = useState(task.pendingRename || false)
  const [nameVal, setNameVal] = useState(task.title)
  const [addingSubTask, setAddingSubTask] = useState(false)
  const [subInput, setSubInput] = useState('')
  const nameRef = useRef(null)
  const subRef = useRef(null)

  const isGroup = task.type === 'group'
  const isOverdue = task.dueDate && Date.now() > task.dueDate && !task.completed

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: isDragOverlay,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  useEffect(() => {
    if (editingName && nameRef.current) { nameRef.current.focus(); nameRef.current.select() }
  }, [editingName])

  useEffect(() => {
    if (addingSubTask && subRef.current) subRef.current.focus()
  }, [addingSubTask])

  useEffect(() => {
    if (task.pendingRename) { setEditingName(true); onClearPendingRename?.(task.id) }
  }, [task.pendingRename])

  const commitName = () => {
    const trimmed = nameVal.trim()
    if (trimmed) onRename?.(task.id, trimmed)
    else setNameVal(task.title)
    setEditingName(false)
  }

  const submitSub = () => {
    const trimmed = subInput.trim()
    if (trimmed) onAddSub?.(task.id, trimmed)
    setSubInput('')
    setAddingSubTask(false)
  }

  // ── GROUP: section divider + child task cards ─────────────────────────────
  if (isGroup) {
    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.24, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative"
      >
        {/* Section header row */}
        <motion.div
          className="flex items-center gap-2 px-1 pt-3 pb-2"
          animate={isDropTarget ? { backgroundColor: 'rgba(255,255,255,0.04)' } : { backgroundColor: 'transparent' }}
          style={{ borderRadius: 12 }}
          transition={{ duration: 0.18 }}
        >
          {/* Drag handle for reordering the whole group */}
          <div
            {...attributes}
            {...listeners}
            className="touch-none flex-shrink-0 flex items-center cursor-grab active:cursor-grabbing"
            style={{ color: 'rgba(255,255,255,0.2)', padding: '2px 4px' }}
          >
            <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
              <circle cx="2.5" cy="2"  r="1.5"/>
              <circle cx="7.5" cy="2"  r="1.5"/>
              <circle cx="2.5" cy="7"  r="1.5"/>
              <circle cx="7.5" cy="7"  r="1.5"/>
              <circle cx="2.5" cy="12" r="1.5"/>
              <circle cx="7.5" cy="12" r="1.5"/>
            </svg>
          </div>

          {/* Group name */}
          {editingName ? (
            <input
              ref={nameRef}
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => {
                if (e.key === 'Enter') commitName()
                if (e.key === 'Escape') { setNameVal(task.title); setEditingName(false) }
              }}
              className="bg-transparent focus:outline-none font-bold uppercase tracking-widest"
              style={{
                color: 'rgba(255,255,255,0.6)',
                borderBottom: '1px solid rgba(255,255,255,0.3)',
                fontSize: '11px',
                minWidth: 80,
              }}
            />
          ) : (
            <span
              className="text-xs font-bold uppercase tracking-widest select-none"
              style={{ color: 'rgba(255,255,255,0.4)', cursor: 'default', letterSpacing: '0.08em' }}
              onDoubleClick={() => setEditingName(true)}
            >
              {task.title}
            </span>
          )}

          {/* Divider */}
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

          {/* Add task */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setAddingSubTask(a => !a)}
            className="w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </motion.button>

          {/* Delete group */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => onDelete(task.id)}
            className="w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.15)' }}
          >
            <svg width="8" height="8" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="rgba(255,100,100,0.8)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </motion.button>
        </motion.div>

        {/* Child task cards (hidden when used as DragOverlay ghost) */}
        {!isDragOverlay && (
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {task.children?.map(sub => (
                <SubTaskCard
                  key={sub.id}
                  sub={sub}
                  groupId={task.id}
                  onToggle={onToggleSub}
                  onDelete={onDeleteSub}
                  onExpand={onExpandSub}
                  gradientTick={gradientTick}
                />
              ))}
            </AnimatePresence>

            {/* Inline add input */}
            <AnimatePresence>
              {addingSubTask && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-[18px]"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
                  >
                    <div
                      className="w-5 h-5 rounded-full border border-dashed flex-shrink-0"
                      style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                    />
                    <input
                      ref={subRef}
                      value={subInput}
                      onChange={e => setSubInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') submitSub()
                        if (e.key === 'Escape') { setSubInput(''); setAddingSubTask(false) }
                      }}
                      onBlur={submitSub}
                      placeholder="Task name…"
                      className="flex-1 bg-transparent focus:outline-none"
                      style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', lineHeight: '1.5' }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {task.children?.length === 0 && !addingSubTask && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[18px]"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)' }}
              >
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>
                  Empty — tap + to add a task
                </span>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    )
  }

  // ── REGULAR TASK ────────────────────────────────────────────────────────────
  const borderRadius = 20
  const cardBorder = isDropTarget
    ? 'rgba(255,255,255,0.2)'
    : task.completed
    ? 'rgba(74,222,128,0.4)'
    : isOverdue
    ? 'rgba(255,80,80,0.35)'
    : 'rgba(255,255,255,0.07)'

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.96 }}
      transition={{ duration: 0.24, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative"
    >
      {/* Drop target glow */}
      <AnimatePresence>
        {isDropTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius,
              border: '1.5px solid rgba(255,255,255,0.4)',
              boxShadow: '0 0 0 4px rgba(255,255,255,0.06), inset 0 0 20px rgba(255,255,255,0.03)',
              zIndex: 10,
            }}
          />
        )}
      </AnimatePresence>

      <div
        {...attributes}
        {...listeners}
        className="relative overflow-hidden touch-none"
        style={{
          background: isDragOverlay
            ? 'rgba(30,30,35,0.98)'
            : isDropTarget
            ? 'rgba(255,255,255,0.09)'
            : 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${cardBorder}`,
          borderRadius,
          boxShadow: isDragOverlay
            ? '0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)'
            : task.completed
            ? '0 2px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(74,222,128,0.08)'
            : isOverdue
            ? '0 2px 12px rgba(0,0,0,0.3), 0 0 12px rgba(255,80,80,0.12)'
            : '0 2px 12px rgba(0,0,0,0.3)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {/* Urgency gradient */}
        {!task.completed && !isDragOverlay && (
          <UrgencyGradient
            key={gradientTick}
            dueDate={task.dueDate}
            createdAt={task.createdAt}
            borderRadius={borderRadius}
          />
        )}

        {/* Main row */}
        <div className="flex items-center gap-3 px-4 py-3.5 relative" style={{ zIndex: 1 }}>
          {/* Checkbox */}
          <div onPointerDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
            <CheckCircle checked={task.completed} onToggle={() => onToggle(task.id)} />
          </div>

          {/* Title + due badge — tapping opens detail */}
          <div
            className="flex-1 min-w-0"
            onPointerDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            onClick={() => onExpand?.(task.id)}
          >
            <span
              className="block text-sm font-medium truncate select-none"
              style={{ color: task.completed ? 'rgba(255,255,255,0.6)' : '#f4f4f5' }}
            >
              {task.title}
            </span>
            {task.dueDate && !task.completed && (
              <motion.span
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-1 text-xs mt-0.5"
                style={{ color: isOverdue ? 'rgba(255,100,100,0.85)' : 'rgba(255,255,255,0.38)' }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6v6l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {formatShortDue(task.dueDate)}
              </motion.span>
            )}
          </div>

          {/* Delete */}
          <div onPointerDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
            <motion.button
              whileTap={{ scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => onDelete(task.id)}
              className="w-7 h-7 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.15)' }}
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="rgba(255,100,100,0.8)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
