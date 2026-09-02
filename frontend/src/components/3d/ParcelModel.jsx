import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ParcelModel({
  isScanning = false,
  interactive = true,
  height = '320px',
  className = ''
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const h = container.clientHeight || parseInt(height, 10) || 320;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / h, 0.1, 1000);
    camera.position.set(0, 1.2, 4.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // --- Create Shipping Label Texture via HTML Canvas ---
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 512;
    const ctx = labelCanvas.getContext('2d');

    // Label background (blush white)
    ctx.fillStyle = '#FDF5F4';
    ctx.fillRect(0, 0, 512, 512);

    // Purple header bar
    ctx.fillStyle = '#1D1A39';
    ctx.fillRect(20, 20, 472, 70);

    // Logo Text
    ctx.fillStyle = '#E8BCB9';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText('PARCELAI LOGISTICS', 40, 62);

    ctx.fillStyle = '#F39F5A';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('PRIORITY AI EXPRESS', 340, 60);

    // Divider
    ctx.strokeStyle = '#EDD9D7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, 105);
    ctx.lineTo(492, 105);
    ctx.stroke();

    // Barcode area
    ctx.fillStyle = '#1D1A39';
    ctx.fillRect(40, 120, 432, 80);
    // Draw Barcode lines
    ctx.fillStyle = '#FFFFFF';
    let xPos = 50;
    while (xPos < 460) {
      const w = Math.random() > 0.4 ? 4 : 2;
      ctx.fillRect(xPos, 128, w, 64);
      xPos += w + (Math.random() > 0.5 ? 4 : 2);
    }

    // AWB Text
    ctx.fillStyle = '#1D1A39';
    ctx.font = 'bold 18px JetBrains Mono, monospace';
    ctx.fillText('AWB: 9874-5120-PCL-AI', 40, 230);

    // Recipient Details
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#451952';
    ctx.fillText('TO: Mumbai Fulfillment Hub #42', 40, 260);
    ctx.fillText('SKU: PCL-908-EX | QTY: 1', 40, 285);
    ctx.fillText('STATUS: VERIFIED PARCEL', 40, 310);

    // QR Code visual mockup
    ctx.fillStyle = '#451952';
    ctx.fillRect(380, 230, 90, 90);
    ctx.fillStyle = '#FDF5F4';
    ctx.fillRect(390, 240, 30, 30);
    ctx.fillRect(430, 280, 30, 30);

    // Decorative stamp
    ctx.strokeStyle = '#AE445A';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 340, 432, 120);
    ctx.fillStyle = '#AE445A';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('PASSED - AI SCANNER', 140, 410);

    const labelTexture = new THREE.CanvasTexture(labelCanvas);

    // --- Box Geometry & Materials ---
    const boxWidth = 2.2;
    const boxHeight = 1.4;
    const boxDepth = 1.6;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    // Custom Box Cardboard Texture Canvas
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = 256;
    cardCanvas.height = 256;
    const cCtx = cardCanvas.getContext('2d');
    cCtx.fillStyle = '#662549'; // Base Plum Cardboard
    cCtx.fillRect(0, 0, 256, 256);
    // Subtle texture noise
    for (let i = 0; i < 400; i++) {
      cCtx.fillStyle = `rgba(232, 188, 185, ${Math.random() * 0.08})`;
      cCtx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    const cardTexture = new THREE.CanvasTexture(cardCanvas);

    // Materials array [right, left, top, bottom, front, back]
    const materials = [
      new THREE.MeshStandardMaterial({ map: cardTexture, roughness: 0.8, metalness: 0.1 }),
      new THREE.MeshStandardMaterial({ map: cardTexture, roughness: 0.8, metalness: 0.1 }),
      new THREE.MeshStandardMaterial({ map: cardTexture, roughness: 0.7, metalness: 0.1 }),
      new THREE.MeshStandardMaterial({ color: 0x1d1a39, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ map: labelTexture, roughness: 0.4, metalness: 0.05 }), // Front with Shipping Label
      new THREE.MeshStandardMaterial({ map: cardTexture, roughness: 0.8, metalness: 0.1 })
    ];

    const parcelGroup = new THREE.Group();

    const boxMesh = new THREE.Mesh(geometry, materials);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    parcelGroup.add(boxMesh);

    // Tape strip along top center
    const tapeGeo = new THREE.BoxGeometry(boxWidth + 0.02, 0.02, 0.3);
    const tapeMat = new THREE.MeshStandardMaterial({ color: 0xae445a, roughness: 0.3, metalness: 0.2 });
    const tapeMesh = new THREE.Mesh(tapeGeo, tapeMat);
    tapeMesh.position.y = boxHeight / 2 + 0.01;
    parcelGroup.add(tapeMesh);

    // Scanner Laser Mesh (Purple Beam)
    const scanGeo = new THREE.BoxGeometry(boxWidth + 0.3, 0.04, 0.04);
    const scanMat = new THREE.MeshBasicMaterial({
      color: 0xae445a,
      transparent: true,
      opacity: 0.85
    });
    const scanLine = new THREE.Mesh(scanGeo, scanMat);
    scanLine.position.set(0, 0, boxDepth / 2 + 0.03);
    parcelGroup.add(scanLine);

    // Laser Light Beam Glow
    const scanLight = new THREE.PointLight(0xae445a, 2.5, 3);
    scanLight.position.set(0, 0, boxDepth / 2 + 0.1);
    parcelGroup.add(scanLight);

    scene.add(parcelGroup);

    // --- Ground Contact Shadow Platform ---
    const shadowGeo = new THREE.PlaneGeometry(4, 4);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
    grad.addColorStop(0, 'rgba(29, 26, 57, 0.35)');
    grad.addColorStop(1, 'rgba(29, 26, 57, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -boxHeight / 2 - 0.2;
    scene.add(shadowMesh);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffe8e5, 2.0);
    dirLight.position.set(4, 6, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const purplePointLight = new THREE.PointLight(0x451952, 2.0, 8);
    purplePointLight.position.set(-3, 2, 2);
    scene.add(purplePointLight);

    // --- Mouse Interaction setup ---
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0.2;
    let targetRotationY = -0.3;

    const handleMouseMove = (e) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      targetRotationY = x * 0.45;
      targetRotationX = y * 0.3 + 0.2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- Animation Loop ---
    let animationFrameId;
    let clock = new THREE.Clock();
    let scanDirection = 1;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth floating bobbing movement
      parcelGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.08;

      // Smooth rotation dampening toward mouse target
      parcelGroup.rotation.y += (targetRotationY - parcelGroup.rotation.y) * 0.05;
      parcelGroup.rotation.x += (targetRotationX - parcelGroup.rotation.x) * 0.05;

      // Scanner Beam Animation
      if (isScanning) {
        scanLine.visible = true;
        scanLight.visible = true;
        scanLine.position.y += 0.015 * scanDirection;
        scanLight.position.y = scanLine.position.y;
        if (scanLine.position.y > boxHeight / 2) scanDirection = -1;
        if (scanLine.position.y < -boxHeight / 2) scanDirection = 1;
      } else {
        scanLine.visible = true;
        scanLight.visible = true;
        scanLine.position.y = Math.sin(elapsedTime * 2) * (boxHeight / 2 - 0.1);
        scanLight.position.y = scanLine.position.y;
      }

      renderer.render(scene, camera);
    };

    animate();

    // --- Resize Handler ---
    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth || 320;
      const nh = container.clientHeight || parseInt(height, 10) || 320;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isScanning, interactive, height]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full overflow-hidden flex items-center justify-center ${className}`}
      style={{ height }}
    />
  );
}
