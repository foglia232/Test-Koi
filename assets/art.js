/* 极光夜插画：16 种类型 × 两种光（从容态 C：静谧的青紫极光；牵动态 T：起风的粉紫夜）
 * 全部为内联 SVG。换成画师的图时，把 app.js 里的 Art.type() 换成 <img> 即可。
 */
const Art = (() => {
  let uid = 0;
  const PAL = {
    C: { bg: ['#16133C', '#2A2461'], au: ['#5FE3D2', '#8D7BFF'], ln: ['#A6F1E6', '#C9BDFF', '#FFE3F1'], glow: '#9C8CFF', acc: '#BDF5EC' },
    T: { bg: ['#1A1035', '#3D1E55'], au: ['#FF77B0', '#8D6BFF'], ln: ['#FFB3D4', '#C9B6FF', '#FFE1A8'], glow: '#FF8FC0', acc: '#FFD2E6' }
  };

  function defs(s, id) {
    const p = PAL[s];
    return `<defs>
      <linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.bg[0]}"/><stop offset="1" stop-color="${p.bg[1]}"/></linearGradient>
      <linearGradient id="au${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.au[0]}" stop-opacity="0"/><stop offset=".35" stop-color="${p.au[0]}"/><stop offset=".7" stop-color="${p.au[1]}"/><stop offset="1" stop-color="${p.au[1]}" stop-opacity="0"/></linearGradient>
      <linearGradient id="ln${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.ln[0]}"/><stop offset=".5" stop-color="${p.ln[1]}"/><stop offset="1" stop-color="${p.ln[2]}"/></linearGradient>
      <linearGradient id="ac${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.ln[0]}" stop-opacity=".55"/><stop offset=".5" stop-color="${p.ln[1]}" stop-opacity=".35"/><stop offset="1" stop-color="${p.ln[2]}" stop-opacity=".55"/></linearGradient>
      <radialGradient id="gl${id}"><stop offset="0" stop-color="${p.glow}" stop-opacity=".55"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient>
      <filter id="bl${id}" filterUnits="userSpaceOnUse" x="-60" y="-60" width="520" height="420"><feGaussianBlur stdDeviation="16"/></filter>
      <filter id="gw${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>`;
  }

  function sky(s, id) {
    const calm = s === 'C';
    const ribbon = calm
      ? `<path d="M-20 120 C80 70 180 150 280 96 S400 80 430 104" stroke="url(#au${id})" stroke-width="46" fill="none" opacity=".42" filter="url(#bl${id})"/>
         <path d="M-20 160 C100 130 200 190 300 150 S400 140 430 150" stroke="url(#au${id})" stroke-width="22" fill="none" opacity=".25" filter="url(#bl${id})"/>`
      : `<path d="M-20 90 C60 150 140 40 230 120 S360 60 430 130" stroke="url(#au${id})" stroke-width="44" fill="none" opacity=".45" filter="url(#bl${id})"/>
         <path d="M-20 170 C90 120 170 210 270 150 S390 190 430 140" stroke="url(#au${id})" stroke-width="20" fill="none" opacity=".3" filter="url(#bl${id})"/>`;
    const st = calm
      ? [[54, 54, 1.4], [120, 34, 1], [330, 48, 1.6], [362, 196, 1.1], [36, 220, 1], [262, 30, 1]]
      : [[54, 54, 1.6], [120, 34, 1.1], [330, 48, 1.8], [362, 196, 1.3], [36, 220, 1.1], [262, 30, 1.1], [180, 60, 1], [300, 250, 1.2], [80, 290, .9]];
    let stars = st.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".8"/>`).join('');
    stars += calm
      ? `<path d="M304 214 l2.4 6 l6 2.4 l-6 2.4 l-2.4 6 l-2.4 -6 l-6 -2.4 l6 -2.4z" fill="#fff" opacity=".7"/>`
      : `<path d="M84 196 l2.4 6 l6 2.4 l-6 2.4 l-2.4 6 l-2.4 -6 l-6 -2.4 l6 -2.4z" fill="#fff" opacity=".75"/><path d="M318 110 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z" fill="#fff" opacity=".7"/>`;
    const ground = `<path d="M-10 352 Q200 318 410 352 V410 H-10Z" fill="#fff" opacity=".04"/><path d="M-10 352 Q200 318 410 352" stroke="url(#ln${id})" stroke-width="1.2" fill="none" opacity=".35"/>`;
    return `<rect width="400" height="400" fill="url(#bg${id})"/>${ribbon}${stars}${ground}`;
  }

  function wind(id) {
    const L = `stroke="url(#ln${id})" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"`;
    return `<path d="M36 128 q34 -14 68 0 q20 8 30 -4" ${L}/><path d="M268 96 q30 -12 60 0 q16 6 26 -4" ${L}/><path d="M292 262 q24 -10 48 0" ${L}/><path d="M50 250 q22 -9 44 0" ${L}/>`;
  }

  /* 物件：o(s, L, A, id)  L=发光描边  A=半透明点缀填充 */
  const OBJ = {
    sunflower(s, L, A) {
      let petals = '';
      for (let i = 0; i < 14; i++) petals += `<ellipse cx="200" cy="150" rx="11" ry="27" ${L} transform="rotate(${i * 360 / 14} 200 190)"/>`;
      return `<path d="M200 344 C196 300 206 266 200 222" ${L}/>
        <path d="M200 300 C172 280 150 288 138 300 C160 316 186 312 200 300Z" ${L}/><path d="M201 276 C228 256 250 262 262 272 C242 290 216 288 201 276Z" ${L}/>
        <g transform="rotate(${s === 'T' ? -16 : 0} 200 222)">${petals}<circle cx="200" cy="190" r="28" ${L} fill="url(#${A})"/><circle cx="200" cy="190" r="17" ${L} stroke-dasharray="2 5"/></g>`;
    },
    plane(s, L, A) {
      return `<path d="M98 316 C44 310 46 254 96 252 C128 251 126 288 98 284 C72 281 84 242 120 238" ${L} stroke-dasharray="5 9" opacity=".7"/>
        <g transform="rotate(${s === 'T' ? 10 : -4} 200 210)"><polygon points="308,148 108,206 206,206" ${L}/><polygon points="308,148 206,206 180,264" ${L} fill="url(#${A})"/><polyline points="206,206 172,230 180,264" ${L}/></g>`;
    },
    train(s, L, A) {
      let sl = ''; for (let x = 70; x <= 330; x += 26) sl += `<line x1="${x}" y1="322" x2="${x + 12}" y2="322" ${L} opacity=".5"/>`;
      return `${sl}<line x1="56" y1="316" x2="344" y2="316" ${L}/>
        <g ${L} opacity=".6"><circle cx="124" cy="172" r="11"/><circle cx="104" cy="148" r="15"/><circle cx="82" cy="118" r="19"/></g>
        <rect x="122" y="190" width="146" height="22" rx="10" ${L}/><rect x="110" y="208" width="172" height="90" rx="22" ${L}/>
        <rect x="130" y="224" width="32" height="28" rx="7" ${L} fill="url(#${A})"/><rect x="178" y="224" width="32" height="28" rx="7" ${L} fill="url(#${A})"/><rect x="226" y="224" width="32" height="28" rx="7" ${L}/>
        <line x1="110" y1="270" x2="282" y2="270" ${L}/><circle cx="288" cy="244" r="5" ${L} fill="url(#${A})"/>
        <circle cx="148" cy="304" r="13" ${L}/><circle cx="200" cy="304" r="13" ${L}/><circle cx="252" cy="304" r="13" ${L}/>`;
    },
    stream(s, L, A) {
      return `<polyline points="120,176 214,96 306,176" ${L}/><polyline points="194,113 214,96 234,113 214,122 194,113" ${L} fill="url(#${A})"/>
        <path d="M200 160 C140 196 262 222 182 268 C116 306 222 330 186 372" ${L}/>
        <path d="M232 160 C172 196 294 222 214 268 C148 306 254 330 218 372" ${L}/>
        <path d="M216 168 C158 202 278 226 198 270 C134 306 238 330 202 368" ${L} stroke-dasharray="6 14" opacity=".55"/>
        <ellipse cx="128" cy="232" rx="14" ry="7" ${L}/><ellipse cx="292" cy="282" rx="16" ry="8" ${L}/>
        <path d="M104 304 V258 M116 306 V266 M306 336 V296" ${L}/><ellipse cx="104" cy="258" rx="4" ry="10" ${L} fill="url(#${A})"/><ellipse cx="116" cy="266" rx="4" ry="9" ${L}/><ellipse cx="306" cy="296" rx="4" ry="9" ${L} fill="url(#${A})"/>`;
    },
    dove(s, L, A) {
      return `<g transform="translate(0 ${s === 'T' ? 8 : 0}) rotate(${s === 'T' ? -6 : 0} 210 210)">
        <polygon points="126,214 78,194 92,230" ${L}/>
        <path d="M120 215 C140 170 230 160 270 190 C290 205 282 240 240 250 C190 262 140 250 120 215Z" ${L}/>
        <circle cx="272" cy="182" r="22" ${L}/><circle cx="280" cy="178" r="2.6" fill="#fff"/><polyline points="293,182 312,188 293,193" ${L}/>
        <path d="M166 206 C184 148 244 136 256 168 C242 202 208 222 166 206Z" ${L} fill="url(#${A})"/>
        <path d="M200 254 L196 276 M222 252 V276" ${L}/>
        <g transform="rotate(${s === 'T' ? 16 : 4} 314 212)"><rect x="292" y="198" width="44" height="30" rx="3" ${L}/><polyline points="292,198 314,214 336,198" ${L}/>
        <path d="M314 220 c-4 -5 -10 -1 -7 4 l7 6 l7 -6 c3 -5 -3 -9 -7 -4z" ${L} fill="url(#${A})"/></g></g>`;
    },
    bottle(s, L, A) {
      return `<path d="M0 300 Q50 286 100 300 T200 300 T300 300 T400 300" ${L} opacity=".6"/>
        <g transform="rotate(${s === 'T' ? -28 : -10} 210 254)">
          <rect x="138" y="220" width="122" height="62" rx="28" ${L}/><path d="M258 236 H284 a4 4 0 0 1 4 4 V262 a4 4 0 0 1 -4 4 H258" ${L}/>
          <rect x="288" y="238" width="16" height="22" rx="4" ${L} fill="url(#${A})"/>
          <rect x="162" y="236" width="78" height="30" rx="10" ${L} fill="url(#${A})"/><line x1="201" y1="236" x2="201" y2="266" ${L}/>
          <path d="M156 232 q12 -6 26 -4" ${L} opacity=".6"/></g>
        <path d="M0 322 Q50 306 100 322 T200 322 T300 322 T400 322" ${L}/><path d="M30 344 q20 -8 40 0 M250 346 q24 -8 48 0" ${L} opacity=".5"/>`;
    },
    compass(s, L, A) {
      let ticks = '';
      for (let i = 0; i < 24; i++) {
        const a = i * 15 * Math.PI / 180, big = i % 6 === 0, r1 = big ? 64 : 72;
        ticks += `<line x1="${(200 + r1 * Math.sin(a)).toFixed(1)}" y1="${(222 - r1 * Math.cos(a)).toFixed(1)}" x2="${(200 + 80 * Math.sin(a)).toFixed(1)}" y2="${(222 - 80 * Math.cos(a)).toFixed(1)}" ${L} ${big ? '' : 'opacity=".5"'}/>`;
      }
      return `<circle cx="200" cy="112" r="11" ${L}/><circle cx="200" cy="222" r="98" ${L}/><circle cx="200" cy="222" r="88" ${L} opacity=".5"/>${ticks}
        <g transform="rotate(${s === 'T' ? 28 : 0} 200 222)"><polygon points="200,152 212,222 188,222" ${L} fill="url(#${A})"/><polygon points="200,292 212,222 188,222" ${L}/></g>
        <circle cx="200" cy="222" r="6" ${L} fill="url(#${A})"/>`;
    },
    swallow(s, L, A) {
      return `<path d="M128 306 Q200 372 272 306" ${L}/><line x1="96" y1="306" x2="304" y2="306" ${L}/>
        <path d="M152 318 q14 8 28 0 M190 332 q14 8 28 0 M224 318 q12 7 24 0" ${L} opacity=".5"/>
        <g transform="translate(0 ${s === 'T' ? -12 : 0}) rotate(${s === 'T' ? -8 : 0} 210 205)">
        <path d="M205 196 Q150 140 84 150 Q140 182 190 213Z" ${L}/>
        <path d="M174 212 L116 252 L158 222 L130 270 L182 224" ${L}/>
        <ellipse cx="210" cy="205" rx="42" ry="17" ${L} transform="rotate(-10 210 205)"/>
        <ellipse cx="214" cy="212" rx="28" ry="6" ${L} fill="url(#${A})" transform="rotate(-10 214 212)"/>
        <circle cx="250" cy="195" r="14" ${L}/><circle cx="255" cy="191" r="2.2" fill="#fff"/><polyline points="263,192 277,195 263,199" ${L}/>
        <path d="M216 196 Q270 128 332 126 Q276 170 228 211" ${L} fill="url(#${A})"/></g>`;
    },
    chime(s, L, A) {
      const t = s === 'T' ? 18 : 2;
      return `<line x1="200" y1="70" x2="200" y2="128" ${L}/>
        <g transform="rotate(${t / 3} 200 128)">
        <path d="M150 204 C150 150 172 128 200 128 C228 128 250 150 250 204" ${L} fill="url(#${A})"/><ellipse cx="200" cy="204" rx="50" ry="8" ${L}/>
        <path d="M176 166 l8 -4 M212 182 l8 4 M194 150 l6 0" ${L}/>
        <g transform="rotate(${t} 200 206)"><line x1="200" y1="206" x2="200" y2="262" ${L}/><circle cx="200" cy="216" r="6" ${L}/>
        <rect x="182" y="262" width="36" height="84" rx="3" ${L}/><path d="M192 282 H208 M192 296 H204" ${L} opacity=".6"/></g></g>`;
    },
    candle(s, L, A, id) {
      return `<ellipse cx="200" cy="320" rx="74" ry="12" ${L}/>
        <path d="M172 316 V222 a6 6 0 0 1 6 -6 H222 a6 6 0 0 1 6 6 V316" ${L}/>
        <path d="M172 238 q7 18 13 0 q5 26 12 1 q6 12 12 -1" ${L}/><path d="M200 216 V200" ${L}/>
        <g transform="rotate(${s === 'T' ? 20 : 0} 200 206)">
          <path d="M200 132 C224 166 228 190 200 206 C172 190 176 166 200 132Z" ${L} fill="url(#${A})"/>
          <path d="M200 162 C209 177 210 192 200 200 C190 192 191 177 200 162Z" ${L}/></g>`;
    },
    harbor(s, L, A) {
      return `<path d="M0 300 H400" ${L} opacity=".6"/><path d="M30 326 h44 M226 344 h64 M318 318 h36" ${L} opacity=".45"/>
        <line x1="56" y1="262" x2="206" y2="262" ${L}/><path d="M74 262 V336 M116 262 V336 M158 262 V336 M196 262 V336" ${L}/>
        <line x1="194" y1="196" x2="194" y2="262" ${L}/><circle cx="194" cy="190" r="9" ${L} fill="url(#${A})"/>
        <g transform="translate(${s === 'T' ? 40 : 0} ${s === 'T' ? 4 : 0}) rotate(${s === 'T' ? 6 : 0} 292 300)">
        <path d="M240 292 H344 L328 316 H256Z" ${L}/><line x1="292" y1="292" x2="292" y2="206" ${L}/>
        <polygon points="296,212 296,286 342,286" ${L} fill="url(#${A})"/><polygon points="288,224 288,286 252,286" ${L}/></g>`;
    },
    birds(s, L) {
      const V = (x, y, k) => `<path d="M${x - 22 * k} ${y} Q${x - 11 * k} ${y - 14 * k} ${x} ${y} Q${x + 11 * k} ${y - 14 * k} ${x + 22 * k} ${y}" ${L} stroke-width="${(2.6 * Math.min(k, 1.6)).toFixed(1)}"/>`;
      const dy = s === 'T' ? 16 : 0;
      return `<path d="M0 326 Q100 296 200 318 T400 302" ${L} opacity=".7"/>
        <g transform="translate(0 ${dy})">${V(204, 162, 2.4)}${V(138, 202, 1.6)}${V(270, 206, 1.6)}${V(90, 240, 1.1)}${V(318, 248, 1.1)}</g>
        ${s === 'T' ? V(342, 140, .7) : ''}`;
    },
    shell(s, L, A, id) {
      let ribs = '';
      for (let i = 1; i < 8; i++) { const a = (-56 + i * 14) * Math.PI / 180; ribs += `<line x1="200" y1="298" x2="${(200 + 140 * Math.sin(a)).toFixed(1)}" y2="${(298 - 140 * Math.cos(a)).toFixed(1)}" ${L} opacity=".7"/>`; }
      return `<defs><clipPath id="sc${id}"><path d="M200 300 L112 252 C110 180 150 140 200 138 C250 140 290 180 288 252Z"/></clipPath></defs>
        <path d="M200 300 L112 252 C110 180 150 140 200 138 C250 140 290 180 288 252Z" ${L} fill="url(#${A})" fill-opacity=".5"/>
        <g clip-path="url(#sc${id})">${ribs}</g>
        <polygon points="182,298 168,318 232,318 218,298" ${L}/>
        <circle cx="300" cy="306" r="12" ${L} fill="url(#${A})"/>`;
    },
    moon(s, L, A, id) {
      return `<circle cx="200" cy="200" r="128" ${L} stroke-dasharray="2 10" opacity=".55"/>
        <g transform="rotate(${s === 'T' ? -12 : 0} 200 200)"><path d="M232 114 A88 88 0 1 0 288 232 A74 74 0 1 1 232 114Z" ${L} fill="url(#${A})"/>
        <circle cx="160" cy="214" r="8" ${L} opacity=".6"/><circle cx="178" cy="254" r="5" ${L} opacity=".6"/></g>
        <path d="M92 314 q18 -20 46 -10 q14 -18 38 -6 q24 -4 28 16 H92Z" ${L} ${s === 'T' ? 'transform="translate(30 -6)"' : ''}/>`;
    },
    lighthouse(s, L, A) {
      const beam = s === 'T' ? '.22' : '.12';
      return `<polygon points="200,150 30,108 30,194" fill="url(#${A})" opacity="${beam}"/><polygon points="200,150 370,108 370,194" fill="url(#${A})" opacity="${beam}"/>
        <path d="M100 344 Q140 300 200 304 Q262 300 300 344" ${L}/>
        <polygon points="172,306 228,306 218,176 182,176" ${L}/><path d="M176 268 H224 M178 240 H222 M180 212 H220" ${L} opacity=".6"/>
        <rect x="192" y="284" width="16" height="22" rx="8" ${L}/>
        <rect x="174" y="164" width="52" height="12" rx="2" ${L}/><rect x="184" y="132" width="32" height="32" ${L} fill="url(#${A})"/>
        <polygon points="178,132 222,132 200,106" ${L}/>`;
    },
    cat(s, L, A) {
      const ey = s === 'T' ? 10 : 7;
      return `<path d="M248 322 C306 322 314 266 284 252" ${L}/>
        <path d="M150 330 C138 262 160 216 200 216 C240 216 262 262 250 330Z" ${L}/>
        <path d="M186 248 Q200 300 214 248" ${L} opacity=".5"/>
        <polyline points="160,150 156,104 190,134" ${L}/><polyline points="240,150 244,104 210,134" ${L}/>
        <circle cx="200" cy="180" r="46" ${L}/>
        <ellipse cx="182" cy="178" rx="8" ry="${ey}" ${L} fill="url(#${A})"/><ellipse cx="218" cy="178" rx="8" ry="${ey}" ${L} fill="url(#${A})"/>
        <path d="M195 196 h10 l-5 6z" ${L}/><path d="M200 202 q-6 8 -12 4 M200 202 q6 8 12 4" ${L}/>
        <path d="M166 196 L140 190 M166 204 L140 206 M234 196 L260 190 M234 204 L260 206" ${L} opacity=".6"/>
        <ellipse cx="182" cy="330" rx="16" ry="7" ${L}/><ellipse cx="218" cy="330" rx="16" ry="7" ${L}/>`;
    }
  };

  function layers(art, state) {
    const s = state === 'T' ? 'T' : 'C', id = 'a' + (++uid);
    const L = `stroke="url(#ln${id})"`;
    return `${defs(s, id)}${sky(s, id)}
      <circle cx="200" cy="205" r="120" fill="url(#gl${id})"/>
      ${s === 'T' ? wind(id) : ''}
      <g filter="url(#gw${id})" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${OBJ[art](s, L, 'ac' + id, id)}</g>`;
  }
  function type(art, state, attrs = '') {
    return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img" ${attrs}>${layers(art, state)}</svg>`;
  }
  return { type, inner: layers };
})();
