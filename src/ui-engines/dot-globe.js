// DotGlobe v4 — correction pass. Real WebGL Earth (Three.js): thin Fresnel
// atmosphere, day/night shader with readable night side, ACES exposure,
// translucent cloud layer, curated financial-center billboard nodes with
// hemisphere culling, camera auto-fit, damped drag + inertia, focus animation.
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const D2R = Math.PI / 180;
const TWO_PI = Math.PI * 2;

function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
function shortestAngleDelta(a, b) {
  let d = (b - a) % TWO_PI;
  if (d > Math.PI) d -= TWO_PI;
  if (d < -Math.PI) d += TWO_PI;
  return d;
}
function smoothstep(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}
function latLonToVec3(lat, lon, r) {
  const phi = (90 - lat) * D2R;
  const theta = (lon + 180) * D2R;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

const EARTH_VERT = `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vWorldPos;
void main() {
  vUv = uv;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const EARTH_FRAG = `
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D specMap;
uniform vec3 sunDirection;
uniform vec3 cameraPos;
uniform float minLight;
uniform float nightIntensity;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vWorldPos;
void main() {
  vec3 N = normalize(vNormalW);
  vec3 L = normalize(sunDirection);
  float sunAmount = dot(N, L);
  float dayMix = smoothstep(-0.18, 0.30, sunAmount);
  vec3 dayColor = texture2D(dayMap, vUv).rgb;
  vec3 nightCity = texture2D(nightMap, vUv).rgb;
  // ocean mask (white oceans in specular map)
  float ocean = texture2D(specMap, vUv).r;
  // readable dark surface: never pure black — gentle cool ambient floor
  vec3 darkSurface = dayColor * 0.34 + vec3(0.012, 0.020, 0.038);
  darkSurface = mix(darkSurface, darkSurface * vec3(0.70, 0.85, 1.10), ocean * 0.5);
  vec3 darkSide = darkSurface + nightCity * nightIntensity;
  vec3 color = mix(darkSide, dayColor, dayMix);
  // subtle warm terminator band
  float term = smoothstep(-0.05, 0.18, sunAmount) * (1.0 - smoothstep(0.18, 0.45, sunAmount));
  color += vec3(0.22, 0.12, 0.05) * term * 0.32;
  // OCEAN SUN-GLINT: specular reflection of the sun on water, day side only
  vec3 V = normalize(cameraPos - vWorldPos);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 80.0);
  float glint = spec * ocean * smoothstep(0.0, 0.25, sunAmount);
  color += vec3(1.0, 0.94, 0.80) * glint * 0.9;
  gl_FragColor = vec4(color, 1.0);
}`;

const ATMO_VERT = `
varying vec3 vNormalV;
varying vec3 vViewDir;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormalV = normalize(normalMatrix * normal);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const ATMO_FRAG = `
uniform vec3 glowColor;
uniform float intensity;
varying vec3 vNormalV;
varying vec3 vViewDir;
void main() {
  float rim = 1.0 - max(dot(vNormalV, vViewDir), 0.0);
  float f = pow(rim, 4.0);
  gl_FragColor = vec4(glowColor, f * intensity);
}`;

function loadTexture(loader, url) {
  return new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
}
function loadTextureWithFallback(loader, url, fallbackUrl) {
  return loadTexture(loader, url).catch(() => {
    if (fallbackUrl && fallbackUrl !== url) return loadTexture(loader, fallbackUrl);
    throw new Error('texture load failed');
  });
}

