import { useState, useCallback } from 'react'

let nextId = 1
const uid = () => `task-${Date.now()}-${nextId++}`

export function useTasks() {
  const [tasks, setTasks] = useState([])

  const initTasks = useCallback((loaded) => {
    setTasks(loaded)
  }, [])

  const addTask = useCallback((title, dueDate = null, description = '') => {
    const task = {
      id: uid(),
      title,
      completed: false,
      type: 'task',
      createdAt: Date.now(),
      dueDate,
      description,
    }
    setTasks(prev => [task, ...prev])
    return task
  }, [])

  const updateTask = useCallback((id, patch) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  }, [])

  const toggleTask = useCallback((id) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ))
  }, [])

  const toggleSubTask = useCallback((groupId, childId) => {
    setTasks(prev => prev.map(g => {
      if (g.id !== groupId || g.type !== 'group') return g
      const updatedChildren = g.children.map(c =>
        c.id === childId ? { ...c, completed: !c.completed } : c
      )
      return { ...g, children: updatedChildren, completed: updatedChildren.every(c => c.completed) }
    }))
  }, [])

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const deleteSubTask = useCallback((groupId, childId) => {
    setTasks(prev => prev.map(g => {
      if (g.id !== groupId || g.type !== 'group') return g
      const newChildren = g.children.filter(c => c.id !== childId)
      return { ...g, children: newChildren, completed: newChildren.length > 0 && newChildren.every(c => c.completed) }
    }))
  }, [])

  const renameGroup = useCallback((id, title) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title } : t))
  }, [])

  const addSubTask = useCallback((groupId, title) => {
    const sub = { id: uid(), title, completed: false, dueDate: null, description: '', createdAt: Date.now() }
    setTasks(prev => prev.map(g =>
      g.id === groupId && g.type === 'group'
        ? { ...g, children: [...g.children, sub] }
        : g
    ))
  }, [])

  const reorder = useCallback((activeId, overId) => {
    setTasks(prev => {
      const oldIdx = prev.findIndex(t => t.id === activeId)
      const newIdx = prev.findIndex(t => t.id === overId)
      if (oldIdx === -1 || newIdx === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(oldIdx, 1)
      next.splice(newIdx, 0, moved)
      return next
    })
  }, [])

  const mergeIntoGroup = useCallback((dragId, dropId) => {
    setTasks(prev => {
      const dragTask = prev.find(t => t.id === dragId)
      const dropTask = prev.find(t => t.id === dropId)
      if (!dragTask || !dropTask) return prev

      // Groups are never merge-able — should be caught upstream, but guard here too
      if (dragTask.type === 'group') return prev

      const toChild = (t) => ({
        id: t.id, title: t.title, completed: t.completed,
        dueDate: t.dueDate ?? null,
        description: t.description ?? '',
        createdAt: t.createdAt ?? Date.now(),
      })

      if (dropTask.type === 'group') {
        const newChild = toChild(dragTask)
        const updated = prev.map(t => {
          if (t.id === dropId) {
            const newChildren = [...t.children, newChild]
            return { ...t, children: newChildren, completed: newChildren.every(c => c.completed) }
          }
          return t
        })
        return updated.filter(t => t.id !== dragId)
      }

      const groupId = uid()
      const group = {
        id: groupId,
        title: 'New Group',
        completed: false,
        type: 'group',
        children: [toChild(dropTask), toChild(dragTask)],
        createdAt: Date.now(),
        pendingRename: true,
      }
      const filtered = prev.filter(t => t.id !== dragId && t.id !== dropId)
      const dropIdx = prev.findIndex(t => t.id === dropId)
      const insertIdx = Math.max(0, filtered.length - (prev.length - dropIdx - 1))
      const result = [...filtered]
      result.splice(insertIdx, 0, group)
      return result
    })
  }, [])

  const updateSubTask = useCallback((groupId, childId, patch) => {
    setTasks(prev => prev.map(g => {
      if (g.id !== groupId || g.type !== 'group') return g
      return { ...g, children: g.children.map(c => c.id === childId ? { ...c, ...patch } : c) }
    }))
  }, [])

  const clearPendingRename = useCallback((id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, pendingRename: false } : t))
  }, [])

  const extractFromGroup = useCallback((groupId, childId, overTaskId) => {
    setTasks(prev => {
      const group = prev.find(t => t.id === groupId)
      if (!group) return prev
      const child = (group.children || []).find(c => c.id === childId)
      if (!child) return prev

      const updatedGroup = { ...group, children: (group.children || []).filter(c => c.id !== childId) }
      const newTask = {
        id: child.id, title: child.title, completed: child.completed,
        type: 'task',
        dueDate: child.dueDate ?? null,
        description: child.description ?? '',
        createdAt: child.createdAt ?? Date.now(),
      }

      const withUpdatedGroup = prev.map(t => t.id === groupId ? updatedGroup : t)
      const overIdx = withUpdatedGroup.findIndex(t => t.id === overTaskId)

      const result = [...withUpdatedGroup]
      if (overIdx !== -1) {
        result.splice(overIdx, 0, newTask)
      } else {
        const groupIdx = result.findIndex(t => t.id === groupId)
        result.splice(Math.max(0, groupIdx), 0, newTask)
      }
      return result
    })
  }, [])

  const addGroup = useCallback(() => {
    const group = {
      id: uid(),
      title: 'New Group',
      completed: false,
      type: 'group',
      children: [],
      createdAt: Date.now(),
      pendingRename: true,
    }
    setTasks(prev => [group, ...prev])
  }, [])

  return {
    tasks,
    initTasks,
    addTask,
    updateTask,
    toggleTask,
    toggleSubTask,
    deleteTask,
    deleteSubTask,
    updateSubTask,
    renameGroup,
    addSubTask,
    reorder,
    mergeIntoGroup,
    clearPendingRename,
    extractFromGroup,
    addGroup,
  }
}
