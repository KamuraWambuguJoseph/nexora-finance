import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function AnimatedLanding({ onComplete }) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      onComplete()
    }, 5000)
    return () => clearTimeout(timer)
  }, [onComplete])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  }

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.5, rotateZ: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      rotateZ: 0,
      transition: {
        duration: 1,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.6,
      },
    },
  }

  const textVariants = {
    hidden: { opacity: 0, letterSpacing: '0.5em' },
    visible: {
      opacity: 1,
      letterSpacing: '0.05em',
      transition: {
        duration: 1.2,
        ease: 'easeOut',
      },
    },
  }

  const glowVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: [0, 0.5, 0.3, 0.5, 0.3, 0],
      transition: {
        duration: 4,
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
      },
    },
  }

  const particleVariants = {
    hidden: { opacity: 0, y: 0 },
    visible: (i) => ({
      opacity: [0, 0.6, 0],
      y: [0, -100, -200],
      transition: {
        duration: 3,
        ease: 'easeOut',
        delay: i * 0.15,
        repeat: Infinity,
        repeatDelay: 2,
      },
    }),
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isLoading ? 1 : 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      onAnimationComplete={() => !isLoading && onComplete()}
      className="fixed inset-0 z-50 bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center overflow-hidden"
    >
      {/* Animated Background Orbs */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-20 left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -50, 50, 0],
            y: [0, 50, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Particles */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={particleVariants}
            initial="hidden"
            animate="visible"
            className="absolute left-1/2 bottom-0 w-1 h-1 bg-emerald-400 rounded-full"
            style={{
              left: `${20 + i * 12}%`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center"
      >
        {/* Logo Container with Glow */}
        <motion.div
          variants={glowVariants}
          initial="hidden"
          animate="visible"
          className="absolute inset-0 -z-10"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/30 to-blue-500/30 blur-3xl" />
        </motion.div>

        {/* Animated Logo */}
        <motion.div
          variants={logoVariants}
          className="mb-8 inline-block"
        >
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Glass Effect Background */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(16, 185, 129, 0.1)',
                  '0 0 40px rgba(16, 185, 129, 0.3)',
                  '0 0 20px rgba(16, 185, 129, 0.1)',
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 backdrop-blur-md border border-emerald-500/30"
            />

            {/* N Letter */}
            <motion.span
              animate={{
                textShadow: [
                  '0 0 10px rgba(16, 185, 129, 0.3)',
                  '0 0 20px rgba(16, 185, 129, 0.6)',
                  '0 0 10px rgba(16, 185, 129, 0.3)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="relative z-10 text-5xl font-black bg-gradient-to-r from-blue-700 to-cyan-600 dark:from-emerald-400 dark:to-blue-500 bg-clip-text text-transparent"
            >
              N
            </motion.span>
          </div>
        </motion.div>

        {/* Brand Name with Letter Animation */}
        <motion.h1
          variants={textVariants}
          className="text-6xl md:text-7xl font-black mb-4 bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-700 dark:from-emerald-400 dark:via-emerald-300 dark:to-blue-500 bg-clip-text text-transparent"
        >
          NEXORA
        </motion.h1>

        {/* Tagline */}
        <motion.p
          variants={itemVariants}
          className="text-slate-300 text-lg tracking-widest"
        >
          Premium Crypto Investment Platform
        </motion.p>

        {/* Animated Underline */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100px' }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="h-1 bg-gradient-to-r from-emerald-500 to-blue-500 mx-auto mt-6 rounded-full"
        />
      </motion.div>

      {/* Loading Indicator */}
      <motion.div
        className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ scaleY: [0.5, 1, 0.5] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
            }}
            className="w-1 h-8 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-full"
          />
        ))}
      </motion.div>

      {/* Lighting Effect Lines */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lightBeam1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0)" />
            <stop offset="50%" stopColor="rgba(16, 185, 129, 0.2)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
          </linearGradient>
        </defs>
        <motion.line
          x1="0"
          y1="0"
          x2="100%"
          y2="100%"
          stroke="url(#lightBeam1)"
          strokeWidth="2"
          animate={{
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: 1,
          }}
        />
        <motion.line
          x1="100%"
          y1="0"
          x2="0"
          y2="100%"
          stroke="url(#lightBeam1)"
          stroke Width="2"
          animate={{
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: 2,
          }}
        />
      </svg>
    </motion.div>
  )
}
