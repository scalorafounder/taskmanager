import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthScreen from './components/AuthScreen'
import TaskList from './components/TaskList'
import AddTaskBar from './components/AddTaskBar'
import { useTasks } from './hooks/useTasks'
import { supabase } from './lib/supabase'
import './index.css'

const SUPABASE_CONFIGURED = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function loadTasksFromDB(userId) {
  const { data, error } = await supabase
    .from('user_tasks')
    .select('tasks')
    .eq('user_id', userId)
    .single()
  if (error || !data) return []
  return data.tasks || []
}

async function saveTasksToDB(userId, tasks) {
  await supabase.from('user_tasks').upsert(
    { user_id: userId, tasks, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
}

// ── Tab button ────────────────────────────────────────────────────────────────
function TabButton({ label, active, count, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="relative flex-1 py-2 text-sm font-semibold rounded-xl"
      style={{ color: active ? '#f4f4f5' : 'rgba(255,255,255,0.3)' }}
    >
      {active && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.08)',
            boxShadow: '0 0 12px rgba(255,255,255,0.04)',
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
      <span className="relative z-10">
        {label}
        {count > 0 && (
          <span
            className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
            style={{
              background: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
              color: active ? '#f4f4f5' : 'rgba(255,255,255,0.3)',
            }}
          >
            {count}
          </span>
        )}
      </span>
    </motion.button>
  )
}

// ── App content ───────────────────────────────────────────────────────────────
function AppContent() {
  const { user } = useAuth()
  const [tab, setTab] = useState('inprogress')
  const [syncing, setSyncing] = useState(false)
  const saveTimer = useRef(null)
  const initialized = useRef(false)

  const {
    tasks, initTasks,
    addTask, toggleTask, toggleSubTask, deleteTask,
    renameGroup, addSubTask, reorder, mergeIntoGroup, clearPendingRename,
  } = useTasks()

  // Load tasks from Supabase on mount (when signed in)
  useEffect(() => {
    if (!user || !SUPABASE_CONFIGURED || initialized.current) return
    initialized.current = true
    setSyncing(true)
    loadTasksFromDB(user.id).then(loaded => {
      initTasks(loaded)
      setSyncing(false)
    })
  }, [user])

  // Debounced save whenever tasks change
  useEffect(() => {
    if (!user || !SUPABASE_CONFIGURED || !initialized.current || syncing) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveTasksToDB(user.id, tasks)
    }, 800)
    return () => clearTimeout(saveTimer.current)
  }, [tasks, user])

  const inProgress = tasks.filter(t => !t.completed)
  const completed = tasks.filter(t => t.completed)
  const visible = tab === 'inprogress' ? inProgress : completed

  return (
    <div
      className="min-h-dvh w-full flex flex-col relative overflow-hidden"
      style={{ background: '#0c0c0e' }}
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
          width: 500, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}/>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 200,
          background: 'linear-gradient(to top, rgba(255,255,255,0.015) 0%, transparent 100%)',
        }}/>
      </div>

      {/* Header */}
      <div
        className="relative flex items-center justify-between px-5 pt-4 pb-2"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#f4f4f5' }}>
            My Tasks
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {inProgress.length} remaining
            </p>
            {syncing && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-1"
              >
                <svg className="animate-spin w-2.5 h-2.5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>syncing</span>
              </motion.div>
            )}
          </div>
        </div>

        {user && SUPABASE_CONFIGURED && (
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => supabase.auth.signOut()}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            title="Sign out"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 pt-2 pb-1 relative">
        <div
          className="flex gap-1 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <TabButton label="In Progress" active={tab === 'inprogress'} count={inProgress.length} onClick={() => setTab('inprogress')} />
          <TabButton label="Completed"   active={tab === 'completed'}  count={completed.length}  onClick={() => setTab('completed')} />
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-2 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: tab === 'inprogress' ? -14 : 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: tab === 'inprogress' ? 14 : -14 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <TaskList
              tasks={visible}
              onToggle={toggleTask}
              onToggleSub={toggleSubTask}
              onDelete={deleteTask}
              onRename={renameGroup}
              onAddSub={addSubTask}
              onReorder={reorder}
              onMerge={mergeIntoGroup}
              onClearPendingRename={clearPendingRename}
              emptyLabel={tab === 'inprogress' ? 'No tasks yet — add one below' : 'Nothing completed yet'}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Add task bar */}
      {tab === 'inprogress' && (
        <div
          className="sticky bottom-0 relative"
          style={{
            background: 'linear-gradient(to top, #0c0c0e 55%, rgba(12,12,14,0) 100%)',
          }}
        >
          <AddTaskBar onAdd={addTask} />
        </div>
      )}
    </div>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────
function AppShell() {
  const { user, loading } = useAuth()
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    const h = () => setDemoMode(true)
    window.addEventListener('demo-mode', h)
    return () => window.removeEventListener('demo-mode', h)
  }, [])

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: '#0c0c0e' }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-8 h-8 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </div>
    )
  }

  if (!SUPABASE_CONFIGURED || user || demoMode) return <AppContent />
  return <AuthScreen />
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
