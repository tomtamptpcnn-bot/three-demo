'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Line, OrbitControls, Sparkles, Stars } from '@react-three/drei';
import { useRef, useState } from 'react';
import * as THREE from 'three';

type PlanetInfo = {
  name: string;
  orbit: number;
  size: number;
  color: string;
  speed: number;
  angle: number;
  ring?: boolean;
};

const planets: PlanetInfo[] = [
  { name: 'Mercury', orbit: 4.2, size: 0.25, color: '#a89f96', speed: 1.05, angle: 0.4 },
  { name: 'Venus', orbit: 5.6, size: 0.42, color: '#d69c60', speed: 0.78, angle: 2.5 },
  { name: 'Earth', orbit: 7.25, size: 0.47, color: '#2e75d4', speed: 0.61, angle: 5.2 },
  { name: 'Mars', orbit: 8.8, size: 0.34, color: '#c76645', speed: 0.48, angle: 3.7 },
  { name: 'Jupiter', orbit: 10.8, size: 1.02, color: '#d6a477', speed: 0.27, angle: 0.95 },
  { name: 'Saturn', orbit: 12.9, size: 0.86, color: '#d6bc81', speed: 0.2, angle: 2.9, ring: true },
  { name: 'Uranus', orbit: 14.7, size: 0.62, color: '#79c4d0', speed: 0.15, angle: 4.5, ring: true },
  { name: 'Neptune', orbit: 16.3, size: 0.61, color: '#2f5fc4', speed: 0.11, angle: 5.7 },
];

function OrbitPath({ radius }: { radius: number }) {
  const points = Array.from({ length: 97 }, (_, i) => {
    const angle = (i / 96) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  });
  return <Line points={points} color="#dbeafe" transparent opacity={0.28} lineWidth={0.65} />;
}

function Sun() {
  const sun = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (sun.current) sun.current.rotation.y = t * 0.08;
    if (halo.current) {
      const scale = 1 + Math.sin(t * 1.7) * 0.035;
      halo.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      <mesh ref={halo} scale={1.42}>
        <sphereGeometry args={[2.5, 48, 48]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.12} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={sun}>
        <sphereGeometry args={[2.5, 48, 48]} />
        <meshStandardMaterial color="#ffba1c" emissive="#ff6a00" emissiveIntensity={2.4} roughness={0.72} />
      </mesh>
      <pointLight color="#ff9518" intensity={260} distance={28} decay={1.7} />
    </group>
  );
}

function Planet({ info }: { info: PlanetInfo }) {
  const planet = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const angle = info.angle + clock.getElapsedTime() * info.speed * 0.22;
    if (planet.current) {
      planet.current.position.set(Math.cos(angle) * info.orbit, 0, Math.sin(angle) * info.orbit);
      planet.current.rotation.y = clock.getElapsedTime() * 0.45;
    }
  });

  return (
    <group ref={planet}>
      <mesh>
        <sphereGeometry args={[info.size, 28, 28]} />
        <meshStandardMaterial color={info.color} roughness={0.7} metalness={0.05} />
      </mesh>
      {info.name === 'Earth' && <mesh position={[info.size * 0.95, 0.05, 0]}><sphereGeometry args={[0.12, 14, 14]} /><meshStandardMaterial color="#d7d1bd" /></mesh>}
      {info.ring && <mesh rotation={[Math.PI / 2.7, 0, 0.25]}><ringGeometry args={[info.size * 1.35, info.size * 2.05, 64]} /><meshBasicMaterial color={info.name === 'Saturn' ? '#eed8a7' : '#b6edf2'} transparent opacity={0.72} side={THREE.DoubleSide} /></mesh>}
    </group>
  );
}

function CameraMonitor({ onInsideSun }: { onInsideSun: (inside: boolean) => void }) {
  const wasInside = useRef(false);

  useFrame(({ camera }) => {
    const inside = camera.position.length() < 2.55;
    if (inside !== wasInside.current) {
      wasInside.current = inside;
      onInsideSun(inside);
    }
  });

  return null;
}

