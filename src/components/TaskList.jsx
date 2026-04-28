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

const MERGE_THRESHOLD_MS = 400

function findSubtaskParent(tasks, childId) {
  return tasks.find(t => t.type === 'group' && t.children?.some(c => c.id === childId)) || null
}

export default function TaskList({
  tasks,
  onToggle,
  onToggleSub,
  onDelete,
  onDeleteSub,
  onRename,
  onAddSub,
  onReorder,
  onMerge,
  onExtract,
  onExpand,
  onExpandSub,
  onUpdateTask,
  onClearPendingRename,
  gradientTick,
  emptyLabel,
}) {
  const [activeId, setActiveId] = useState(null)
  const [overId, setOverId] = useState(null)
  const hoverTimerRef = useRef(null)
  const mergeTriggeredRef = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  )

  const activeTopTask = tasks.find(t => t.id === activeId)
  const activeSubItem = !activeTopTask && activeId
    ? tasks.flatMap(t => t.children || []).find(c => c.id === activeId)
    : null

  const isDraggingSubtask = activeId ? !!findSubtaskParent(tasks, activeId) : false

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

    // Don't trigger merge when dragging a subtask out
    if (findSubtaskParent(tasks, active.id)) {
      setOverId(over.id)
      return
    }

    if (overId !== over.id) {
      setOverId(over.id)
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = setTimeout(() => {
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

    // Check if dragging a subtask — always extract it
    const parentGroup = findSubtaskParent(tasks, active.id)
    if (parentGroup) {
      onExtract(parentGroup.id, active.id, over.id)
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
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M9 11l3 3L22 4" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>{emptyLabel}</p>
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
                onDeleteSub={onDeleteSub}
                onRename={onRename}
                onAddSub={onAddSub}
                onExpand={onExpand}
                onExpandSub={onExpandSub}
                onClearPendingRename={onClearPendingRename}
                isDropTarget={overId === task.id && activeId !== task.id && mergeTriggeredRef.current && !isDraggingSubtask}
                gradientTick={gradientTick}
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        {activeTopTask ? (
          <TaskItem
            task={activeTopTask}
            onToggle={() => {}}
            onToggleSub={() => {}}
            onDelete={() => {}}
            onDeleteSub={() => {}}
            onRename={() => {}}
            onAddSub={() => {}}
            onExpand={() => {}}
            isDragOverlay
          />
        ) : activeSubItem ? (
          <div
            style={{
              background: 'rgba(30,30,35,0.98)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: '10px 14px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: activeSubItem.completed ? 'none' : '1.5px solid rgba(255,255,255,0.3)',
              background: activeSubItem.completed ? 'rgba(255,255,255,0.9)' : 'transparent',
              flexShrink: 0,
            }}/>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{activeSubItem.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
