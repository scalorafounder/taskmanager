import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function CheckCircle({ checked, onToggle, size = 22 }) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.82 }}
      className="flex-shrink-0 flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
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
            width={size * 0.52}
            height={size * 0.52}
            viewBox="0 0 14 14"
            fill="none"
          >
            <path d="M2 7l3.5 3.5L12 3" stroke="#0c0c0e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

function SubTaskRow({ sub, groupId, onToggle }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2.5 py-1.5 px-1"
    >
      <CheckCircle checked={sub.completed} onToggle={() => onToggle(groupId, sub.id)} size={18} />
      <span
        className="text-sm flex-1 transition-all"
        style={{
          color: sub.completed ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)',
          textDecoration: sub.completed ? 'line-through' : 'none',
        }}
      >
        {sub.title}
      </span>
    </motion.div>
  )
}

export default function TaskItem({
  task,
  onToggle,
  onToggleSub,
  onDelete,
  onRename,
  onAddSub,
  onClearPendingRename,
  isDragOverlay = false,
  isDropTarget = false,
}) {
  const [expanded, setExpanded] = useState(true)
  const [editingName, setEditingName] = useState(task.pendingRename || false)
  const [nameVal, setNameVal] = useState(task.title)
  const [addingSubTask, setAddingSubTask] = useState(false)
  const [subInput, setSubInput] = useState('')
  const nameRef = useRef(null)
  const subRef = useRef(null)

  const isGroup = task.type === 'group'
  const completedSubs = isGroup ? task.children?.filter(c => c.completed).length : 0
  const totalSubs = isGroup ? task.children?.length : 0
  const progress = isGroup && totalSubs > 0 ? completedSubs / totalSubs : 0

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
              borderRadius: isGroup ? 24 : 20,
              border: '1.5px solid rgba(255,255,255,0.4)',
              boxShadow: '0 0 0 4px rgba(255,255,255,0.06), inset 0 0 20px rgba(255,255,255,0.03)',
              zIndex: 10,
            }}
          />
        )}
      </AnimatePresence>

      <div
        className="relative overflow-hidden"
        style={{
          background: isDragOverlay
            ? 'rgba(30,30,35,0.98)'
            : isDropTarget
            ? 'rgba(255,255,255,0.09)'
            : 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${isDropTarget ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: isGroup ? 24 : 20,
          boxShadow: isDragOverlay
            ? '0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)'
            : '0 2px 12px rgba(0,0,0,0.3)',
        }}
      >
        {/* Group progress bar */}
        {isGroup && totalSubs > 0 && (
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="h-full"
              style={{ background: 'rgba(255,255,255,0.5)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        )}

        {/* Main row */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 flex flex-col gap-0.5 cursor-grab active:cursor-grabbing touch-none"
            style={{ opacity: 0.2 }}
          >
            {[0, 1, 2].map(i => (
              <div key={i} className="flex gap-0.5">
                <div className="w-1 h-1 rounded-full bg-white"/>
                <div className="w-1 h-1 rounded-full bg-white"/>
              </div>
            ))}
          </div>

          {/* Checkbox */}
          <CheckCircle checked={task.completed} onToggle={() => onToggle(task.id)} />

          {/* Title */}
          <div className="flex-1 min-w-0">
            {editingName && isGroup ? (
              <input
                ref={nameRef}
                value={nameVal}
                onChange={e => setNameVal(e.target.value)}
                onBlur={commitName}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitName()
                  if (e.key === 'Escape') { setNameVal(task.title); setEditingName(false) }
                }}
                className="w-full bg-transparent font-semibold text-sm focus:outline-none"
                style={{
                  color: '#f4f4f5',
                  borderBottom: '1px solid rgba(255,255,255,0.3)',
                  fontSize: '16px',
                }}
              />
            ) : (
              <span
                className="block text-sm font-medium truncate select-none"
                style={{
                  color: task.completed ? 'rgba(255,255,255,0.25)' : '#f4f4f5',
                  textDecoration: task.completed ? 'line-through' : 'none',
                  cursor: isGroup ? 'pointer' : 'default',
                }}
                onDoubleClick={() => isGroup && setEditingName(true)}
              >
                {task.title}
              </span>
            )}
            {isGroup && (
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {completedSubs}/{totalSubs} complete
              </span>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isGroup && (
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setExpanded(e => !e)}
                className="w-7 h-7 flex items-center justify-center rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <motion.svg
                  width="11" height="11" viewBox="0 0 12 12" fill="none"
                  animate={{ rotate: expanded ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <path d="M2 4l4 4 4-4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </motion.svg>
              </motion.button>
            )}

            {/* Delete — always visible */}
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

        {/* Group children */}
        {isGroup && (
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div
                  className="mx-4 mb-3 rounded-2xl px-3 py-2"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {task.children?.map(sub => (
                    <SubTaskRow key={sub.id} sub={sub} groupId={task.id} onToggle={onToggleSub} />
                  ))}

                  {addingSubTask ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 py-1.5 px-1"
                    >
                      <div className="w-4 h-4 rounded-full border border-dashed flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.2)' }}/>
                      <input
                        ref={subRef}
                        value={subInput}
                        onChange={e => setSubInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') submitSub()
                          if (e.key === 'Escape') { setSubInput(''); setAddingSubTask(false) }
                        }}
                        onBlur={submitSub}
                        placeholder="Add task…"
                        className="flex-1 bg-transparent focus:outline-none"
                        style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}
                      />
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => setAddingSubTask(true)}
                      className="flex items-center gap-2 py-1.5 px-1 w-full text-left"
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1v12M1 7h12" stroke="rgba(255,255,255,0.2)" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Add task</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}