export class DotGlobe {
  constructor(canvas, opts) {
    this.canvas = canvas;
    this.opts = opts;
    // default orientation: frame Europe / Africa / Middle East (≈ lon 20, lat 15)
    const v0 = latLonToVec3(15, 22, 1);
    this.rotY = -Math.atan2(v0.x, v0.z);
    this.tiltX = -0.22;
    this.dragging = false;
    this.lastPointer = null;
    this.lastInteract = 0;
    this.velocity = 0;
    this.focusAnim = null;
    this.hovered = null;
    this.selected = null;
    this.pingStart = 0;
    this._destroyed = false;
    this._prevT = 0;
    this.sunAngle = 1.15;
    this.fitFraction = 0.66;

    // nodes: curated financial centers (tiers 1-3) PLUS every remaining
    // sovereign country (tier 4, dim/small) so the whole globe is clickable —
    // countries already represented by a financial-center hub are skipped
    // to avoid a duplicate overlapping marker at the same city.
    const centerCountryNames = new Set((opts.centers || []).map(fc => fc.country && fc.country.name));
    const hubNodes = (opts.centers || []).map((fc) => ({
      fc,
      country: fc.country,
      lat: fc.lat, lon: fc.lon, tier: fc.tier,
      localPos: latLonToVec3(fc.lat, fc.lon, 1.006),
    }));
    const countryNodes = (opts.countries || [])
      .filter((c) => !centerCountryNames.has(c.name))
      .map((c) => ({
        fc: null,
        country: c,
        lat: c.lat, lon: c.lon, tier: 4,
        localPos: latLonToVec3(c.lat, c.lon, 1.004),
      }));
    this.nodes = hubNodes.concat(countryNodes);

    // intelligence events — glowing category markers + pulsing rings
    this.events = (opts.events || []).map((ev) => ({
      ev,
      lat: ev.lat, lon: ev.lon,
      color: (opts.categoryColor && opts.categoryColor(ev.cat)) || '#3ec6ff',
      localPos: latLonToVec3(ev.lat, ev.lon, 1.012),
      phase: Math.random() * TWO_PI,
    }));
    this.selectedEvent = null;

    this._initThree();
    this._bind();
  }

  async _initThree() {
    const canvas = this.canvas;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    } catch (e) { return; }
    this.renderer = renderer;
    const dpr = window.devicePixelRatio || 1;
    renderer.setPixelRatio(this.opts.highRes ? Math.min(dpr, 2.5) : Math.min(dpr, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.set(0, 0, 4.4);
    this.camera.lookAt(0, 0, 0);

    this.earthGroup = new THREE.Group();
    this.scene.add(this.earthGroup);

    // starfield (sparse, varied brightness)
    const starGeo = new THREE.BufferGeometry();
    const starCount = 420;
    const sp = new Float32Array(starCount * 3);
    const sa = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      const r = 20 + Math.random() * 12;
      const th = Math.random() * TWO_PI, ph = Math.acos(2 * Math.random() - 1);
      sp[i*3] = r * Math.sin(ph) * Math.cos(th);
      sp[i*3+1] = r * Math.sin(ph) * Math.sin(th);
      sp[i*3+2] = r * Math.cos(ph);
      sa[i] = Math.random() < 0.15 ? 0.5 + Math.random() * 0.25 : 0.12 + Math.random() * 0.22;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xcfd8e6, size: 0.05, transparent: true, opacity: 0.4, sizeAttenuation: true });
    this.scene.add(new THREE.Points(starGeo, starMat));

