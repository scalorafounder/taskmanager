import { useState, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  MeasuringStrategy,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { AnimatePresence, motion } from 'framer-motion'
import TaskItem from './TaskItem'

const MERGE_THRESHOLD_MS = 400 // how long hover before merge triggers

export default function TaskList({
  tasks,
  onToggle,
  onToggleSub,
  onDelete,
  onRename,
  onAddSub,
  onReorder,
  onMerge,
  onClearPendingRename,
  emptyLabel,
}) {
  const [activeId, setActiveId] = useState(null)
  const [overId, setOverId] = useState(null)
  const hoverTimerRef = useRef(null)
  const mergeTriggeredRef = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  )

  const activeTask = tasks.find(t => t.id === activeId)

  const handleDragStart = ({ active }) => {
    setActiveId(active.id)
    mergeTriggeredRef.current = false
  }

  const handleDragOver = ({ active, over }) => {
    if (!over || active.id === over.id) {
      setOverId(null)
      clearTimeout(hoverTimerRef.current)
      return
    }

    // If hovering a different item, start merge timer
    if (overId !== over.id) {
      setOverId(over.id)
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = setTimeout(() => {
        // Trigger merge hint — actual merge on drop
        mergeTriggeredRef.current = true
      }, MERGE_THRESHOLD_MS)
    }
  }

  const handleDragEnd = ({ active, over }) => {
    clearTimeout(hoverTimerRef.current)
    setActiveId(null)
    setOverId(null)

    if (!over || active.id === over.id) {
      mergeTriggeredRef.current = false
      return
    }

    if (mergeTriggeredRef.current) {
      onMerge(active.id, over.id)
    } else {
      onReorder(active.id, over.id)
    }
    mergeTriggeredRef.current = false
  }

  const handleDragCancel = () => {
    clearTimeout(hoverTimerRef.current)
    setActiveId(null)
    setOverId(null)
    mergeTriggeredRef.current = false
  }

  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 gap-3"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.08)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 11l3 3L22 4" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>{emptyLabel}</p>
      </motion.div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onToggleSub={onToggleSub}
                onDelete={onDelete}
                onRename={onRename}
                onAddSub={onAddSub}
                onClearPendingRename={onClearPendingRename}
                isDropTarget={overId === task.id && activeId !== task.id && mergeTriggeredRef.current}
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        {activeTask && (
          <TaskItem
            task={activeTask}
            onToggle={() => {}}
            onToggleSub={() => {}}
            onDelete={() => {}}
            onRename={() => {}}
            onAddSub={() => {}}
            isDragOverlay
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
