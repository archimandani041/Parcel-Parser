import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Hero3DParcel({ className = '', onMouseCoords = null }) {
  const mountRef = useRef(null);
  const animFrameId = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 400;
    let height = container.clientHeight || 420;

    // --- Scene, Camera, Renderer ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 1.1, 4.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // --- Procedural Shipping Label Texture ---
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 512;
    const ctx = labelCanvas.getContext('2d');

    // Label background (clean off-white)
    ctx.fillStyle = '#FCF7F6';
    ctx.fillRect(0, 0, 512, 512);

    // Dark Plum Top Header
    ctx.fillStyle = '#1D1A39';
    ctx.fillRect(20, 20, 472, 72);

    // Brand on Label
    ctx.fillStyle = '#E8BCB9';
    ctx.font = 'bold 26px Inter, sans-serif';
    ctx.fillText('PARCELAI LOGISTICS', 40, 64);

    ctx.fillStyle = '#F39F5A';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText('AI PRIORITY SCAN', 340, 62);

    // Barcode Container
    ctx.fillStyle = '#1D1A39';
    ctx.fillRect(36, 115, 440, 80);

    // Barcode Lines
    ctx.fillStyle = '#FFFFFF';
    let x = 48;
    while (x < 464) {
      const barW = (x % 7 === 0 || x % 11 === 0) ? 5 : 2.5;
      ctx.fillRect(x, 123, barW, 64);
      x += barW + (x % 5 === 0 ? 4 : 2);
    }

    // AWB and Tracking
    ctx.fillStyle = '#1D1A39';
    ctx.font = 'bold 19px monospace';
    ctx.fillText('AWB: 9874-5120-PCL-AI', 38, 228);

    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#451952';
    ctx.fillText('DESTINATION: Mumbai Fulfillment Center #42', 38, 258);
    ctx.fillText('SKU: D01 · White Sadi · QTY: 1', 38, 284);
    ctx.fillText('STATUS: GEMINI VISION VERIFIED', 38, 310);

    // QR Code Representation
    ctx.fillStyle = '#451952';
    ctx.fillRect(375, 230, 95, 95);
    ctx.fillStyle = '#FCF7F6';
    ctx.fillRect(385, 240, 32, 32);
    ctx.fillRect(428, 283, 32, 32);

    // AI Passed Stamp
    ctx.strokeStyle = '#AE445A';
    ctx.lineWidth = 3;
    ctx.strokeRect(36, 345, 440, 115);
    ctx.fillStyle = '#AE445A';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText('✓ PARCEL VERIFIED BY AI', 105, 412);

    const labelTexture = new THREE.CanvasTexture(labelCanvas);

    // --- Box Cardboard Texture Canvas ---
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = 256;
    cardCanvas.height = 256;
    const cCtx = cardCanvas.getContext('2d');
    cCtx.fillStyle = '#451952'; // Rich Plum Cardboard Tone
    cCtx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 350; i++) {
      cCtx.fillStyle = `rgba(232, 188, 185, ${Math.random() * 0.08})`;
      cCtx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    const cardTexture = new THREE.CanvasTexture(cardCanvas);

    // --- Geometry & Materials ---
    const boxW = 2.4;
    const boxH = 1.5;
    const boxD = 1.7;
    const boxGeo = new THREE.BoxGeometry(boxW, boxH, boxD);

    const materials = [
      new THREE.MeshStandardMaterial({ map: cardTexture, roughness: 0.85, metalness: 0.08 }), // right
      new THREE.MeshStandardMaterial({ map: cardTexture, roughness: 0.85, metalness: 0.08 }), // left
      new THREE.MeshStandardMaterial({ map: cardTexture, roughness: 0.75, metalness: 0.08 }), // top
      new THREE.MeshStandardMaterial({ color: 0x1d1a39, roughness: 0.95 }),                   // bottom
      new THREE.MeshStandardMaterial({ map: labelTexture, roughness: 0.4, metalness: 0.04 }), // front (Shipping Label)
      new THREE.MeshStandardMaterial({ map: cardTexture, roughness: 0.85, metalness: 0.08 })  // back
    ];

    const parcelGroup = new THREE.Group();

    const boxMesh = new THREE.Mesh(boxGeo, materials);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    parcelGroup.add(boxMesh);

    // Tape strip along top center
    const tapeGeo = new THREE.BoxGeometry(boxW + 0.02, 0.02, 0.35);
    const tapeMat = new THREE.MeshStandardMaterial({ color: 0xae445a, roughness: 0.3, metalness: 0.2 });
    const tapeMesh = new THREE.Mesh(tapeGeo, tapeMat);
    tapeMesh.position.y = boxH / 2 + 0.01;
    parcelGroup.add(tapeMesh);

    // AI Laser Scanning Beam (Moving Vertically over Label Face)
    const scanGeo = new THREE.BoxGeometry(boxW + 0.15, 0.035, 0.035);
    const scanMat = new THREE.MeshBasicMaterial({
      color: 0xae445a,
      transparent: true,
      opacity: 0.9
    });
    const scanLine = new THREE.Mesh(scanGeo, scanMat);
    scanLine.position.set(0, 0, boxD / 2 + 0.025);
    parcelGroup.add(scanLine);

    // Scanner Point Light
    const scanLight = new THREE.PointLight(0xae445a, 2.5, 3.5);
    scanLight.position.set(0, 0, boxD / 2 + 0.08);
    parcelGroup.add(scanLight);

    scene.add(parcelGroup);

    // --- Ground Contact Radial Shadow ---
    const shadowGeo = new THREE.PlaneGeometry(4.5, 4.5);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
    grad.addColorStop(0, 'rgba(29, 26, 57, 0.38)');
    grad.addColorStop(1, 'rgba(29, 26, 57, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -boxH / 2 - 0.25;
    scene.add(shadowMesh);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffe8e5, 2.2);
    dirLight.position.set(4, 5, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const purplePointLight = new THREE.PointLight(0x662549, 2.5, 9);
    purplePointLight.position.set(-3, 2, 2.5);
    scene.add(purplePointLight);

    const rosePointLight = new THREE.PointLight(0xae445a, 1.8, 6);
    rosePointLight.position.set(2, -1, 2);
    scene.add(rosePointLight);

    // --- Interaction & Animation Loop ---
    let targetRotY = 0.25;
    let targetRotX = 0.12;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = 0.25 + x * 0.7;
      targetRotX = 0.12 - y * 0.45;
      if (onMouseCoords) onMouseCoords({ x, y });
    };

    const handleMouseLeave = () => {
      targetRotY = 0.25;
      targetRotX = 0.12;
      if (onMouseCoords) onMouseCoords({ x: 0, y: 0 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    let clock = new THREE.Clock();

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle floating physics
      parcelGroup.position.y = Math.sin(elapsedTime * 1.8) * 0.08;

      // Laser scanning movement along label face
      const laserY = Math.sin(elapsedTime * 2.5) * (boxH * 0.4);
      scanLine.position.y = laserY;
      scanLight.position.y = laserY;

      // Smooth damping rotation towards mouse target
      parcelGroup.rotation.y += (targetRotY - parcelGroup.rotation.y) * 0.05;
      parcelGroup.rotation.x += (targetRotX - parcelGroup.rotation.x) * 0.05;

      // Shadow breathing
      shadowMesh.scale.setScalar(1 + Math.sin(elapsedTime * 1.8) * 0.05);

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);

      boxGeo.dispose();
      tapeGeo.dispose();
      scanGeo.dispose();
      shadowGeo.dispose();
      labelTexture.dispose();
      cardTexture.dispose();
      shadowTex.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onMouseCoords]);

  return (
    <div
      ref={mountRef}
      className={`w-full h-full min-h-[380px] sm:min-h-[440px] lg:min-h-[480px] relative cursor-grab active:cursor-grabbing ${className}`}
    />
  );
}