    // placeholder while textures load
    this.placeholderMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 48),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(this.opts.theme.sphereFallback || '#0d131c') })
    );
    this.earthGroup.add(this.placeholderMesh);

    this._resize();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(canvas);
    // pause the render loop entirely when this globe is scrolled out of view —
    // with 3 full WebGL globes on one page (options 1a/1b/1c) this is the
    // single biggest lag fix: only the visible one actually renders/animates.
    this._visible = true;
    this._io = new IntersectionObserver((entries) => {
      for (const e of entries) this._visible = e.isIntersecting;
    }, { threshold: 0.01 });
    this._io.observe(canvas);
    this._loop = this._loop.bind(this);
    this._raf = requestAnimationFrame(this._loop);

    await this._loadTextures();
    this._buildNodes();
  }

  async _loadTextures() {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    try {
      const [dayTex, cloudTex, nightTex, specTex] = await Promise.all([
        loadTextureWithFallback(loader, this.opts.dayTextureUrl, this.opts.dayTextureFallback),
        loadTextureWithFallback(loader, this.opts.cloudTextureUrl, this.opts.cloudTextureFallback),
        loadTextureWithFallback(loader, this.opts.nightTextureUrl, this.opts.nightTextureFallback),
        loadTexture(loader, this.opts.specTextureUrl),
      ]);
      const maxAniso = this.renderer.capabilities.getMaxAnisotropy ? this.renderer.capabilities.getMaxAnisotropy() : 8;
      const aniso = this.opts.highRes ? maxAniso : Math.min(8, maxAniso);
      [dayTex, nightTex].forEach(t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; });
      cloudTex.colorSpace = THREE.SRGBColorSpace;
      cloudTex.anisotropy = aniso;

      const sphereSegments = this.opts.highRes ? 192 : 128;
      const cloudSegments = this.opts.highRes ? 128 : 96;

      this.earthMat = new THREE.ShaderMaterial({
        uniforms: {
          dayMap: { value: dayTex },
          nightMap: { value: nightTex },
          specMap: { value: specTex },
          sunDirection: { value: new THREE.Vector3(1, 0.2, 0.5).normalize() },
          cameraPos: { value: this.camera.position.clone() },
          minLight: { value: 0.30 },
          nightIntensity: { value: 0.5 },
        },
        vertexShader: EARTH_VERT,
        fragmentShader: EARTH_FRAG,
      });
      this.earthGroup.add(new THREE.Mesh(new THREE.SphereGeometry(1, sphereSegments, sphereSegments), this.earthMat));
      this.placeholderMesh.visible = false;

      // clouds — real transparent cloud PNG (own alpha), white, translucent
      const cloudMat = new THREE.MeshLambertMaterial({
        map: cloudTex, transparent: true, opacity: 0.9, depthWrite: false,
      });
      this.cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(1.005, cloudSegments, cloudSegments), cloudMat);
      this.earthGroup.add(this.cloudMesh);
      // soft light so clouds catch day/night too
      const cloudLight = new THREE.DirectionalLight(0xffffff, 1.1);
      this.scene.add(cloudLight);
      this._cloudLight = cloudLight;
      this.scene.add(new THREE.AmbientLight(0x2a3446, 0.6));

      // thin Fresnel atmosphere hugging the surface
      const atmoMat = new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(this.opts.theme.atmoColor || '#7bc8e8') },
          intensity: { value: 0.16 },
        },
        vertexShader: ATMO_VERT,
        fragmentShader: ATMO_FRAG,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      });
      this.earthGroup.add(new THREE.Mesh(new THREE.SphereGeometry(1.013, cloudSegments, cloudSegments), atmoMat));

      // visible sun: a soft glowing disc placed in world space along the sun dir
      const sunTex = this._sunSprite();
      const sunMat = new THREE.SpriteMaterial({ map: sunTex, transparent: true, opacity: 0.9, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
      this.sunSprite = new THREE.Sprite(sunMat);
      this.sunSprite.scale.set(1.5, 1.5, 1);
      this.sunSprite.renderOrder = 5;
      this.scene.add(this.sunSprite);

      this.texturesReady = true;
    } catch (e) {
      this.texturesReady = false;
    }
  }

  _sunSprite() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,250,235,1)');
    g.addColorStop(0.12, 'rgba(255,240,200,0.95)');
    g.addColorStop(0.35, 'rgba(255,214,140,0.35)');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }

  _nodeSprite(coreColor) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    // soft outer halo
    let g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.10)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    // bright crisp core
    ctx.beginPath(); ctx.arc(64, 64, 11, 0, TWO_PI);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    return new THREE.CanvasTexture(c);
  }

  _buildNodes() {
    const theme = this.opts.theme;
    this.nodeTex = this._nodeSprite();
    const tierScale = { 1: 0.115, 2: 0.088, 3: 0.062, 4: 0.04 };
    for (const node of this.nodes) {
      const market = this.opts.getMarket(node.country);
      const av = Math.abs(market.change);
      const isVolatile = av > 2.0;
      let hex;
      if (this.opts.riskMode && this.opts.getRiskColor) {
        hex = this.opts.getRiskColor(node.country);
      } else {
        hex = isVolatile ? theme.vol : market.change > 0.15 ? theme.up : market.change < -0.15 ? theme.down : theme.neutral;
      }
      node.isVolatile = isVolatile;
      const mat = new THREE.SpriteMaterial({
        map: this.nodeTex, color: new THREE.Color(hex),
        transparent: true, opacity: node.tier === 4 ? 0.62 : 1, depthWrite: false, depthTest: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(node.localPos);
      const s = tierScale[node.tier] || 0.06;
      sprite.scale.set(s, s, 1);
      sprite.renderOrder = 10;
      node.sprite = sprite;
      node.baseScale = s;
      node.color = hex;
      this.earthGroup.add(sprite);
    }

    // intelligence event markers: bright core + expanding pulse ring
    this.ringTex = this._ringSprite();
    for (const evn of this.events) {
      const col = new THREE.Color(evn.color);
      const coreMat = new THREE.SpriteMaterial({ map: this.nodeTex, color: col, transparent: true, opacity: 1, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
      const core = new THREE.Sprite(coreMat);
      core.position.copy(evn.localPos);
      core.scale.set(0.072, 0.072, 1);
      core.renderOrder = 12;
      evn.core = core;
      this.earthGroup.add(core);

      const ringMat = new THREE.SpriteMaterial({ map: this.ringTex, color: col, transparent: true, opacity: 0.8, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
      const ring = new THREE.Sprite(ringMat);
      ring.position.copy(evn.localPos);
      ring.scale.set(0.08, 0.08, 1);
      ring.renderOrder = 11;
      evn.ring = ring;
      this.earthGroup.add(ring);
    }

    this._tmpV = new THREE.Vector3();
    this._camDir = new THREE.Vector3();
  }

  _ringSprite() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(64, 64, 46, 0, TWO_PI); ctx.stroke();
    return new THREE.CanvasTexture(c);
  }

  _resize() {
    const canvas = this.canvas;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h || !this.renderer) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.w = w; this.h = h;
    this._fitCamera();
  }

  // fit the atmosphere sphere (radius ~1.02) into `fitFraction` of the viewport,
  // whichever of width/height is the tighter constraint.
  _fitCamera() {
    const R = 1.03;
    const vFov = this.camera.fov * D2R;
    const dH = R / (this.fitFraction * Math.tan(vFov / 2));
    const hFovTan = Math.tan(vFov / 2) * this.camera.aspect;
    const dW = R / (this.fitFraction * hFovTan);
    this.camera.position.z = Math.max(dH, dW);
    this.camera.updateProjectionMatrix();
  }

  _bind() {
    const c = this.canvas;
    this._onDown = (e) => {
      this.dragging = true; this.lastPointer = this._pos(e); this.lastInteract = performance.now();
      this.velocity = 0; c.style.cursor = 'grabbing';
    };
    this._onMove = (e) => {
      const p = this._pos(e);
      if (this.dragging && this.lastPointer) {
        const dx = p.x - this.lastPointer.x, dy = p.y - this.lastPointer.y;
        this.rotY += dx * 0.005;
        this.velocity = Math.max(-0.06, Math.min(0.06, dx * 0.005));
        this.tiltX = Math.max(-0.85, Math.min(0.85, this.tiltX + dy * 0.003));
        this.lastPointer = p; this.lastInteract = performance.now();
      } else {
        this._hoverTest(p);
      }
    };
    this._onUp = () => { this.dragging = false; this.lastPointer = null; c.style.cursor = 'grab'; };
    this._onEnterCanvas = () => { this._hoveringGlobe = true; };
    this._onLeaveCanvas = () => { this._hoveringGlobe = false; this._leaveTime = performance.now(); };
    c.addEventListener('pointerenter', this._onEnterCanvas);
    c.addEventListener('pointerleave', this._onLeaveCanvas);
    this._onLeave = () => {
      this.dragging = false; this.lastPointer = null;
      if (this.hovered) { this.hovered = null; this.opts.onHover && this.opts.onHover(null); }
    };
    this._onClick = (e) => {
      const p = this._pos(e);
      const hit = this._pick(p);
      if (!hit) return;
      if (hit.kind === 'event') {
        this.selectEvent(hit.ref.ev, true);
        this.opts.onEventSelect && this.opts.onEventSelect(hit.ref.ev);
      } else {
        this.selectedEvent = null;
        this.opts.onSelect && this.opts.onSelect(hit.ref.country);
        this.focusOn(hit.ref);
        this.selected = hit.ref;
      }
    };
    c.addEventListener('pointerdown', this._onDown);
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
    c.addEventListener('pointerleave', this._onLeave);
    c.addEventListener('click', this._onClick);
    c.style.cursor = 'grab';
  }

  _pos(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  _screenPos(worldObj) {
    worldObj.getWorldPosition(this._tmpV);
    const proj = this._tmpV.clone().project(this.camera);
    return { sx: (proj.x * 0.5 + 0.5) * this.w, sy: (-proj.y * 0.5 + 0.5) * this.h };
  }

  // combined screen-space pick: events first (they sit on top), then centers
  _pick(p) {
    if (!this.camera || !this.w) return null;
    let best = null, bestD = 22 * 22;
    for (const evn of this.events) {
      if (!evn.core || evn._vis <= 0.12) continue;
      const { sx, sy } = this._screenPos(evn.core);
      const dx = sx - p.x, dy = sy - p.y, d = dx*dx + dy*dy;
      if (d < bestD) { bestD = d; best = { kind: 'event', ref: evn }; }
    }
    if (best) return best;
    let bestNode = null, bestNodeD = Infinity;
    for (const node of this.nodes) {
      if (!node.sprite || node._vis <= 0.12) continue;
      const { sx, sy } = this._screenPos(node.sprite);
      const dx = sx - p.x, dy = sy - p.y, d = dx*dx + dy*dy;
      const tol = node.tier === 4 ? 14 * 14 : 20 * 20;
      if (d < tol && d < bestNodeD) { bestNodeD = d; bestNode = node; }
    }
    return bestNode ? { kind: 'center', ref: bestNode } : null;
  }

  _hoverTest(p) {
    const hit = this._pick(p);
    const key = hit ? (hit.kind + ':' + (hit.kind === 'event' ? hit.ref.ev.id : hit.ref.country.name)) : null;
    this.canvas.style.cursor = hit ? 'pointer' : 'grab';
    this.hovered = hit;
    if (this.opts.onHover) {
      if (!hit) this.opts.onHover(null);
      else if (hit.kind === 'event') this.opts.onHover({ kind: 'event', event: hit.ref.ev }, p.x, p.y);
      else this.opts.onHover({ kind: 'center', country: hit.ref.country }, p.x, p.y);
    }
  }

  // public: focus + select an event by object (from globe or feed click)
  selectEvent(ev, doFocus) {
    const evn = this.events.find(e => e.ev.id === ev.id);
    if (!evn) return;
    this.selectedEvent = evn;
    this.selected = null;
    if (doFocus !== false) this.focusOn(evn);
  }
  selectEventById(id, doFocus) {
    const evn = this.events.find(e => e.ev.id === id);
    if (evn) this.selectEvent(evn.ev, doFocus);
  }

  setRiskMode(enabled) {
    this.opts.riskMode = enabled;
    if (!this.nodes) return;
    for (const node of this.nodes) {
      if (!node.sprite) continue;
      let hex;
      if (enabled && this.opts.getRiskColor) {
        hex = this.opts.getRiskColor(node.country);
      } else {
        const market = this.opts.getMarket(node.country);
        const av = Math.abs(market.change);
        hex = av > 2.0 ? this.opts.theme.vol : market.change > 0.15 ? this.opts.theme.up : market.change < -0.15 ? this.opts.theme.down : this.opts.theme.neutral;
      }
      node.sprite.material.color.set(hex);
    }
  }

  setCrisisHotspots(hotspots) {
    // remove any previous crisis rings
    if (this.crisisRings) {
      for (const h of this.crisisRings) { this.earthGroup.remove(h.core); this.earthGroup.remove(h.ring); }
    }
    this.crisisRings = [];
    if (!hotspots || !hotspots.length) return;
    if (!this.ringTex) this.ringTex = this._ringSprite();
    for (const h of hotspots) {
      const col = new THREE.Color(h.color);
      const pos = latLonToVec3(h.lat, h.lon, 1.012);
      const coreMat = new THREE.SpriteMaterial({ map: this.nodeTex, color: col, transparent: true, opacity: 1, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
      const core = new THREE.Sprite(coreMat);
      core.position.copy(pos);
      core.scale.set(h.severity === 'Critical' ? 0.1 : 0.08, h.severity === 'Critical' ? 0.1 : 0.08, 1);
      core.renderOrder = 14;
      this.earthGroup.add(core);
      const ringMat = new THREE.SpriteMaterial({ map: this.ringTex, color: col, transparent: true, opacity: 0.85, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
      const ring = new THREE.Sprite(ringMat);
      ring.position.copy(pos);
      ring.scale.set(0.09, 0.09, 1);
      ring.renderOrder = 13;
      this.earthGroup.add(ring);
      this.crisisRings.push({ core, ring, localPos: pos, phase: Math.random() * Math.PI * 2, severity: h.severity });
    }
  }

  focusOn(node) {
    const v0 = latLonToVec3(node.lat, node.lon, 1);
    const target = -Math.atan2(v0.x, v0.z);
    this.focusAnim = { from: this.rotY, to: this.rotY + shortestAngleDelta(this.rotY, target), start: performance.now(), dur: 900 };
    this._focusTarget = node;
    this.pingStart = performance.now();
    this.velocity = 0;
  }

  _loop(now) {
    if (this._destroyed) return;
    if (!this._visible) {
      // still schedule the next frame (cheap) so we resume instantly when
      // scrolled back into view, but skip all scene work + GPU render.
      this._prevT = now;
      this._raf = requestAnimationFrame(this._loop);
      return;
    }
    try { this._tick(now); } catch (e) { console.error('[DotGlobe]', e); }
    this._raf = requestAnimationFrame(this._loop);
  }

  _tick(now) {
    const dt = Math.min(0.05, (now - this._prevT || 16) / 1000);
    this._prevT = now;

    if (this.focusAnim) {
      const { from, to, start, dur } = this.focusAnim;
      const t = Math.min(1, (now - start) / dur);
      this.rotY = from + (to - from) * easeInOutCubic(t);
      if (t >= 1) this.focusAnim = null;
    } else if (this.dragging) {
      // handled in pointermove
    } else if (Math.abs(this.velocity) > 0.0002) {
      this.rotY += this.velocity;
      this.velocity *= 0.94;
    } else {
      // Quiet Intelligence: rotation slows to a stop under the cursor, then
      // eases back in only after a calm 6s pause once the cursor leaves.
      const target = this._hoveringGlobe ? 0 : (now - (this._leaveTime || 0) > 6000 ? (this.opts.autoSpeed ?? 0.02) : 0);
      this._rotSpeed = (this._rotSpeed ?? 0) + (target - (this._rotSpeed ?? 0)) * Math.min(1, dt * 0.9);
      this.rotY += dt * this._rotSpeed;
    }

    if (this.earthGroup) {
      this.earthGroup.rotation.y = this.rotY;
      this.earthGroup.rotation.x = this.tiltX;
    }
    if (this.cloudMesh) this.cloudMesh.rotation.y += dt * 0.004;

    this.sunAngle += dt * 0.008;
    const sunDir = new THREE.Vector3(Math.cos(this.sunAngle), 0.22, Math.sin(this.sunAngle)).normalize();
    if (this.earthMat) {
      this.earthMat.uniforms.sunDirection.value.copy(sunDir);
      this.earthMat.uniforms.cameraPos.value.copy(this.camera.position);
    }
    // position the visible sun far along the sun direction, off to the side
    if (this.sunSprite) {
      this.sunSprite.position.copy(sunDir).multiplyScalar(6.5);
    }
    if (this._cloudLight) {
      this._cloudLight.position.copy(sunDir).multiplyScalar(5);
    }
    // compute subsolar geographic point (sun overhead) in earth-fixed coords,
    // and emit day/night status for the UI readout (throttled ~5/s)
    if (this.opts.onSunUpdate && now - (this._lastSunEmit || 0) > 200) {
      this._lastSunEmit = now;
      // undo earth's current Y rotation to bring sunDir into earth-local frame
      const cy = Math.cos(-this.rotY), sy = Math.sin(-this.rotY);
      const lx = sunDir.x * cy + sunDir.z * sy;
      const lz = -sunDir.x * sy + sunDir.z * cy;
      const ly = sunDir.y;
      const phi = Math.acos(Math.max(-1, Math.min(1, ly)));
      const subLat = 90 - phi / D2R;
      let subLon = Math.atan2(lz, -lx) / D2R - 180;
      subLon = ((subLon + 540) % 360) - 180;
      // is the currently-centered/selected point in day or night?
      let selDayFactor = null;
      const ft = this._focusTarget;
      if (ft) {
        const sv = latLonToVec3(ft.lat, ft.lon, 1);
        // rotate sv by rotY into world, dot with world sunDir
        const wcy = Math.cos(this.rotY), wsy = Math.sin(this.rotY);
        const wx = sv.x * wcy + sv.z * wsy;
        const wz = -sv.x * wsy + sv.z * wcy;
        selDayFactor = wx * sunDir.x + sv.y * sunDir.y + wz * sunDir.z;
      }
      this.opts.onSunUpdate({ subLat, subLon, selDayFactor });
    }

    // hemisphere culling + pulse for nodes
    if (this.nodes.length && this._tmpV) {
      this._camDir.copy(this.camera.position).normalize();
      for (const node of this.nodes) {
        if (!node.sprite) continue;
        node.sprite.getWorldPosition(this._tmpV);
        const vis = smoothstep(0.02, 0.16, this._tmpV.clone().normalize().dot(this._camDir));
        node._vis = vis;
        const isSel = this.selected === node;
        const pulse = isSel ? (0.88 + 0.1 * Math.sin(now * 0.0014)) : 1;
        node.sprite.material.opacity = vis * (isSel ? 1 : 0.85) * pulse;
        const sc = node.baseScale * (isSel ? 1.5 : 1) * (0.9 + 0.1 * pulse);
        node.sprite.scale.set(sc, sc, 1);
        node.sprite.visible = vis > 0.01;
      }
    }

    // events: hemisphere cull, core pulse, expanding ring
    if (this.events.length && this._tmpV) {
      for (const evn of this.events) {
        if (!evn.core) continue;
        evn.core.getWorldPosition(this._tmpV);
        const vis = smoothstep(0.02, 0.16, this._tmpV.clone().normalize().dot(this._camDir));
        evn._vis = vis;
        const isSel = this.selectedEvent === evn;
        const beat = 0.6 + 0.4 * Math.sin(now * 0.0022 + evn.phase);
        const coreS = (isSel ? 0.11 : 0.078) * (0.9 + 0.15 * beat);
        evn.core.scale.set(coreS, coreS, 1);
        evn.core.material.opacity = vis * (isSel ? 1 : 0.95);
        evn.core.visible = vis > 0.01;
        // ring expands 0→1 on a loop then fades
        const rt = ((now * 0.0006 + evn.phase) % 1);
        const rs = (isSel ? 0.10 : 0.075) + rt * (isSel ? 0.26 : 0.18);
        evn.ring.scale.set(rs, rs, 1);
        evn.ring.material.opacity = vis * (1 - rt) * (isSel ? 0.85 : 0.55);
        evn.ring.visible = vis > 0.01;
      }
    }

    // crisis hotspot rings: continuous expanding pulse, independent of events/nodes
    if (this.crisisRings && this.crisisRings.length && this._tmpV) {
      for (const h of this.crisisRings) {
        h.core.getWorldPosition(this._tmpV);
        const vis = smoothstep(0.02, 0.16, this._tmpV.clone().normalize().dot(this._camDir));
        const beat = 0.6 + 0.4 * Math.sin(now * 0.003 + h.phase);
        const coreS = (h.severity === 'Critical' ? 0.1 : 0.08) * (0.9 + 0.18 * beat);
        h.core.scale.set(coreS, coreS, 1);
        h.core.material.opacity = vis * 0.95;
        h.core.visible = vis > 0.01;
        const rt = ((now * 0.00045 + h.phase) % 1);
        const rs = 0.1 + rt * (h.severity === 'Critical' ? 0.42 : 0.3);
        h.ring.scale.set(rs, rs, 1);
        h.ring.material.opacity = vis * (1 - rt) * 0.8;
        h.ring.visible = vis > 0.01;
      }
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    this._destroyed = true;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._ro && this._ro.disconnect();
    this._io && this._io.disconnect();
    const c = this.canvas;
    c.removeEventListener('pointerdown', this._onDown);
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    c.removeEventListener('pointerleave', this._onLeave);
    c.removeEventListener('pointerenter', this._onEnterCanvas);
    c.removeEventListener('pointerleave', this._onLeaveCanvas);
    c.removeEventListener('click', this._onClick);
    if (this.renderer) this.renderer.dispose();
  }
}
