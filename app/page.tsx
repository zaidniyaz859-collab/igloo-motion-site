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
  const [activeSocial, setActiveSocial] = useState<'twitter' | 'linkedin' | 'medium'>('twitter');

  useEffect(() => {
    if (!canvasRef.current || !mainRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();

    // Fog & Atmosphere
    const fogColor = new THREE.Color(0xBDC5D0);
    scene.fog = new THREE.FogExp2(fogColor, 0.045);
    scene.background = fogColor;

    const camera = new THREE.PerspectiveCamera(
      55,
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(5, 12, 7);
    scene.add(dirLight);

    // Wireframe Ground Terrain
    const terrainGeo = new THREE.PlaneGeometry(60, 60, 35, 35);
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
      roughness: 0.9,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.y = -1.2;
    scene.add(terrainMesh);

    const terrainWireMat = new THREE.MeshBasicMaterial({
      color: 0x475569,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
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
      roughness: 0.4,
      metalness: 0.1,
    });

    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.4,
    });

    const radius = 3.2;
    const rings = 7;
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
        const explodeDir = homePos.clone().normalize().add(new THREE.Vector3(0, 0.5, 0));

        iglooGroup.add(mesh);
        blocks.push({
          mesh,
          homePos,
          explodeDir,
          rotSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02
          ),
        });
      }
    }
    scene.add(iglooGroup);

    // Point Cloud Particle Morph System
    const pCount = 2000;
    const particleGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    const pTargetSphere = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 25;
      pPositions[i * 3 + 1] = Math.random() * 12 - 1;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 25;

      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 2.0;
      pTargetSphere[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pTargetSphere[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 1.2;
      pTargetSphere[i * 3 + 2] = r * Math.cos(phi);
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x0f172a,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
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

    // GSAP ScrollTrigger Explode Timeline
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

          blocks.forEach((b) => {
            b.mesh.position.x = b.homePos.x + b.explodeDir.x * prog * 10;
            b.mesh.position.y = b.homePos.y + b.explodeDir.y * prog * 12;
            b.mesh.position.z = b.homePos.z + b.explodeDir.z * prog * 10;
            b.mesh.rotation.x += b.rotSpeed.x * prog * 4;
            b.mesh.rotation.y += b.rotSpeed.y * prog * 4;
          });

          const currentPos = particleGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < pCount * 3; i++) {
            currentPos[i] += (pTargetSphere[i] - currentPos[i]) * 0.05 * prog;
          }
          particleGeo.attributes.position.needsUpdate = true;

          camera.position.z = 11 - prog * 4;
          camera.position.y = 3 - prog * 1;
        },
      });
    }, mainRef);

    // Render Loop
    let animationFrameId: number;
    const animate = () => {
      iglooGroup.rotation.y += 0.003 + mouseX * 0.01;
      particleSystem.rotation.y += 0.002;

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
  }, []);

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

      {/* Top Left Branding */}
      <div style={{ position: 'fixed', top: '32px', left: '32px', zIndex: 10 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '0.15em', margin: 0 }}>
          IGLOO
        </h1>
        <p style={{ fontSize: '10px', opacity: 0.65, marginTop: '4px' }}>
          // Copyright © 2026 Igloo, Inc. All Rights Reserved.
        </p>
      </div>

      {/* Top Right Manifesto */}
      <div
        style={{
          position: 'fixed',
          top: '32px',
          right: '32px',
          zIndex: 10,
          maxWidth: '280px',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', marginBottom: '8px' }}>
          ///// Manifesto
        </div>
        <p style={{ fontSize: '11px', lineHeight: '1.6', opacity: 0.8 }}>
          Our mission is to build the next generation of consumer brands at the intersection of community, AI, and crypto.
        </p>
      </div>

      {/* Bottom Controls */}
      <div style={{ position: 'fixed', bottom: '32px', left: '32px', zIndex: 10 }}>
        <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
          • Scroll down to discover
        </p>
        <button
          onClick={() => setSoundOn(!soundOn)}
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            border: '1px solid rgba(15, 23, 42, 0.2)',
            padding: '6px 12px',
            fontSize: '10px',
            fontFamily: 'inherit',
            cursor: 'pointer',
            borderRadius: '2px',
          }}
        >
          {soundOn ? '🔊 Sound: ON' : '🔈 Sound: OFF'}
        </button>
      </div>

      {/* Bottom Social Switcher */}
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
        }}
      >
        {(['twitter', 'linkedin', 'medium'] as const).map((platform) => (
          <button
            key={platform}
            onClick={() => setActiveSocial(platform)}
            style={{
              background: activeSocial === platform ? '#0F172A' : 'transparent',
              color: activeSocial === platform ? '#FFF' : '#0F172A',
              border: 'none',
              padding: '6px 14px',
              fontSize: '10px',
              fontFamily: 'inherit',
              borderRadius: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {platform === 'twitter' && 'X / Twitter'}
            {platform === 'linkedin' && 'LinkedIn'}
            {platform === 'medium' && 'Medium'}
          </button>
        ))}
      </div>

      {/* Scroll Trigger Spacer */}
      <div style={{ height: '300vh', pointerEvents: 'none' }} />
    </div>
  );
}
