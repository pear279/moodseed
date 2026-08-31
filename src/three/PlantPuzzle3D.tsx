import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Props {
  image: string
  positions: number[]
  cols?: number
  rows?: number
  flip?: boolean
  className?: string
}

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// 锁定态：灰度 + 压暗（破败感）；解锁态：恢复彩色
const FRAG = /* glsl */ `
uniform sampler2D uTex;
uniform float uReveal;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(uTex, vUv);
  float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  vec3 gray = vec3(l) * 0.58 + vec3(0.03);
  vec3 col = mix(gray, c.rgb, smoothstep(0.0, 1.0, uReveal));
  gl_FragColor = vec4(col, 1.0);
}
`

interface Piece {
  mat: THREE.ShaderMaterial
  target: number
}

interface State {
  pieces: Piece[]
  group: THREE.Group
  flipStart: number | null
  pointer: { x: number; y: number }
}

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/** 重映射 PlaneGeometry 的 UV 到 (u0..u1, v0..v1) 子矩形 */
function remapUv(geo: THREE.PlaneGeometry, u0: number, u1: number, v0: number, v1: number) {
  const uv = geo.attributes.uv as THREE.BufferAttribute
  // 顶点顺序：左下(0,0)、右下(1,0)、右上(1,1)、左上(0,1)
  const us = [u0, u1, u1, u0]
  const vs = [v0, v0, v1, v1]
  for (let i = 0; i < 4; i++) uv.setXY(i, us[i], vs[i])
  uv.needsUpdate = true
}

export function PlantPuzzle3D({ image, positions, cols = 6, rows = 6, flip = false, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<State | null>(null)
  const disposeRef = useRef<(() => void) | null>(null)
  const positionsRef = useRef<number[]>(positions)

  const applyPositions = (pos: number[]) => {
    const s = stateRef.current
    if (!s) return
    s.pieces.forEach((p, i) => {
      p.target = pos.includes(i) ? 1 : 0
    })
  }

  // —— 初始化场景 ——
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50)
    camera.position.z = 3

    const group = new THREE.Group()
    scene.add(group)

    const state: State = {
      pieces: [],
      group,
      flipStart: null,
      pointer: { x: 0, y: 0 },
    }
    stateRef.current = state

    let texture: THREE.Texture | null = null

    // 纹理加载完成后构建 36 块（6×6 正方形）
    new THREE.TextureLoader().load(
      image,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        tex.generateMipmaps = false
        texture = tex

        const imgW = tex.image.width || 1
        const imgH = tex.image.height || 1
        const imgAspect = imgW / imgH
        // 正方形 1:1 板面
        const boardH = 2.4
        const boardW = boardH
        const pieceW = boardW / cols
        const pieceH = boardH / rows

        // cover 裁切：把任意比例的插画填满正方形，不拉伸不变形
        let uMin = 0
        let uMax = 1
        let vMin = 0
        let vMax = 1
        if (imgAspect >= 1) {
          const span = 1 / imgAspect
          uMin = (1 - span) / 2
          uMax = (1 + span) / 2
        } else {
          const span = imgAspect
          vMin = (1 - span) / 2
          vMax = (1 + span) / 2
        }

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const u0 = uMin + (col / cols) * (uMax - uMin)
            const u1 = uMin + ((col + 1) / cols) * (uMax - uMin)
            const vTop = vMax - (row / rows) * (vMax - vMin)
            const vBottom = vMax - ((row + 1) / rows) * (vMax - vMin)

            const geo = new THREE.PlaneGeometry(pieceW, pieceH)
            remapUv(geo, u0, u1, vBottom, vTop)

            const mat = new THREE.ShaderMaterial({
              vertexShader: VERT,
              fragmentShader: FRAG,
              uniforms: {
                uTex: { value: tex },
                uReveal: { value: 0 },
              },
              side: THREE.DoubleSide,
            })
            const mesh = new THREE.Mesh(geo, mat)
            mesh.position.x = -boardW / 2 + (col + 0.5) * pieceW
            mesh.position.y = boardH / 2 - (row + 0.5) * pieceH
            mesh.scale.setScalar(0.97) // 留出拼图块间隙
            group.add(mesh)

            state.pieces.push({ mat, target: 0 })
          }
        }

        // 让相机距离适配板面高度
        camera.position.z =
          boardH / 2 / (0.92 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))

        // 碎片构建完成后，套用当前已解锁位置
        applyPositions(positionsRef.current)
      },
      undefined,
      () => {
        /* 纹理加载失败时保持空场景 */
      },
    )

    // 指针倾斜
    const onPointer = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      state.pointer.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      state.pointer.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    }
    const onPointerLeave = () => {
      state.pointer.x = 0
      state.pointer.y = 0
    }
    container.addEventListener('pointermove', onPointer)
    container.addEventListener('pointerleave', onPointerLeave)

    // 尺寸自适应
    const resize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w > 0 && h > 0) {
        renderer.setSize(w, h)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    // 渲染循环
    let raf = 0
    const loop = () => {
      // 揭示动画（灰 → 彩）
      for (const p of state.pieces) {
        const m = p.mat.uniforms.uReveal
        m.value += (p.target - m.value) * 0.08
        if (Math.abs(p.target - m.value) < 0.002) m.value = p.target
      }
      // 翻牌（绕 Y 一圈）优先于倾斜的 Y 轴
      if (state.flipStart != null) {
        const t = (performance.now() - state.flipStart) / 1400
        if (t >= 1) {
          group.rotation.y = 0
          state.flipStart = null
        } else {
          group.rotation.y = easeInOutCubic(t) * Math.PI * 2
        }
      } else {
        group.rotation.y += (state.pointer.x * 0.24 - group.rotation.y) * 0.1
      }
      group.rotation.x += (-state.pointer.y * 0.18 - group.rotation.x) * 0.1

      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    disposeRef.current = () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      container.removeEventListener('pointermove', onPointer)
      container.removeEventListener('pointerleave', onPointerLeave)
      state.pieces.forEach((p) => {
        p.mat.dispose()
      })
      texture?.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }

    return () => disposeRef.current?.()
  }, [image, cols, rows])

  // —— 位置变化 → 更新揭示目标 ——
  useEffect(() => {
    positionsRef.current = positions
    applyPositions(positions)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions])

  // —— 触发翻牌 ——
  useEffect(() => {
    if (flip) {
      const s = stateRef.current
      if (s && s.flipStart == null) s.flipStart = performance.now()
    }
  }, [flip])

  return <div ref={containerRef} className={className} style={{ touchAction: 'none' }} />
}
