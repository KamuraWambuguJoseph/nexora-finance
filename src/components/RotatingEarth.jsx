import { useEffect, useRef } from 'react'

export default function RotatingEarth({ className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // Points on a sphere (fibonacci spiral)
    const N = 900
    const pts = []
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const theta = golden * i
      pts.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r })
    }

    let angle = 0
    const cx = () => canvas.clientWidth / 2
    const cy = () => canvas.clientHeight / 2
    const R = () => Math.min(canvas.clientWidth, canvas.clientHeight) * 0.42

    const draw = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)
      const radius = R()
      const cX = cx()
      const cY = cy()
      angle += 0.0035

      // subtle glow
      const g = ctx.createRadialGradient(cX, cY, radius * 0.6, cX, cY, radius * 1.3)
      g.addColorStop(0, 'rgba(16,185,129,0.08)')
      g.addColorStop(1, 'rgba(16,185,129,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      // outline
      ctx.beginPath()
      ctx.arc(cX, cY, radius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(59,130,246,0.18)'
      ctx.lineWidth = 1
      ctx.stroke()

      // points
      for (const p of pts) {
        const x = p.x * Math.cos(angle) - p.z * Math.sin(angle)
        const z = p.x * Math.sin(angle) + p.z * Math.cos(angle)
        const y = p.y
        // perspective
        const scale = 1 / (1 + z * 0.35)
        const sx = cX + x * radius * scale
        const sy = cY + y * radius * scale
        const alpha = (z + 1) / 2
        const size = 1.2 + alpha * 1.4
        ctx.beginPath()
        ctx.arc(sx, sy, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(16,185,129,${0.25 + alpha * 0.55})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])
  return <canvas ref={ref} className={className} />
}