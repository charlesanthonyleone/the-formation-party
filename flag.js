/* Cloth flag for The Formation Party. Self-contained WebGL, no build step.
   A still drape is drawn when the visitor prefers reduced motion. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvases = [...document.querySelectorAll('[data-flag]')];
  if (!canvases.length || !window.WebGLRenderingContext) return;

  const NAVY = '#0A2342';
  const CRIMSON = '#C41E3A';
  const CREAM = '#f6f3ec';

  function makeTexture() {
    const w = 950;
    const h = 500;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    const stripe = h / 13;
    for (let i = 0; i < 13; i++) {
      g.fillStyle = i % 2 === 0 ? CRIMSON : CREAM;
      g.fillRect(0, i * stripe, w, stripe + 0.5);
    }
    const cw = w * (0.76 / 1.9);
    const ch = stripe * 7;
    g.fillStyle = NAVY;
    g.fillRect(0, 0, cw, ch);
    g.fillStyle = CREAM;
    const starR = ch * 0.0616;
    const rows = [6, 5, 6, 5, 6, 5, 6, 5, 6];
    const gapY = ch / 10;
    rows.forEach((count, row) => {
      const gapX = cw / (count === 6 ? 12 : 10);
      const y = gapY * (row + 1);
      const x0 = count === 6 ? gapX : gapX * 2;
      for (let i = 0; i < count; i++) star(g, x0 + gapX * 2 * i, y, starR);
    });
    return c;
  }

  function star(g, x, y, r) {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = (i % 2 === 0 ? r : r * 0.382) ;
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const px = x + Math.cos(a) * rad;
      const py = y + Math.sin(a) * rad;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
  }

  function perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ]);
  }

  function lookAt(eye, target, up) {
    let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
    let zl = Math.hypot(zx, zy, zz) || 1;
    zx /= zl; zy /= zl; zz /= zl;
    let xx = up[1] * zz - up[2] * zy;
    let xy = up[2] * zx - up[0] * zz;
    let xz = up[0] * zy - up[1] * zx;
    let xl = Math.hypot(xx, xy, xz) || 1;
    xx /= xl; xy /= xl; xz /= xl;
    const yx = zy * xz - zz * xy;
    const yy = zz * xx - zx * xz;
    const yz = zx * xy - zy * xx;
    return new Float32Array([
      xx, yx, zx, 0,
      xy, yy, zy, 0,
      xz, yz, zz, 0,
      -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
      -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
      -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
      1
    ]);
  }

  function multiply(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
    }
    return o;
  }

  const VERT = `
    attribute vec3 aPos;
    attribute vec3 aNrm;
    attribute vec2 aUv;
    uniform mat4 uMvp;
    varying vec3 vN;
    varying vec3 vP;
    varying vec2 vUv;
    void main() {
      vN = aNrm;
      vP = aPos;
      vUv = aUv;
      gl_Position = uMvp * vec4(aPos, 1.0);
    }`;
  const FRAG = `
    precision mediump float;
    varying vec3 vN;
    varying vec3 vP;
    varying vec2 vUv;
    uniform sampler2D uTex;
    uniform vec3 uEye;
    uniform float uCloth;
    void main() {
      vec3 N = normalize(vN);
      vec3 L = normalize(vec3(-0.25, 0.72, 0.68));
      float nd = dot(N, L);
      float lit = clamp(nd, 0.0, 1.0);
      float back = clamp(-nd, 0.0, 1.0);
      vec3 albedo = uCloth > 0.5 ? texture2D(uTex, vUv).rgb : vec3(0.04, 0.09, 0.16);
      float weave = sin(vUv.x * 48.0 + vUv.y * 12.0);
      if (uCloth > 0.5) albedo *= 0.96 + 0.04 * weave;
      vec3 V = normalize(uEye - vP);
      vec3 H = normalize(L + V);
      float spec = pow(max(dot(N, H), 0.0), 28.0) * lit;
      float shade = 0.22 + lit * 0.78 + back * 0.28;
      vec3 color = albedo * shade + spec * (uCloth > 0.5 ? 0.2 : 0.35);
      float rim = pow(1.0 - max(dot(N, V), 0.0), 2.6);
      color += rim * vec3(0.55, 0.08, 0.16) * (uCloth > 0.5 ? 0.28 : 0.08);
      if (uCloth < 0.5) color = mix(color, vec3(0.965, 0.953, 0.925), smoothstep(0.92, 1.0, vUv.y) * 0.85);
      gl_FragColor = vec4(color, 1.0);
    }`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  function createFlag(canvas) {
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) return null;
    const hero = canvas.dataset.flag !== 'echo';
    const COLS = hero ? 36 : 26;
    const ROWS = hero ? 22 : 16;
    const N = COLS * ROWS;
    const FLY = 1.9;
    const HOIST = 1;
    const pos = new Float32Array(N * 3);
    const prev = new Float32Array(N * 3);
    const restX = new Float32Array(N);
    const restY = new Float32Array(N);
    const pin = new Uint8Array(N);
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const id = j * COLS + i;
        const x = (i / (COLS - 1)) * FLY;
        const y = (j / (ROWS - 1)) * HOIST;
        restX[id] = x;
        restY[id] = y;
        pos[id * 3] = x;
        pos[id * 3 + 1] = y;
        pos[id * 3 + 2] = 0;
        prev[id * 3] = x;
        prev[id * 3 + 1] = y;
        prev[id * 3 + 2] = 0;
        if (i === 0) pin[id] = 1;
      }
    }
    const links = [];
    const add = (a, b, slack) => {
      const dx = pos[a * 3] - pos[b * 3];
      const dy = pos[a * 3 + 1] - pos[b * 3 + 1];
      const dz = pos[a * 3 + 2] - pos[b * 3 + 2];
      links.push(a, b, Math.hypot(dx, dy, dz) * (slack || 1));
    };
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const id = j * COLS + i;
        if (i + 1 < COLS) add(id, id + 1);
        if (j + 1 < ROWS) add(id, id + COLS);
        if (i + 1 < COLS && j + 1 < ROWS) add(id, id + COLS + 1);
        if (i > 0 && j + 1 < ROWS) add(id, id + COLS - 1);
        if (i + 2 < COLS) add(id, id + 2, 1.02);
        if (j + 2 < ROWS) add(id, id + COLS * 2, 1.02);
      }
    }
    const linkA = links.filter((_, i) => i % 3 === 0);
    const linkB = links.filter((_, i) => i % 3 === 1);
    const linkL = links.filter((_, i) => i % 3 === 2);

    const triCount = (COLS - 1) * (ROWS - 1) * 2;
    const indices = new Uint16Array(triCount * 3);
    let t = 0;
    for (let j = 0; j < ROWS - 1; j++) {
      for (let i = 0; i < COLS - 1; i++) {
        const a = j * COLS + i;
        indices[t++] = a;
        indices[t++] = a + 1;
        indices[t++] = a + COLS;
        indices[t++] = a + 1;
        indices[t++] = a + COLS + 1;
        indices[t++] = a + COLS;
      }
    }

    const inter = new Float32Array(N * 8);
    const normals = new Float32Array(N * 3);

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const loc = {
      pos: gl.getAttribLocation(prog, 'aPos'),
      nrm: gl.getAttribLocation(prog, 'aNrm'),
      uv: gl.getAttribLocation(prog, 'aUv'),
      mvp: gl.getUniformLocation(prog, 'uMvp'),
      eye: gl.getUniformLocation(prog, 'uEye'),
      cloth: gl.getUniformLocation(prog, 'uCloth'),
      tex: gl.getUniformLocation(prog, 'uTex')
    };
    const buf = gl.createBuffer();
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, makeTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const pole = buildPole();
    const poleBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, poleBuf);
    gl.bufferData(gl.ARRAY_BUFFER, pole, gl.STATIC_DRAW);

    function step(time, settle) {
      const gust = settle ? 0.85 : (0.72 + 0.28 * Math.sin(time * 0.65) + 0.12 * Math.sin(time * 1.7));
      const windX = (hero ? 7.2 : 4.6) * gust;
      const windY = Math.sin(time * 1.15) * (hero ? 0.7 : 0.35);
      const windZ = (hero ? 2.4 : 1.3) * Math.sin(time * 0.85 + 0.4);
      const dt = 0.016;
      const damp = 0.992;
      for (let j = 0; j < ROWS; j++) {
        for (let i = 0; i < COLS; i++) {
          const id = j * COLS + i;
          if (pin[id]) continue;
          const o = id * 3;
          const u = i / (COLS - 1);
          const ripple = Math.sin(u * 9.0 - time * 3.2 + j * 0.35) * (0.35 + u);
          const ax = windX * (0.25 + u * u) + ripple * 0.15;
          const ay = -1.15 + windY * u;
          const az = windZ * u + ripple;
          const x = pos[o], y = pos[o + 1], z = pos[o + 2];
          const nx = x + (x - prev[o]) * damp + ax * dt * dt;
          const ny = y + (y - prev[o + 1]) * damp + ay * dt * dt;
          const nz = z + (z - prev[o + 2]) * damp + az * dt * dt;
          prev[o] = x; prev[o + 1] = y; prev[o + 2] = z;
          pos[o] = nx; pos[o + 1] = ny; pos[o + 2] = nz;
        }
      }
      for (let k = 0; k < (settle ? 8 : 5); k++) {
        for (let n = 0; n < linkA.length; n++) {
          const a = linkA[n] * 3;
          const b = linkB[n] * 3;
          let dx = pos[b] - pos[a];
          let dy = pos[b + 1] - pos[a + 1];
          let dz = pos[b + 2] - pos[a + 2];
          const dist = Math.hypot(dx, dy, dz) || 1;
          const diff = (dist - linkL[n]) / dist * 0.5;
          dx *= diff; dy *= diff; dz *= diff;
          const pa = pin[linkA[n]], pb = pin[linkB[n]];
          if (!pa) { pos[a] += dx; pos[a + 1] += dy; pos[a + 2] += dz; }
          if (!pb) { pos[b] -= dx; pos[b + 1] -= dy; pos[b + 2] -= dz; }
        }
        for (let id = 0; id < N; id++) {
          if (!pin[id]) continue;
          const o = id * 3;
          pos[o] = restX[id];
          pos[o + 1] = restY[id];
          pos[o + 2] = 0;
          prev[o] = pos[o];
          prev[o + 1] = pos[o + 1];
          prev[o + 2] = 0;
        }
      }
    }

    function upload() {
      normals.fill(0);
      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i], b = indices[i + 1], c = indices[i + 2];
        const ax = pos[a * 3], ay = pos[a * 3 + 1], az = pos[a * 3 + 2];
        const bx = pos[b * 3] - ax, by = pos[b * 3 + 1] - ay, bz = pos[b * 3 + 2] - az;
        const cx = pos[c * 3] - ax, cy = pos[c * 3 + 1] - ay, cz = pos[c * 3 + 2] - az;
        const nx = by * cz - bz * cy;
        const ny = bz * cx - bx * cz;
        const nz = bx * cy - by * cx;
        normals[a * 3] += nx; normals[a * 3 + 1] += ny; normals[a * 3 + 2] += nz;
        normals[b * 3] += nx; normals[b * 3 + 1] += ny; normals[b * 3 + 2] += nz;
        normals[c * 3] += nx; normals[c * 3 + 1] += ny; normals[c * 3 + 2] += nz;
      }
      for (let id = 0; id < N; id++) {
        let nx = normals[id * 3], ny = normals[id * 3 + 1], nz = normals[id * 3 + 2];
        const l = Math.hypot(nx, ny, nz) || 1;
        nx /= l; ny /= l; nz /= l;
        const o = id * 8;
        inter[o] = pos[id * 3];
        inter[o + 1] = pos[id * 3 + 1];
        inter[o + 2] = pos[id * 3 + 2];
        inter[o + 3] = nx;
        inter[o + 4] = ny;
        inter[o + 5] = nz;
        inter[o + 6] = id % COLS / (COLS - 1);
        inter[o + 7] = 1 - Math.floor(id / COLS) / (ROWS - 1);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, inter, gl.DYNAMIC_DRAW);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(2, canvas.clientWidth);
      const h = Math.max(2, canvas.clientHeight);
      const W = Math.floor(w * dpr);
      const H = Math.floor(h * dpr);
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    const eye = hero ? [1.15, 0.46, 2.35] : [1.25, 0.5, 2.7];
    function draw() {
      resize();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      const aspect = canvas.width / Math.max(1, canvas.height);
      const proj = perspective(0.62, aspect, 0.1, 20);
      const view = lookAt(eye, [0.95, 0.42, 0], [0, 1, 0]);
      const mvp = multiply(proj, view);
      gl.useProgram(prog);
      gl.uniformMatrix4fv(loc.mvp, false, mvp);
      gl.uniform3f(loc.eye, eye[0], eye[1], eye[2]);
      gl.uniform1i(loc.tex, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);

      gl.uniform1f(loc.cloth, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, poleBuf);
      gl.enableVertexAttribArray(loc.pos);
      gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(loc.nrm);
      gl.vertexAttribPointer(loc.nrm, 3, gl.FLOAT, false, 32, 12);
      gl.enableVertexAttribArray(loc.uv);
      gl.vertexAttribPointer(loc.uv, 2, gl.FLOAT, false, 32, 24);
      gl.drawArrays(gl.TRIANGLES, 0, pole.length / 8);

      upload();
      gl.uniform1f(loc.cloth, 1);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, 32, 0);
      gl.vertexAttribPointer(loc.nrm, 3, gl.FLOAT, false, 32, 12);
      gl.vertexAttribPointer(loc.uv, 2, gl.FLOAT, false, 32, 24);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    return { step, draw };
  }

  function buildPole() {
    const sides = 12;
    const y0 = -0.22;
    const y1 = 1.16;
    const r = 0.028;
    const x = -0.02;
    const verts = [];
    const push = (px, py, pz, nx, ny, nz, u, v) => {
      verts.push(px, py, pz, nx, ny, nz, u, v);
    };
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * Math.PI * 2;
      const a1 = ((i + 1) / sides) * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      push(x + c0 * r, y0, s0 * r, c0, 0, s0, 0, 0);
      push(x + c1 * r, y0, s1 * r, c1, 0, s1, 1, 0);
      push(x + c0 * r, y1, s0 * r, c0, 0, s0, 0, 1);
      push(x + c1 * r, y0, s1 * r, c1, 0, s1, 1, 0);
      push(x + c1 * r, y1, s1 * r, c1, 0, s1, 1, 1);
      push(x + c0 * r, y1, s0 * r, c0, 0, s0, 0, 1);
    }
    const br = 0.055;
    const by = 1.2;
    const lat = 6;
    const lon = 10;
    for (let j = 0; j < lat; j++) {
      const v0 = j / lat, v1 = (j + 1) / lat;
      const p0 = Math.PI * v0, p1 = Math.PI * v1;
      for (let i = 0; i < lon; i++) {
        const u0 = i / lon, u1 = (i + 1) / lon;
        const t0 = u0 * Math.PI * 2, t1 = u1 * Math.PI * 2;
        const quad = [[p0, t0], [p0, t1], [p1, t0], [p0, t1], [p1, t1], [p1, t0]];
        quad.forEach(([p, th]) => {
          const nx = Math.sin(p) * Math.cos(th);
          const ny = Math.cos(p);
          const nz = Math.sin(p) * Math.sin(th);
          push(x + nx * br, by + ny * br, nz * br, nx, ny, nz, 0, 1);
        });
      }
    }
    return new Float32Array(verts);
  }

  const scenes = canvases.map(createFlag).filter(Boolean);
  if (!scenes.length) return;

  if (reduced) {
    scenes.forEach(scene => {
      for (let i = 0; i < 140; i++) scene.step(i * 0.016, true);
      scene.draw();
    });
    window.addEventListener('resize', () => scenes.forEach(s => s.draw()));
    return;
  }

  let start = performance.now();
  const loop = now => {
    const time = (now - start) / 1000;
    scenes.forEach(scene => {
      scene.step(time, false);
      scene.draw();
    });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  mountSky();

  function mountSky() {
    document.querySelectorAll('.hero-art, .page-hero, .part-hero').forEach((host, index) => {
      if (host.querySelector('.night-sky')) return;
      const sky = document.createElement('div');
      sky.className = 'night-sky';
      sky.setAttribute('aria-hidden', 'true');
      sky.innerHTML = `
        <svg class="constellation" viewBox="0 0 240 140">
          <polyline points="18,96 52,70 88,84 126,46 168,62 206,28" />
          <circle cx="18" cy="96" r="1.4" />
          <circle cx="52" cy="70" r="1.2" />
          <circle cx="88" cy="84" r="1.6" />
          <circle cx="126" cy="46" r="1.3" />
          <circle cx="168" cy="62" r="1.1" />
          <circle cx="206" cy="28" r="1.7" />
        </svg>
        <i class="shooting-star" style="top:${12 + (index % 3) * 8}%; left:${8 + (index % 4) * 6}%; animation-delay:${index * 1.7}s"></i>
        <i class="shooting-star shooting-star-b" style="top:${28 + (index % 2) * 10}%; left:${40 + (index % 3) * 5}%; animation-delay:${3.2 + index}s"></i>`;
      host.appendChild(sky);
    });
  }
})();