function CameraPilot({ destination, onArrive }: { destination: 'inside' | 'wide' | null; onArrive: () => void }) {
  useFrame(({ camera }) => {
    if (!destination) return;

    const target = destination === 'inside'
      ? new THREE.Vector3(0, 0.25, 1.05)
      : new THREE.Vector3(0, 11, 27);

    camera.position.lerp(target, 0.055);
    camera.lookAt(0, 0, 0);

    if (camera.position.distanceTo(target) < 0.08) onArrive();
  });

  return null;
}

function SolarSystem({ onInsideSun, destination, onArrive }: { onInsideSun: (inside: boolean) => void; destination: 'inside' | 'wide' | null; onArrive: () => void }) {
  return (
    <>
      <color attach="background" args={['#02030a']} />
      <fog attach="fog" args={['#02030a', 24, 52]} />
      <ambientLight intensity={0.08} />
      <Stars radius={70} depth={45} count={5000} factor={2.4} saturation={0.2} fade speed={0.25} />
      <Sparkles count={180} scale={[38, 10, 38]} size={1.2} speed={0.08} color="#fef3c7" />
      <group rotation={[0.19, -0.32, 0]}>
        {planets.map((planet) => <OrbitPath key={planet.name} radius={planet.orbit} />)}
        <Sun />
        {planets.map((planet) => <Planet key={planet.name} info={planet} />)}
      </group>
      <CameraMonitor onInsideSun={onInsideSun} />
      <CameraPilot destination={destination} onArrive={onArrive} />
      <OrbitControls
        enabled={!destination}
        enablePan={false}
        minDistance={0.65}
        maxDistance={42}
        minPolarAngle={0.22}
        maxPolarAngle={Math.PI - 0.22}
        rotateSpeed={0.42}
        zoomSpeed={0.85}
        dampingFactor={0.07}
        enableDamping
      />
    </>
  );
}

export default function FuturisticHero() {
  const [insideSun, setInsideSun] = useState(false);
  const [destination, setDestination] = useState<'inside' | 'wide' | null>(null);

  return (
    <section className="relative h-screen min-h-[620px] w-full overflow-hidden bg-[#02030a]">
      <Canvas className="absolute inset-0 touch-none" camera={{ position: [0, 11, 27], fov: 47 }} dpr={[1, 2]}>
        <SolarSystem onInsideSun={setInsideSun} destination={destination} onArrive={() => setDestination(null)} />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/80 via-black/25 to-transparent px-6 py-8 text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-200/85">Interactive universe</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">ระบบสุริยจักรวาล</h1>
      </div>
      <div className="pointer-events-none absolute bottom-7 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-center text-xs font-medium tracking-wide text-white/85 backdrop-blur-sm">
        เลื่อนล้อเมาส์เพื่อซูมเข้า–ออก • ลากเพื่อหมุนดูรอบ ๆ
      </div>
      <button
        type="button"
        disabled={destination !== null}
        onClick={() => setDestination(insideSun ? 'wide' : 'inside')}
        className="absolute bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-full border border-amber-200/70 bg-amber-400 px-5 py-3 text-sm font-bold text-black shadow-[0_0_24px_rgba(251,191,36,0.45)] transition hover:scale-105 hover:bg-amber-300 disabled:cursor-wait disabled:opacity-70"
      >
        {destination ? 'กำลังซูม...' : insideSun ? 'ซูมออกให้สุด' : 'ซูมเข้าไปดูข้างในดวงอาทิตย์'}
      </button>
      {insideSun && <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-orange-500/10 px-6 text-center"><p className="animate-pulse text-4xl font-black text-white drop-shadow-[0_0_28px_rgba(255,125,0,1)] sm:text-7xl">ไม่มีอะไรจ้า</p></div>}
    </section>
  );
}
