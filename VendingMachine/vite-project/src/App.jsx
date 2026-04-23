import React, { useEffect, useState, useRef, useCallback } from "react";

// ─── GSAP CDN Loader ───────────────────────────────────────────────────────────
const loadScript = (src) =>
  new Promise((res) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    document.head.appendChild(s);
  });

// ─── Constants ────────────────────────────────────────────────────────────────
const CONTRACT_ADDRESS = "0xBFF3814bc630B2fD1C1bbe2B1d5966154aB4C050";
const PRICE_PER_COKE = 0.000001;

const SLOTS = [
  { id: "A1", label: "COKE", price: "0.001 ETH", active: true, color: "#e63946" },
  { id: "A2", label: "CHIPS", price: "OUT", active: false, color: "#6c757d" },
  { id: "A3", label: "WATER", price: "OUT", active: false, color: "#6c757d" },
];

// ─── Tumbleweed Component ─────────────────────────────────────────────────────
function Tumbleweed({ index, mousePos, gsapRef }) {
  const ref = useRef(null);
  const posRef = useRef({ x: 100 + index * 250, y: 0, vx: (index % 2 === 0 ? 1 : -1) * (0.4 + index * 0.15), vy: 0 });
  const rafRef = useRef(null);
  const rotRef = useRef(Math.random() * 360);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const animate = () => {
      const p = posRef.current;
      const mx = mousePos.current.x;
      const my = mousePos.current.y;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = cx - mx;
      const dy = cy - my;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 180) {
        const force = (180 - dist) / 180;
        p.vx += (dx / dist) * force * 3.5;
        p.vy += (dy / dist) * force * 1.5;
      }

      p.vx *= 0.96;
      p.vy *= 0.9;
      p.vx = Math.max(-8, Math.min(8, p.vx));
      p.vy = Math.max(-4, Math.min(4, p.vy));

      p.x += p.vx;
      p.y += p.vy;

      const maxX = window.innerWidth + 60;
      if (p.x > maxX) p.x = -60;
      if (p.x < -60) p.x = maxX;
      p.y = Math.max(-10, Math.min(30, p.y));

      rotRef.current += p.vx * 4;
      el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${rotRef.current}deg)`;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const baseY = 72 + index * 3;
  const size = 28 + index * 8;

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        bottom: `${baseY}px`,
        left: 0,
        width: `${size}px`,
        height: `${size}px`,
        zIndex: 5,
        pointerEvents: "none",
        willChange: "transform",
      }}
    >
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="none" stroke="#c4a35a" strokeWidth="1.5" opacity="0.7" />
        <circle cx="20" cy="20" r="12" fill="none" stroke="#a0783a" strokeWidth="1.2" opacity="0.6" />
        <circle cx="20" cy="20" r="6" fill="none" stroke="#8a6028" strokeWidth="1" opacity="0.5" />
        <line x1="2" y1="20" x2="38" y2="20" stroke="#c4a35a" strokeWidth="1" opacity="0.5" />
        <line x1="20" y1="2" x2="20" y2="38" stroke="#c4a35a" strokeWidth="1" opacity="0.5" />
        <line x1="7" y1="7" x2="33" y2="33" stroke="#a0783a" strokeWidth="0.8" opacity="0.4" />
        <line x1="33" y1="7" x2="7" y2="33" stroke="#a0783a" strokeWidth="0.8" opacity="0.4" />
        <circle cx="20" cy="20" r="3" fill="#c4a35a" opacity="0.8" />
      </svg>
    </div>
  );
}

// ─── Portal Overlay ───────────────────────────────────────────────────────────
function DrStrangePortal({ active, onDone }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let sparks = [];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    let phase = 0; // 0 = spin open, 1 = hold, 2 = spin close

    const maxRadius = Math.min(canvas.width, canvas.height) * 0.38;

    for (let i = 0; i < 180; i++) {
      sparks.push({
        angle: Math.random() * Math.PI * 2,
        radius: maxRadius * (0.3 + Math.random() * 0.7),
        life: Math.random(),
        speed: 0.02 + Math.random() * 0.06,
        size: 1.5 + Math.random() * 3,
        hue: 30 + Math.random() * 30,
        trail: [],
      });
    }

    const PHASE_DURATIONS = [1200, 2000, 800];
    let phaseStart = performance.now();

    const draw = (now) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - phaseStart;

      if (elapsed > PHASE_DURATIONS[phase]) {
        phase++;
        phaseStart = now;
        if (phase > 2) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          onDone();
          return;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Radial dark overlay
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 1.4);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.6, "rgba(0,0,0,0.55)");
      grad.addColorStop(1, "rgba(0,0,0,0.88)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const progress = phase === 0
        ? Math.min(elapsed / PHASE_DURATIONS[0], 1)
        : phase === 2
        ? 1 - Math.min(elapsed / PHASE_DURATIONS[2], 1)
        : 1;

      const currentRadius = maxRadius * progress;

      // Portal ring rings
      for (let r = 0; r < 4; r++) {
        const ringR = currentRadius * (0.5 + r * 0.18);
        const alpha = 0.15 + r * 0.12;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 160, 30, ${alpha})`;
        ctx.lineWidth = 1.5 - r * 0.2;
        ctx.stroke();
      }

      // Sparks
      sparks.forEach((sp) => {
        sp.angle += sp.speed * (phase === 2 ? -1.5 : 1);
        sp.life += 0.02;
        if (sp.life > 1) sp.life = 0;
        const alpha = Math.sin(sp.life * Math.PI);
        const px = cx + Math.cos(sp.angle) * sp.radius * progress;
        const py = cy + Math.sin(sp.angle) * sp.radius * progress;
        sp.trail.push({ x: px, y: py });
        if (sp.trail.length > 8) sp.trail.shift();

        if (sp.trail.length > 2) {
          ctx.beginPath();
          ctx.moveTo(sp.trail[0].x, sp.trail[0].y);
          for (let t = 1; t < sp.trail.length; t++) {
            ctx.lineTo(sp.trail[t].x, sp.trail[t].y);
          }
          ctx.strokeStyle = `hsla(${sp.hue}, 100%, 65%, ${alpha * 0.5})`;
          ctx.lineWidth = sp.size * 0.5;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(px, py, sp.size * progress, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${sp.hue}, 100%, 70%, ${alpha})`;
        ctx.fill();
      });

      // Kitchen scene inside portal
      if (progress > 0.4) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, currentRadius * 0.85, 0, Math.PI * 2);
        ctx.clip();

        // Kitchen bg
        const kitchenGrad = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy, currentRadius);
        kitchenGrad.addColorStop(0, "#f5e6c8");
        kitchenGrad.addColorStop(1, "#d4a96a");
        ctx.fillStyle = kitchenGrad;
        ctx.fillRect(cx - currentRadius, cy - currentRadius, currentRadius * 2, currentRadius * 2);

        // Counter top
        ctx.fillStyle = "#8B5E3C";
        ctx.fillRect(cx - currentRadius * 0.7, cy + currentRadius * 0.25, currentRadius * 1.4, currentRadius * 0.6);

        // Counter surface highlight
        ctx.fillStyle = "#a0703f";
        ctx.fillRect(cx - currentRadius * 0.7, cy + currentRadius * 0.25, currentRadius * 1.4, 6);

        // Tile pattern on wall
        ctx.strokeStyle = "rgba(180, 140, 100, 0.3)";
        ctx.lineWidth = 0.5;
        for (let tx = -4; tx < 4; tx++) {
          for (let ty = -3; ty < 2; ty++) {
            const tileSize = currentRadius * 0.2;
            ctx.strokeRect(
              cx + tx * tileSize - tileSize * 0.5,
              cy + ty * tileSize - currentRadius * 0.3,
              tileSize,
              tileSize
            );
          }
        }

        // Coke bottle
        if (phase >= 1) {
          const bottleX = cx;
          const bottleY = cy + currentRadius * 0.15;
          const bh = currentRadius * 0.5;
          const bw = currentRadius * 0.13;

          // Bottle body
          ctx.beginPath();
          ctx.roundRect(bottleX - bw / 2, bottleY - bh * 0.7, bw, bh * 0.85, 6);
          ctx.fillStyle = "#8B0000";
          ctx.fill();

          // Bottle neck
          ctx.beginPath();
          ctx.roundRect(bottleX - bw * 0.35, bottleY - bh, bw * 0.7, bh * 0.35, 3);
          ctx.fillStyle = "#6B0000";
          ctx.fill();

          // Cap
          ctx.beginPath();
          ctx.roundRect(bottleX - bw * 0.4, bottleY - bh - 8, bw * 0.8, 10, 2);
          ctx.fillStyle = "#cc0000";
          ctx.fill();

          // Label
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.beginPath();
          ctx.roundRect(bottleX - bw * 0.42, bottleY - bh * 0.5, bw * 0.84, bh * 0.4, 3);
          ctx.fill();
          ctx.fillStyle = "#cc0000";
          ctx.font = `bold ${Math.max(8, bw * 0.7)}px serif`;
          ctx.textAlign = "center";
          ctx.fillText("Coca", bottleX, bottleY - bh * 0.3);
          ctx.fillText("Cola", bottleX, bottleY - bh * 0.12);

          // Shine
          ctx.beginPath();
          ctx.roundRect(bottleX - bw * 0.35, bottleY - bh * 0.65, bw * 0.2, bh * 0.6, 4);
          ctx.fillStyle = "rgba(255,255,255,0.18)";
          ctx.fill();
        }

        ctx.restore();
      }

      // Outer glow
      const outerGlow = ctx.createRadialGradient(cx, cy, currentRadius * 0.85, cx, cy, currentRadius * 1.15);
      outerGlow.addColorStop(0, "rgba(255, 160, 30, 0.6)");
      outerGlow.addColorStop(0.5, "rgba(255, 100, 10, 0.3)");
      outerGlow.addColorStop(1, "rgba(255, 60, 0, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        pointerEvents: "none",
      }}
    />
  );
}

// ─── Desert Background ────────────────────────────────────────────────────────
function DesertBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;

      // Sky gradient — deep desert dusk
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.62);
      sky.addColorStop(0, "#0a0514");
      sky.addColorStop(0.25, "#1a0a2e");
      sky.addColorStop(0.55, "#3d1a0a");
      sky.addColorStop(0.8, "#8b3a1a");
      sky.addColorStop(1, "#c4622a");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H * 0.62);

      // Stars
      for (let i = 0; i < 220; i++) {
        const sx = Math.random() * W;
        const sy = Math.random() * H * 0.5;
        const sr = Math.random() * 1.2;
        const sa = 0.4 + Math.random() * 0.6;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,245,220,${sa})`;
        ctx.fill();
      }

      // Moon
      const moonX = W * 0.82;
      const moonY = H * 0.1;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 5, moonX, moonY, 60);
      moonGlow.addColorStop(0, "rgba(255,245,180,0.25)");
      moonGlow.addColorStop(1, "rgba(255,200,80,0)");
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
      ctx.fillStyle = "#fff8d0";
      ctx.fill();

      // Distant mesa silhouettes
      ctx.fillStyle = "#1a0a04";
      const mesas = [
        [0, 0.46, 0.18, 0.12],
        [0.14, 0.5, 0.22, 0.1],
        [0.38, 0.42, 0.16, 0.18],
        [0.55, 0.48, 0.28, 0.08],
        [0.74, 0.44, 0.18, 0.14],
        [0.9, 0.5, 0.12, 0.09],
      ];
      mesas.forEach(([rx, ry, rw, rh]) => {
        ctx.beginPath();
        const mx = rx * W;
        const my = ry * H;
        const mw = rw * W;
        const mh = rh * H;
        ctx.moveTo(mx, H * 0.62);
        ctx.lineTo(mx, my + mh * 0.3);
        ctx.lineTo(mx + mw * 0.1, my);
        ctx.lineTo(mx + mw * 0.9, my);
        ctx.lineTo(mx + mw, my + mh * 0.3);
        ctx.lineTo(mx + mw, H * 0.62);
        ctx.closePath();
        ctx.fill();
      });

      // Desert sand floor
      const sand = ctx.createLinearGradient(0, H * 0.58, 0, H);
      sand.addColorStop(0, "#c97a2a");
      sand.addColorStop(0.3, "#a0601a");
      sand.addColorStop(1, "#6b3e10");
      ctx.fillStyle = sand;
      ctx.fillRect(0, H * 0.58, W, H * 0.42);

      // Sand dunes
      ctx.fillStyle = "#b86e22";
      for (let d = 0; d < 5; d++) {
        ctx.beginPath();
        const dx = (d / 5) * W;
        const dy = H * (0.6 + d * 0.05);
        ctx.ellipse(dx + W * 0.12, dy, W * 0.22, H * 0.05, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Horizon glow
      const hglow = ctx.createLinearGradient(0, H * 0.54, 0, H * 0.68);
      hglow.addColorStop(0, "rgba(255,120,30,0.0)");
      hglow.addColorStop(0.5, "rgba(255,120,30,0.22)");
      hglow.addColorStop(1, "rgba(255,120,30,0)");
      ctx.fillStyle = hglow;
      ctx.fillRect(0, H * 0.54, W, H * 0.14);

      // Cactus silhouettes
      drawCactus(ctx, W * 0.08, H * 0.52, H * 0.14);
      drawCactus(ctx, W * 0.91, H * 0.54, H * 0.1);
    };

    function drawCactus(ctx, x, y, h) {
      const w = h * 0.14;
      ctx.fillStyle = "#0f1a08";
      ctx.fillRect(x - w / 2, y - h, w, h);
      // Arms
      ctx.fillRect(x - w * 2.5, y - h * 0.65, w * 2, w);
      ctx.fillRect(x - w * 2.5, y - h * 0.65 - w * 1.8, w, w * 1.8);
      ctx.fillRect(x + w / 2, y - h * 0.5, w * 2, w);
      ctx.fillRect(x + w * 2.5, y - h * 0.5 - w * 1.5, w, w * 1.5);
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}

// ─── Main VendingMachine Component ────────────────────────────────────────────
const VendingMachine = () => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState(0);
  const [userAddress, setUserAddress] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [userCokeBalance, setUserCokeBalance] = useState(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [status, setStatus] = useState("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [portalActive, setPortalActive] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dispensing, setDispensing] = useState(false);
  const [buttonFlash, setButtonFlash] = useState(null);
  const [screenText, setScreenText] = useState("INSERT COIN");
  const [coinInserted, setCoinInserted] = useState(false);
  const [gsapLoaded, setGsapLoaded] = useState(false);
  const mousePos = useRef({ x: -999, y: -999 });
  const machineRef = useRef(null);
  const screenRef = useRef(null);
  const displayRef = useRef(null);

  // Load GSAP
  useEffect(() => {
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js").then(() => {
      setGsapLoaded(true);
    });
  }, []);

  // Track mouse
  useEffect(() => {
    const onMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      // Custom cursor sparkle handled via CSS
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // GSAP machine entrance
  useEffect(() => {
    if (!gsapLoaded || !machineRef.current) return;
    const gsap = window.gsap;
    gsap.fromTo(
      machineRef.current,
      { y: 80, opacity: 0, scale: 0.92 },
      { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "elastic.out(1, 0.6)" }
    );
  }, [gsapLoaded]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatusMsg("No wallet detected — running in demo mode");
      setBalance(12);
      setOwnerAddress("0xDEMO...ADDR");
      setUserAddress("0xUSER...DEMO");
      setScreenText("INSERT COIN");
      setWalletConnected(true);
      return;
    }
    try {
      const { default: Web3 } = await import("https://esm.sh/web3@4.0.1");
      const w = new Web3(window.ethereum);
      setWeb3(w);
      const accounts = await w.eth.requestAccounts();
      setUserAddress(accounts[0]);
      // Fetch machine balance from contract
      const ABI = [{"inputs":[],"name":"getVendingMachineBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"purchase","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"restock","outputs":[],"stateMutability":"nonpayable","type":"function"}];
      const c = new w.eth.Contract(ABI, CONTRACT_ADDRESS);
      setContract(c);
      const bal = await c.methods.getVendingMachineBalance().call();
      setBalance(Number(bal));
      setScreenText("INSERT COIN");
      setWalletConnected(true);
    } catch (e) {
      setStatusMsg("Wallet connection failed — demo mode");
      setBalance(12);
      setScreenText("INSERT COIN");
      setWalletConnected(true);
    }
  };

  const handleSlotClick = (slot) => {
    if (!slot.active) {
      setButtonFlash(slot.id);
      setScreenText("OUT OF STOCK");
      if (gsapLoaded && window.gsap) {
        const gsap = window.gsap;
        const el = document.getElementById(`slot-${slot.id}`);
        if (el) gsap.fromTo(el, { x: -6 }, { x: 6, duration: 0.08, repeat: 5, yoyo: true, ease: "power1.inOut", onComplete: () => gsap.set(el, { x: 0 }) });
      }
      setTimeout(() => {
        setButtonFlash(null);
        setScreenText(coinInserted ? "SELECT ITEM" : "INSERT COIN");
      }, 1500);
      return;
    }
    setSelectedSlot(slot);
    setScreenText(`A1 — COKE`);
    if (gsapLoaded && window.gsap) {
      const gsap = window.gsap;
      const el = document.getElementById(`slot-${slot.id}`);
      if (el) gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: "back.out(2)" });
    }
  };

  const handleInsertCoin = () => {
    if (coinInserted) return;
    setCoinInserted(true);
    setScreenText("COIN ACCEPTED");
    if (gsapLoaded && window.gsap) {
      const gsap = window.gsap;
      const coin = document.getElementById("coin-anim");
      if (coin) {
        gsap.fromTo(coin, { y: -30, opacity: 1 }, {
          y: 30, opacity: 0, duration: 0.7, ease: "power2.in",
          onComplete: () => gsap.set(coin, { y: -30, opacity: 0 })
        });
      }
    }
    setTimeout(() => setScreenText(selectedSlot ? `${selectedSlot.id} — COKE` : "SELECT ITEM"), 1200);
  };

  const handlePurchase = async () => {
    if (!coinInserted) {
      setScreenText("INSERT COIN FIRST");
      setTimeout(() => setScreenText("INSERT COIN"), 1500);
      return;
    }
    if (!selectedSlot) {
      setScreenText("SELECT AN ITEM");
      setTimeout(() => setScreenText("COIN ACCEPTED"), 1500);
      return;
    }
    if (balance <= 0) {
      setScreenText("MACHINE EMPTY");
      return;
    }

    setDispensing(true);
    setScreenText("DISPENSING...");

    if (gsapLoaded && window.gsap) {
      const gsap = window.gsap;
      gsap.fromTo(machineRef.current, { x: 0 }, { x: 3, duration: 0.1, repeat: 10, yoyo: true, ease: "power1.inOut" });
    }

    // Try real contract
    try {
      if (contract && web3 && userAddress) {
        const ethValue = web3.utils.toWei((PRICE_PER_COKE).toString(), "ether");
        await contract.methods.purchase(1).send({ from: userAddress, value: ethValue });
        setBalance((b) => Math.max(0, b - 1));
        setUserCokeBalance((b) => b + 1);
      } else {
        // Demo mode
        await new Promise((r) => setTimeout(r, 1200));
        setBalance((b) => Math.max(0, b - 1));
        setUserCokeBalance((b) => b + 1);
      }

      setScreenText("ENJOY YOUR COKE!");
      setTimeout(() => {
        setPortalActive(true);
        setDispensing(false);
        setCoinInserted(false);
        setSelectedSlot(null);
      }, 800);
    } catch (e) {
      setScreenText("TX FAILED");
      setDispensing(false);
      setTimeout(() => setScreenText("SELECT ITEM"), 2000);
    }
  };

  const handlePortalDone = () => {
    setPortalActive(false);
    setScreenText("THANK YOU!");
    setTimeout(() => setScreenText("INSERT COIN"), 2500);
  };

  const slotBgColor = (slot) => {
    if (!slot.active) return "rgba(60,60,80,0.5)";
    if (selectedSlot?.id === slot.id) return "rgba(230, 57, 70, 0.35)";
    return "rgba(20,20,40,0.6)";
  };

  return (
    <>
      {/* Global Styles */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; cursor: none !important; background: #0a0514; font-family: 'Courier New', monospace; }
        .custom-cursor {
          position: fixed; top: 0; left: 0; width: 18px; height: 18px;
          border: 2px solid rgba(255,160,30,0.9); border-radius: 50%;
          pointer-events: none; z-index: 9999; transition: transform 0.08s ease;
          mix-blend-mode: screen;
        }
        .custom-cursor::after {
          content: ''; position: absolute; top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          width: 4px; height: 4px; background: rgba(255,200,60,1); border-radius: 50%;
        }
        @keyframes scanline {
          0% { top: -10%; } 100% { top: 110%; }
        }
        @keyframes blink {
          0%,100% { opacity: 1; } 50% { opacity: 0; }
        }
        @keyframes flicker {
          0%,100% { opacity: 1; } 92% { opacity: 1; } 93% { opacity: 0.8; } 94% { opacity: 1; }
        }
        @keyframes glow-pulse {
          0%,100% { box-shadow: 0 0 18px rgba(255,160,30,0.5), inset 0 0 10px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 32px rgba(255,180,50,0.8), inset 0 0 10px rgba(0,0,0,0.5); }
        }
        .machine-glow { animation: glow-pulse 3s ease-in-out infinite; }
        .lcd-flicker { animation: flicker 6s linear infinite; }
        .cursor-blink { animation: blink 1s step-end infinite; }
        .scanline-wrap { overflow: hidden; position: absolute; inset: 0; pointer-events: none; border-radius: 6px; }
        .scanline {
          position: absolute; left: 0; width: 100%; height: 12px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.06), transparent);
          animation: scanline 3s linear infinite;
        }
        .slot-btn {
          cursor: none; transition: transform 0.12s, background 0.2s;
          position: relative; overflow: hidden;
        }
        .slot-btn::after {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at center, rgba(255,255,255,0.12) 0%, transparent 70%);
          opacity: 0; transition: opacity 0.2s;
        }
        .slot-btn:hover::after { opacity: 1; }
        .slot-btn:hover { transform: scale(1.04); }
        .slot-btn:active { transform: scale(0.96); }
        .purchase-btn {
          cursor: none;
          background: linear-gradient(135deg, #cc0000, #8b0000);
          border: 2px solid rgba(255,100,100,0.5);
          color: #fff; font-family: 'Courier New', monospace; font-weight: bold;
          font-size: 15px; letter-spacing: 2px; padding: 12px 28px;
          border-radius: 4px; transition: all 0.2s; text-transform: uppercase;
          box-shadow: 0 0 14px rgba(200,0,0,0.5);
        }
        .purchase-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff2020, #cc0000);
          box-shadow: 0 0 28px rgba(255,50,50,0.7);
          transform: scale(1.04);
        }
        .purchase-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .coin-btn {
          cursor: none; font-family: 'Courier New', monospace;
          background: rgba(255,200,60,0.12); border: 1.5px solid rgba(255,200,60,0.5);
          color: rgba(255,200,60,0.9); font-size: 12px; letter-spacing: 1.5px;
          padding: 7px 16px; border-radius: 3px; transition: all 0.2s;
        }
        .coin-btn:hover:not(:disabled) { background: rgba(255,200,60,0.22); box-shadow: 0 0 12px rgba(255,200,60,0.4); }
        .coin-btn:disabled { opacity: 0.4; }
      `}</style>

      {/* Cursor */}
      <CursorFollower />

      {/* Desert BG */}
      <DesertBackground />

      {/* Ground */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: "80px",
        background: "linear-gradient(to bottom, #8a5020, #5a3010)",
        zIndex: 2, borderTop: "2px solid #c07030",
      }} />

      {/* Tumbleweeds */}
      {[0, 1, 2].map((i) => (
        <Tumbleweed key={i} index={i} mousePos={mousePos} gsapRef={null} />
      ))}

      {/* Portal */}
      <DrStrangePortal active={portalActive} onDone={handlePortalDone} />

      {/* Machine */}
      <div
        ref={machineRef}
        className="machine-glow"
        style={{
          position: "fixed",
          left: "50%",
          bottom: "68px",
          transform: "translateX(-50%)",
          width: "320px",
          zIndex: 10,
          opacity: 0,
        }}
      >
        {/* Machine Body */}
        <div style={{
          background: "linear-gradient(175deg, #1a1a2e 0%, #16213e 40%, #0f0f23 100%)",
          border: "2.5px solid rgba(255,160,30,0.4)",
          borderRadius: "16px 16px 8px 8px",
          padding: "0",
          boxShadow: "inset 0 2px 20px rgba(0,0,0,0.8), inset 0 0 60px rgba(0,0,0,0.5)",
          overflow: "hidden",
          position: "relative",
        }}>

          {/* Top Brand Strip */}
          <div style={{
            background: "linear-gradient(90deg, #8b0000, #cc0000, #8b0000)",
            padding: "10px 20px",
            textAlign: "center",
            borderBottom: "2px solid rgba(255,100,50,0.4)",
          }}>
            <div style={{
              fontSize: "22px", fontWeight: "900", letterSpacing: "6px",
              color: "#fff", textShadow: "0 0 20px rgba(255,100,100,0.8)",
              fontFamily: "'Courier New', monospace",
            }}>
              DESERT DROP
            </div>
            <div style={{ fontSize: "9px", color: "rgba(255,200,200,0.7)", letterSpacing: "3px", marginTop: "2px" }}>
              EST. 2049 · BLOCKCHAIN CERTIFIED
            </div>
          </div>

          {/* LCD Screen */}
          <div style={{ padding: "16px 20px 8px" }}>
            <div
              ref={screenRef}
              className="lcd-flicker"
              style={{
                background: "#0a1a08",
                border: "2px solid rgba(80,200,80,0.3)",
                borderRadius: "6px",
                padding: "10px 14px",
                position: "relative",
                boxShadow: "inset 0 2px 12px rgba(0,0,0,0.8), 0 0 8px rgba(80,200,80,0.15)",
              }}
            >
              <div className="scanline-wrap"><div className="scanline" /></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{
                  fontSize: "13px", letterSpacing: "2px", color: "#4dff4d",
                  textShadow: "0 0 8px rgba(77,255,77,0.6)", fontWeight: "bold",
                }}>
                  {screenText}
                  <span className="cursor-blink" style={{ marginLeft: "2px", color: "#4dff4d" }}>_</span>
                </div>
                <div style={{ fontSize: "10px", color: "rgba(77,255,77,0.5)", letterSpacing: "1px" }}>
                  STK:{balance}
                </div>
              </div>
              {userAddress && (
                <div style={{ fontSize: "9px", color: "rgba(77,200,77,0.45)", marginTop: "4px", letterSpacing: "0.5px" }}>
                  {userAddress.slice(0, 8)}...{userAddress.slice(-4)}
                </div>
              )}
            </div>
          </div>

          {/* Product Display Window */}
          <div style={{ padding: "0 20px 12px" }}>
            <div style={{
              background: "rgba(0,0,0,0.7)", border: "2px solid rgba(255,160,30,0.2)",
              borderRadius: "8px", padding: "14px", minHeight: "90px",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", overflow: "hidden",
            }}>
              {/* Shelf lines */}
              {[0, 1].map((s) => (
                <div key={s} style={{
                  position: "absolute", left: "10px", right: "10px",
                  height: "1px", background: "rgba(255,160,30,0.15)",
                  top: `${35 + s * 28}%`,
                }} />
              ))}

              {/* Coke cans in display */}
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                {Array.from({ length: Math.min(balance, 4) }).map((_, i) => (
                  <div key={i} style={{
                    width: "22px", height: "38px",
                    background: "linear-gradient(135deg, #cc0000, #8b0000)",
                    borderRadius: "3px 3px 2px 2px",
                    border: "1px solid rgba(255,100,100,0.4)",
                    boxShadow: "0 0 6px rgba(200,0,0,0.3)",
                    position: "relative", flexShrink: 0,
                  }}>
                    <div style={{
                      position: "absolute", top: "4px", left: "3px", right: "3px",
                      height: "18px", background: "rgba(255,255,255,0.9)",
                      borderRadius: "1px", display: "flex", alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <span style={{ fontSize: "5px", color: "#cc0000", fontWeight: "900", letterSpacing: "0.5px" }}>COKE</span>
                    </div>
                    <div style={{
                      position: "absolute", top: "2px", left: "2px",
                      width: "4px", height: "20px",
                      background: "rgba(255,255,255,0.12)", borderRadius: "2px",
                    }} />
                  </div>
                ))}
                {balance === 0 && (
                  <div style={{ color: "rgba(255,100,100,0.5)", fontSize: "11px", letterSpacing: "2px" }}>EMPTY</div>
                )}
              </div>
            </div>
          </div>

          {/* Slot Buttons */}
          <div style={{ padding: "0 20px 14px" }}>
            <div style={{ fontSize: "9px", color: "rgba(255,160,30,0.5)", letterSpacing: "2px", marginBottom: "8px" }}>
              SELECT ITEM
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  id={`slot-${slot.id}`}
                  className="slot-btn"
                  onClick={() => handleSlotClick(slot)}
                  style={{
                    flex: 1,
                    background: slotBgColor(slot),
                    border: selectedSlot?.id === slot.id
                      ? "2px solid rgba(230,57,70,0.8)"
                      : "1.5px solid rgba(255,160,30,0.25)",
                    borderRadius: "6px",
                    padding: "10px 4px",
                    color: slot.active ? "#fff" : "rgba(150,150,180,0.5)",
                    boxShadow: selectedSlot?.id === slot.id
                      ? "0 0 14px rgba(230,57,70,0.5)"
                      : "none",
                  }}
                >
                  <div style={{
                    fontSize: "16px", fontWeight: "900", letterSpacing: "1px",
                    fontFamily: "'Courier New', monospace",
                    color: slot.active
                      ? (selectedSlot?.id === slot.id ? "#ff6070" : "rgba(255,200,200,0.9)")
                      : "rgba(100,100,130,0.5)",
                  }}>
                    {slot.id}
                  </div>
                  <div style={{ fontSize: "8px", letterSpacing: "0.5px", marginTop: "3px", color: slot.active ? "rgba(255,160,30,0.7)" : "rgba(100,100,130,0.4)" }}>
                    {slot.label}
                  </div>
                  {slot.active && (
                    <div style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: selectedSlot?.id === slot.id ? "#ff4444" : "#44ff44",
                      margin: "4px auto 0",
                      boxShadow: `0 0 6px ${selectedSlot?.id === slot.id ? "rgba(255,68,68,0.8)" : "rgba(68,255,68,0.8)"}`,
                    }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,160,30,0.3), transparent)", margin: "0 20px" }} />

          {/* Coin Slot + Purchase */}
          <div style={{ padding: "14px 20px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
              {/* Coin slot area */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  border: "2px solid rgba(255,200,60,0.5)",
                  background: "rgba(0,0,0,0.6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: coinInserted ? "0 0 12px rgba(255,200,60,0.6)" : "none",
                  transition: "box-shadow 0.3s",
                }}>
                  <div style={{
                    width: "24px", height: "4px",
                    background: coinInserted ? "rgba(255,200,60,0.8)" : "rgba(100,100,100,0.4)",
                    borderRadius: "2px", transition: "background 0.3s",
                  }} />
                </div>
                {/* Coin animation element */}
                <div
                  id="coin-anim"
                  style={{
                    position: "absolute", top: "-30px", left: "50%",
                    transform: "translate(-50%,-30px)",
                    width: "18px", height: "18px", borderRadius: "50%",
                    background: "radial-gradient(circle at 35% 35%, #ffe066, #cc9900)",
                    opacity: 0, pointerEvents: "none",
                    boxShadow: "0 0 8px rgba(255,200,60,0.8)",
                  }}
                />
              </div>

              <button
                className="coin-btn"
                onClick={handleInsertCoin}
                disabled={coinInserted}
                style={{ flexGrow: 1, fontSize: "10px" }}
              >
                {coinInserted ? "✓ COIN IN" : "INSERT COIN"}
              </button>
            </div>

            {/* Purchase button */}
            {!walletConnected ? (
              <button
                className="purchase-btn"
                onClick={connectWallet}
                style={{ width: "100%", background: "linear-gradient(135deg, #1a6b3a, #0d4a28)", borderColor: "rgba(100,255,150,0.5)", boxShadow: "0 0 14px rgba(50,200,100,0.5)" }}
              >
                CONNECT WALLET
              </button>
            ) : (
              <button
                className="purchase-btn"
                onClick={handlePurchase}
                disabled={dispensing || balance === 0}
                style={{ width: "100%" }}
              >
                {dispensing ? "DISPENSING..." : "VEND · 0.001 ETH"}
              </button>
            )}
          </div>

          {/* Dispense slot */}
          <div style={{
            margin: "0 20px 16px",
            height: "32px",
            background: "rgba(0,0,0,0.7)",
            border: "2px solid rgba(255,160,30,0.2)",
            borderRadius: "4px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: "80px", height: "4px",
              background: "rgba(255,160,30,0.15)",
              borderRadius: "2px",
            }} />
          </div>

          {/* Info strip */}
          <div style={{
            background: "rgba(0,0,0,0.4)",
            borderTop: "1px solid rgba(255,160,30,0.15)",
            padding: "8px 20px",
            display: "flex", justifyContent: "space-between",
          }}>
            <div style={{ fontSize: "8px", color: "rgba(255,160,30,0.4)", letterSpacing: "1px" }}>
              COKES BOUGHT: {userCokeBalance}
            </div>
            <div style={{ fontSize: "8px", color: "rgba(255,160,30,0.4)", letterSpacing: "1px" }}>
              {coinInserted ? "▲ READY" : "▲ AWAITING"}
            </div>
          </div>
        </div>

        {/* Machine legs */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 30px" }}>
          {[0, 1].map((i) => (
            <div key={i} style={{
              width: "20px", height: "12px",
              background: "linear-gradient(to bottom, #0f0f23, #090914)",
              border: "1px solid rgba(255,160,30,0.2)",
              borderTop: "none",
            }} />
          ))}
        </div>
      </div>

      {/* Status message */}
      {statusMsg && (
        <div style={{
          position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,160,30,0.4)",
          color: "rgba(255,200,100,0.9)", fontSize: "11px", letterSpacing: "1.5px",
          padding: "8px 20px", borderRadius: "4px", zIndex: 50,
          fontFamily: "'Courier New', monospace",
        }}>
          {statusMsg}
        </div>
      )}
    </>
  );
};

// ─── Cursor Follower ──────────────────────────────────────────────────────────
function CursorFollower() {
  const ref = useRef(null);
  useEffect(() => {
    const move = (e) => {
      if (ref.current) {
        ref.current.style.left = `${e.clientX - 9}px`;
        ref.current.style.top = `${e.clientY - 9}px`;
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <div ref={ref} className="custom-cursor" />;
}

export default VendingMachine;