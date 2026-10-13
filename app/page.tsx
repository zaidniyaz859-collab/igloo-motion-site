'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const mainRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [activeSocial, setActiveSocial] = useState<'penguin' | 'twitter' | 'medium'>('penguin');

  // Web Audio Synth for Ambient Sound Effect
  const toggleSound = () => {
    setSoundOn((prev) => !prev);
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !mainRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();

    // Fog & Atmosphere
    const fogColor = new THREE.Color(0xBDC5D0);
    scene.fog = new THREE.FogExp2(fogColor, 0.04);
    scene.background = fogColor;

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 3, 11);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(6, 12, 8);
    scene.add(dirLight);

    // Wireframe Ground Terrain
    const terrainGeo = new THREE.PlaneGeometry(60, 60, 40, 40);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const dist = Math.sqrt(vx * vx + vz * vz);
      const noise = Math.sin(vx * 0.3) * Math.cos(vz * 0.3) * 1.2;
      posAttr.setY(i, noise - Math.pow(dist * 0.08, 1.5));
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.95,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.y = -1.2;
    scene.add(terrainMesh);

    const terrainWireMat = new THREE.MeshBasicMaterial({
      color: 0x334155,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const terrainWire = new THREE.Mesh(terrainGeo, terrainWireMat);
    terrainWire.position.y = -1.18;
    scene.add(terrainWire);

    // Procedural 3D Igloo Blocks
    const iglooGroup = new THREE.Group();
    const blocks: Array<{
      mesh: THREE.Mesh;
      homePos: THREE.Vector3;
      explodeDir: THREE.Vector3;
      rotSpeed: THREE.Vector3;
    }> = [];

    const blockMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.35,
      metalness: 0.15,
    });

    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.5,
    });

    const radius = 3.2;
    const rings = 8;
    for (let r = 0; r < rings; r++) {
      const phi = (r / rings) * (Math.PI * 0.42);
      const ringRadius = radius * Math.cos(phi);
      const y = radius * Math.sin(phi);
      const count = Math.floor(ringRadius * 6.5) + 4;

      for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2;
        const x = ringRadius * Math.cos(theta);
        const z = ringRadius * Math.sin(theta);

        const boxGeo = new THREE.BoxGeometry(0.75, 0.42, 0.55);
        const mesh = new THREE.Mesh(boxGeo, blockMat);

        const edgesGeo = new THREE.EdgesGeometry(boxGeo);
        const line = new THREE.LineSegments(edgesGeo, edgeMat);
        mesh.add(line);

        mesh.position.set(x, y, z);
        mesh.lookAt(0, y, 0);

        const homePos = mesh.position.clone();
        const explodeDir = homePos.clone().normalize().add(new THREE.Vector3(0, 0.4, 0));

        iglooGroup.add(mesh);
        blocks.push({
          mesh,
          homePos,
          explodeDir,
          rotSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 0.03,
            (Math.random() - 0.5) * 0.03,
            (Math.random() - 0.5) * 0.03
          ),
        });
      }
    }
    scene.add(iglooGroup);

    // Point Cloud Particle System (Mascot, X Logo, M Logo)
    const pCount = 2800;
    const particleGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    const targetPenguin = new Float32Array(pCount * 3);
    const targetX = new Float32Array(pCount * 3);
    const targetM = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      // Ambient Initial Snow Field
      pPositions[i * 3] = (Math.random() - 0.5) * 30;
      pPositions[i * 3 + 1] = Math.random() * 14 - 1;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;

      // Target 1: Pudgy Mascot Character Shape
      const py = (Math.random() - 0.5) * 3.2;
      const pr = (1.3 - Math.abs(py * 0.25)) * Math.random();
      const pTheta = Math.random() * Math.PI * 2;
      targetPenguin[i * 3] = pr * Math.cos(pTheta);
      targetPenguin[i * 3 + 1] = py + 1.2;
      targetPenguin[i * 3 + 2] = pr * Math.sin(pTheta);

      // Target 2: 'X' Logo
      const isDiagonal1 = Math.random() > 0.5;
      const t = (Math.random() - 0.5) * 3.0;
      const width = (Math.random() - 0.5) * 0.4;
      targetX[i * 3] = (isDiagonal1 ? t : -t) + width;
      targetX[i * 3 + 1] = t + 1.2;
      targetX[i * 3 + 2] = width;

      // Target 3: 'M' Logo
      const mx = (i / pCount) * 3.6 - 1.8;
      let my = 0;
      if (mx < -0.9) my = (mx + 1.8) * 2;
      else if (mx < 0) my = -mx * 2 + 1.8;
      else if (mx < 0.9) my = mx * 2 + 1.8;
      else my = (-mx + 1.8) * 2;
      targetM[i * 3] = mx;
      targetM[i * 3 + 1] = my + 0.2;
      targetM[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x0f172a,
      size: 0.05,
      transparent: true,
      opacity: 0.75,
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Mouse Movement Tracking
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // GSAP ScrollTrigger
    const state = { scrollProgress: 0 };
    const ctx = gsap.context(() => {
      gsap.to(state, {
        scrollProgress: 1,
        scrollTrigger: {
          trigger: mainRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
        },
        onUpdate: () => {
          const prog = state.scrollProgress;

          // Disassemble Igloo Blocks
          blocks.forEach((b) => {
            b.mesh.position.x = b.homePos.x + b.explodeDir.x * prog * 12;
            b.mesh.position.y = b.homePos.y + b.explodeDir.y * prog * 14;
            b.mesh.position.z = b.homePos.z + b.explodeDir.z * prog * 12;
            b.mesh.rotation.x += b.rotSpeed.x * prog * 4;
            b.mesh.rotation.y += b.rotSpeed.y * prog * 4;
          });

          camera.position.z = 11 - prog * 4;
          camera.position.y = 3 - prog * 1;
        },
      });
    }, mainRef);

    // Render Animation & Particle Morphing Loop
    let animationFrameId: number;
    const animate = () => {
      iglooGroup.rotation.y += 0.003 + mouseX * 0.01;
      particleSystem.rotation.y += 0.002;

      // Particle Position Interpolation depending on Active Social Switch
      const currentPos = particleGeo.attributes.position.array as Float32Array;
      let activeTarget = targetPenguin;
      if (activeSocial === 'twitter') activeTarget = targetX;
      if (activeSocial === 'medium') activeTarget = targetM;

      for (let i = 0; i < pCount * 3; i++) {
        currentPos[i] += (activeTarget[i] - currentPos[i]) * 0.08;
      }
      particleGeo.attributes.position.needsUpdate = true;

      camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
      camera.lookAt(0, 1, 0);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      ctx.revert();
      renderer.dispose();
    };
  }, [activeSocial]);

  return (
    <div ref={mainRef} style={{ width: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
      />

      {/* Top Left Branding HUD */}
      <div style={{ position: 'fixed', top: '32px', left: '32px', zIndex: 10 }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '0.15em', margin: 0, color: '#0F172A' }}>
          IGLOO
        </h1>
        <p style={{ fontSize: '10px', opacity: 0.65, marginTop: '4px', lineHeight: 1.5 }}>
          // Copyright © 2026 Igloo, Inc.<br />
          All Rights Reserved.
        </p>
      </div>

      {/* Top Right Manifesto HUD */}
      <div
        style={{
          position: 'fixed',
          top: '32px',
          right: '32px',
          zIndex: 10,
          maxWidth: '280px',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', marginBottom: '8px', color: '#334155' }}>
          ///// Manifesto
        </div>
        <p style={{ fontSize: '11px', lineHeight: '1.6', opacity: 0.85 }}>
          Our mission is to build the next generation of consumer brands at the intersection of community, AI, and crypto.
        </p>
      </div>

      {/* Bottom Left Sound & Scroll Control */}
      <div style={{ position: 'fixed', bottom: '32px', left: '32px', zIndex: 10 }}>
        <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px', color: '#334155' }}>
          • Scroll down to discover.
        </p>
        <button
          onClick={toggleSound}
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            border: '1px solid rgba(15, 23, 42, 0.2)',
            padding: '6px 12px',
            fontSize: '10px',
            fontFamily: 'inherit',
            cursor: 'pointer',
            borderRadius: '2px',
            backdropFilter: 'blur(8px)',
          }}
        >
          {soundOn ? '🔊 Sound: ON' : '🔈 Sound: OFF'}
        </button>
      </div>

      {/* Bottom Particle Morph Switcher HUD */}
      <div
        style={{
          position: 'fixed',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.5)',
          padding: '6px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {(['penguin', 'twitter', 'medium'] as const).map((platform) => (
          <button
            key={platform}
            onClick={() => setActiveSocial(platform)}
            style={{
              background: activeSocial === platform ? '#0F172A' : 'transparent',
              color: activeSocial === platform ? '#FFF' : '#0F172A',
              border: 'none',
              padding: '6px 16px',
              fontSize: '10px',
              fontFamily: 'inherit',
              borderRadius: '14px',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
          >
            {platform === 'penguin' && 'Mascot'}
            {platform === 'twitter' && 'X / Twitter'}
            {platform === 'medium' && 'Medium'}
          </button>
        ))}
      </div>

      {/* Scroll Trigger Height Spacer */}
      <div style={{ height: '300vh', pointerEvents: 'none' }} />
    </div>
  );
}
