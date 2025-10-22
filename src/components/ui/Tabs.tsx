'use client'

import { useState } from 'react'

export interface Tab {
    id: string
    label: string
    icon?: React.ComponentType<{ className?: string }>
}

interface TabsProps {
    tabs: Tab[]
    defaultTab?: string
    onChange?: (tabId: string) => void
    children: (activeTab: string) => React.ReactNode
}

export function Tabs({ tabs, defaultTab, onChange, children }: TabsProps) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId)
        onChange?.(tabId)
    }

    return (
        <div className="w-full">
            {/* Tab Headers */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id
                        const Icon = tab.icon

                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`
                                    group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium
                                    ${
                                        isActive
                                            ? 'border-[#004D40] text-[#004D40]'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }
                                `}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {Icon && (
                                    <Icon
                                        className={`
                                            -ml-0.5 mr-2 h-5 w-5
                                            ${isActive ? 'text-[#004D40]' : 'text-gray-400 group-hover:text-gray-500'}
                                        `}
                                    />
                                )}
                                <span>{tab.label}</span>
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-8">
                {children(activeTab)}
            </div>
        </div>
    )
}
