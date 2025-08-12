
import { useAppStore } from '@utils/store'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'
import BottomPanel from './BottomPanel'
import TopToolbar from './TopToolbar'
import SettingsPanel from './SettingsPanel'
import { ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'

function Layout() {
  const { 
    leftPanelOpen, 
    rightPanelOpen, 
    bottomPanelOpen,
    settingsPanelOpen,
    toggleLeftPanel,
    toggleRightPanel,
    toggleBottomPanel,
    toggleSettingsPanel
  } = useAppStore()

  return (
    <>
      {/* Top Toolbar */}
      <TopToolbar />

      {/* Left Panel - Character Library */}
      <div className={`
        absolute left-0 top-12 h-[calc(100vh-3rem)] bg-secondary-900/95 backdrop-blur-sm 
        border-r border-secondary-700/50 transition-transform duration-300 z-40
        ${leftPanelOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="w-80 h-full">
          <LeftPanel />
        </div>
        
        {/* Toggle Button */}
        <button
          onClick={toggleLeftPanel}
          className="absolute -right-8 top-1/2 -translate-y-1/2 bg-secondary-800 hover:bg-secondary-700 
                     border border-secondary-600 rounded-r-lg p-2 transition-colors"
        >
          {leftPanelOpen ? (
            <ChevronLeft className="w-4 h-4 text-secondary-300" />
          ) : (
            <ChevronRight className="w-4 h-4 text-secondary-300" />
          )}
        </button>
      </div>

      {/* Right Panel - Animation Browser */}
      <div className={`
        absolute right-0 top-12 h-[calc(100vh-3rem)] bg-secondary-900/95 backdrop-blur-sm 
        border-l border-secondary-700/50 transition-transform duration-300 z-40
        ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="w-80 h-full">
          <RightPanel />
        </div>
        
        {/* Toggle Button */}
        <button
          onClick={toggleRightPanel}
          className="absolute -left-8 top-1/2 -translate-y-1/2 bg-secondary-800 hover:bg-secondary-700 
                     border border-secondary-600 rounded-l-lg p-2 transition-colors"
        >
          {rightPanelOpen ? (
            <ChevronRight className="w-4 h-4 text-secondary-300" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-secondary-300" />
          )}
        </button>
      </div>

      {/* Bottom Panel - Timeline Controls */}
      <div className={`
        absolute bottom-0 left-0 right-0 bg-secondary-900/95 backdrop-blur-sm 
        border-t border-secondary-700/50 transition-transform duration-300 z-40
        ${bottomPanelOpen ? 'translate-y-0' : 'translate-y-full'}
      `}>
        <div className="h-48">
          <BottomPanel />
        </div>
        
        {/* Toggle Button */}
        <button
          onClick={toggleBottomPanel}
          className="absolute -top-8 left-1/2 -translate-x-1/2 bg-secondary-800 hover:bg-secondary-700 
                     border border-secondary-600 rounded-t-lg p-2 transition-colors"
        >
          <ChevronUp className={`w-4 h-4 text-secondary-300 transition-transform ${
            bottomPanelOpen ? 'rotate-0' : 'rotate-180'
          }`} />
        </button>
      </div>

      {/* Settings Panel - Overlay */}
      {settingsPanelOpen && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-96 h-[80vh] bg-secondary-900 rounded-lg shadow-2xl border border-secondary-700">
            <SettingsPanel />
          </div>
        </div>
      )}
    </>
  )
}

export default Layout
