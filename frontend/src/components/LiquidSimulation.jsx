import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function LiquidSimulation({ text = 'PitchPulse', imagePath = '', className = '' }) {
  const containerRef = useRef(null)
  const canvas2dRef = useRef(null)
  const requestRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // --- Create 2D Canvas for Ripple Displacement ---
    const canvas2d = document.createElement('canvas')
    canvas2d.width = 128
    canvas2d.height = 128
    canvas2dRef.current = canvas2d
    const ctx2d = canvas2d.getContext('2d')
    
    // Ripple State
    let ripples = []
    
    // Draw mouse move ripples on 2D canvas
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = 1.0 - (e.clientY - rect.top) / rect.height
      ripples.push({ x, y, size: 2, alpha: 1.0 })
    }
    
    container.addEventListener('mousemove', handleMouseMove)

    // --- Setup Three.js WebGL Renderer ---
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Create textures
    const rippleTexture = new THREE.CanvasTexture(canvas2d)

    // Shader Material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uRippleTex: { value: rippleTexture },
        uResolution: { value: new THREE.Vector2(width, height) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform sampler2D uRippleTex;
        uniform vec2 uResolution;
        varying vec2 vUv;
        
        void main() {
          // Read displacement from the red channel of the ripple texture
          vec4 ripple = texture2D(uRippleTex, vUv);
          
          // Calculate offset using distortion direction
          vec2 offset = vec2(
            sin(ripple.r * 12.0 + uTime * 2.5),
            cos(ripple.r * 12.0 + uTime * 2.5)
          ) * ripple.r * 0.08; // High offset for high contrast

          vec2 uv = vUv + offset;

          // Generate dynamic neon plasma background
          float r = sin(uv.x * 4.0 + uTime * 0.6) * 0.5 + 0.5;
          float g = cos(uv.y * 3.0 - uTime * 0.4) * 0.5 + 0.5;
          float b = sin((uv.x + uv.y) * 5.0 + uTime * 0.8) * 0.5 + 0.5;
          
          // Primary color palette (PitchPulse dark accent orange mixed with rich indigo)
          vec3 baseColor = mix(vec3(0.04, 0.04, 0.05), vec3(0.99, 0.42, 0.17), r * 0.35);
          baseColor = mix(baseColor, vec3(0.18, 0.08, 0.32), b * 0.35);
          
          // Create high-contrast neon grid lines
          float gridX = step(0.975, fract(uv.x * 20.0));
          float gridY = step(0.975, fract(uv.y * 20.0));
          float grid = max(gridX, gridY);
          
          // Grid color
          vec3 gridColor = vec3(0.99, 0.42, 0.17) * 0.55; 
          vec3 finalColor = mix(baseColor, gridColor, grid);
          
          // Add highlight reflection on ripples
          finalColor += vec3(ripple.r) * 0.35;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    })

    const geometry = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // Animation loop
    let clock = new THREE.Clock()

    const animate = () => {
      const time = clock.getElapsedTime()
      
      // Update 2D ripple canvas
      ctx2d.fillStyle = 'black'
      ctx2d.fillRect(0, 0, 128, 128)
      
      // Update ripples
      ripples.forEach((rp, idx) => {
        rp.size += 0.85
        rp.alpha -= 0.02
        if (rp.alpha <= 0) {
          ripples.splice(idx, 1)
          return
        }

        // Draw radial ripple
        const grad = ctx2d.createRadialGradient(
          rp.x * 128, rp.y * 128, 0,
          rp.x * 128, rp.y * 128, rp.size
        )
        grad.addColorStop(0, `rgba(255, 255, 255, ${rp.alpha})`)
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx2d.fillStyle = grad
        ctx2d.beginPath()
        ctx2d.arc(rp.x * 128, rp.y * 128, rp.size, 0, Math.PI * 2)
        ctx2d.fill()
      })

      rippleTexture.needsUpdate = true
      material.uniforms.uTime.value = time

      renderer.render(scene, camera)
      requestRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      material.uniforms.uResolution.value.set(w, h)
    }
    
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      cancelAnimationFrame(requestRef.current)
      container.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      geometry.dispose()
      material.dispose()
      rippleTexture.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div ref={containerRef} className={`relative overflow-hidden w-full h-full ${className}`}>
      {text && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 px-4">
          <h2 className="text-3xl sm:text-5xl md:text-7xl font-display font-extrabold text-white tracking-tight text-center drop-shadow-lg selection:bg-accent/30">
            {text}
          </h2>
        </div>
      )}
    </div>
  )
}
