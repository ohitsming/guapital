'use client'

import { motion } from 'framer-motion'

export default function Hero3DAnimation() {
    return (
        <div className="relative h-[400px] w-full sm:h-[500px] lg:h-[600px]">
            {/* Isometric grid floor */}
            <div className="absolute inset-0 overflow-hidden">
                <svg className="h-full w-full opacity-5" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="iso-grid" width="60" height="35" patternUnits="userSpaceOnUse" patternTransform="skewY(-30)">
                            <path d="M 60 0 L 0 0 0 35" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#iso-grid)" />
                </svg>
            </div>

            {/* Main 3D elements container */}
            <div className="absolute inset-0 flex items-center justify-center">
                {/* Stacked coin piles (replacing boxes) */}
                <motion.div
                    className="absolute left-[15%] top-[40%]"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Coin stack 1 */}
                        <div className="relative" style={{ transform: 'rotateX(60deg) rotateZ(45deg)' }}>
                            {[...Array(4)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="h-6 w-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 shadow-lg"
                                    style={{
                                        position: 'absolute',
                                        top: `-${i * 4}px`,
                                        zIndex: 10 - i,
                                        border: '2px solid rgba(245, 158, 11, 0.3)',
                                    }}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                                />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>

                {/* Second coin pile */}
                <motion.div
                    className="absolute left-[25%] top-[50%]"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        <div className="relative" style={{ transform: 'rotateX(60deg) rotateZ(45deg)' }}>
                            {[...Array(3)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="h-5 w-16 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-md"
                                    style={{
                                        position: 'absolute',
                                        top: `-${i * 3.5}px`,
                                        zIndex: 10 - i,
                                        border: '2px solid rgba(251, 191, 36, 0.3)',
                                    }}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
                                />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>

                {/* Floating individual coins */}
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{
                            left: `${15 + i * 10}%`,
                            top: `${20 + (i % 4) * 20}%`,
                        }}
                        initial={{ y: 0, rotateY: 0, opacity: 0 }}
                        animate={{
                            y: [0, -25 - i * 3, 0],
                            rotateY: [0, 180, 360],
                            opacity: [0, 1, 1, 1, 0],
                        }}
                        transition={{
                            duration: 4 + i * 0.3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: i * 0.3,
                        }}
                    >
                        <div
                            className="relative h-10 w-10 sm:h-12 sm:w-12"
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            {/* Coin face */}
                            <div
                                className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 shadow-xl"
                                style={{
                                    transform: 'translateZ(2px)',
                                    border: '2px solid rgba(251, 191, 36, 0.6)',
                                }}
                            >
                                <div className="flex h-full items-center justify-center text-lg font-bold text-amber-900">
                                    $
                                </div>
                            </div>
                            {/* Coin edge */}
                            <div
                                className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-600 to-yellow-700"
                                style={{ transform: 'translateZ(-2px)' }}
                            />
                        </div>
                    </motion.div>
                ))}

                {/* Isometric piggy bank/vault */}
                <motion.div
                    className="absolute right-[18%] top-[35%]"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                >
                    <motion.div
                        animate={{ y: [0, -12, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        <div style={{ transform: 'rotateX(60deg) rotateZ(-45deg)' }}>
                            {/* Vault/safe body */}
                            <div className="relative h-24 w-28 sm:h-32 sm:w-36">
                                {/* Front face */}
                                <div
                                    className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-2xl"
                                    style={{
                                        transform: 'translateZ(20px)',
                                        border: '3px solid rgba(99, 102, 241, 0.4)',
                                    }}
                                >
                                    <div className="flex h-full items-center justify-center">
                                        <div className="h-10 w-10 rounded-full border-4 border-indigo-300 bg-indigo-600 sm:h-12 sm:w-12">
                                            <div className="flex h-full items-center justify-center text-2xl text-indigo-200">
                                                $
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Top face */}
                                <div
                                    className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600"
                                    style={{
                                        transform: 'rotateX(90deg) translateZ(20px)',
                                        transformOrigin: 'top',
                                    }}
                                />
                                {/* Side face */}
                                <div
                                    className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-700 to-indigo-900"
                                    style={{
                                        transform: 'rotateY(90deg) translateZ(20px)',
                                        transformOrigin: 'right',
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Floating wallet/card */}
                <motion.div
                    className="absolute right-[10%] bottom-[25%]"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1 }}
                >
                    <motion.div
                        animate={{
                            y: [0, -15, 0],
                            rotateZ: [-5, 0, -5],
                        }}
                        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        <div
                            className="h-20 w-32 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 p-3 shadow-2xl sm:h-24 sm:w-40"
                            style={{
                                transform: 'rotateX(10deg) rotateY(-15deg)',
                                border: '2px solid rgba(147, 51, 234, 0.3)',
                            }}
                        >
                            <div className="flex h-full flex-col justify-between">
                                <div className="h-5 w-7 rounded bg-gradient-to-br from-yellow-300 to-amber-500" />
                                <div className="space-y-1.5">
                                    <div className="h-1.5 w-full rounded bg-purple-400/50" />
                                    <div className="h-1.5 w-2/3 rounded bg-purple-400/50" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Isometric chart display */}
                <motion.div
                    className="absolute left-[8%] bottom-[20%]"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                >
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                    >
                        <div
                            className="rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-800 sm:p-5"
                            style={{
                                transform: 'rotateX(10deg) rotateY(5deg)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                            }}
                        >
                            <div className="flex items-end gap-1.5 sm:gap-2">
                                {[50, 70, 90, 65].map((height, i) => (
                                    <motion.div
                                        key={i}
                                        className="w-4 rounded-t bg-gradient-to-t from-emerald-600 to-green-400 shadow-sm sm:w-5"
                                        style={{ height: `${height}px` }}
                                        initial={{ scaleY: 0 }}
                                        animate={{ scaleY: 1 }}
                                        transition={{
                                            duration: 0.8,
                                            delay: 1.4 + i * 0.15,
                                            ease: 'easeOut',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Subtle background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-indigo-500/5" />
            </div>

            {/* Soft gradient orbs for ambient lighting */}
            <motion.div
                className="absolute right-0 top-0 h-72 w-72 rounded-full bg-gradient-to-br from-amber-400/10 to-yellow-500/10 blur-3xl sm:h-96 sm:w-96"
                animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.2, 0.35, 0.2],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-400/10 to-purple-500/10 blur-3xl sm:h-96 sm:w-96"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.35, 0.2],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1,
                }}
            />
        </div>
    )
}
