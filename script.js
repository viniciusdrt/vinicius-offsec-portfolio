(() => {
  "use strict";

  const root = document.documentElement;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  /* ---------- Armazenamento tolerante a bloqueio ---------- */
  const store = {
    get(area, key) {
      try {
        return window[area].getItem(key);
      } catch {
        return null;
      }
    },
    set(area, key, value) {
      try {
        window[area].setItem(key, value);
      } catch {
        /* preferência fica só nesta página */
      }
    }
  };

  /* ---------- Estado de movimento ---------- */
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const savedMotion = store.get("localStorage", "offsec-motion");
  let motionOn = savedMotion ? savedMotion === "on" : !reducedMotion.matches;

  root.classList.add("js");
  root.dataset.motion = motionOn ? "on" : "off";

  const introSeen = store.get("sessionStorage", "offsec-intro") === "1";
  const playIntro = motionOn && !introSeen;
  if (!playIntro) {
    root.classList.add("no-intro");
  }

  /* ---------- Atlas de glifos: desenhar uma vez, copiar sempre ---------- */
  const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const RAIN_FONT = '"VT323", "MS Gothic", "Yu Gothic", "Noto Sans Mono CJK JP", monospace';

  function createAtlas(cell, colors, scale = 1) {
    const size = Math.ceil(cell * scale);
    const atlas = document.createElement("canvas");
    atlas.width = GLYPHS.length * size;
    atlas.height = colors.length * size;

    const ctx = atlas.getContext("2d");
    ctx.font = `400 ${Math.floor(size * 0.95)}px ${RAIN_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    colors.forEach((color, row) => {
      ctx.fillStyle = color;
      Array.from(GLYPHS).forEach((glyph, index) => {
        ctx.fillText(glyph, (index + 0.5) * size, (row + 0.5) * size);
      });
    });

    return { canvas: atlas, size };
  }

  const randomGlyph = () => Math.floor(Math.random() * GLYPHS.length);

  /* ---------- Chuva digital ---------- */
  const rain = (() => {
    const canvas = $("#matrix-canvas");
    const ctx = canvas ? canvas.getContext("2d", { alpha: false }) : null;
    const CELL = 16;
    const FRAME_MS = 1000 / 30;
    const TIERS = [
      { row: 1, speed: 1 },
      { row: 2, speed: 0.62 },
      { row: 3, speed: 0.36 }
    ];

    let atlas = null;
    let columns = [];
    let stride = 1;
    let rafId = 0;
    let running = false;
    let lastFrame = 0;
    let slowFrames = 0;
    let lastWidth = 0;

    function build() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      lastWidth = width;
      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);

      const total = Math.ceil(width / CELL);
      const rows = Math.ceil(height / CELL);
      columns = [];
      for (let index = 0; index < total; index += stride) {
        columns.push({
          x: index * CELL,
          y: -Math.floor(Math.random() * rows),
          progress: 0,
          tier: TIERS[Math.floor(Math.random() * TIERS.length)]
        });
      }
    }

    function tick() {
      const { canvas: sheet, size } = atlas;
      ctx.fillStyle = "rgba(0, 0, 0, 0.085)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const column of columns) {
        column.progress += column.tier.speed;
        if (column.progress < 1) {
          continue;
        }
        column.progress -= 1;

        if (column.y >= 0) {
          ctx.drawImage(sheet, randomGlyph() * size, column.tier.row * size, size, size, column.x, column.y * CELL, CELL, CELL);
        }
        column.y += 1;
        if (column.y >= 0) {
          ctx.drawImage(sheet, randomGlyph() * size, 0, size, size, column.x, column.y * CELL, CELL, CELL);
        }

        if (column.y * CELL > canvas.height && Math.random() > 0.97) {
          column.y = -Math.floor(Math.random() * 12);
          column.tier = TIERS[Math.floor(Math.random() * TIERS.length)];
        }
      }
    }

    function loop(now) {
      if (!running) {
        return;
      }
      rafId = window.requestAnimationFrame(loop);

      const elapsed = now - lastFrame;
      if (elapsed < FRAME_MS - 2) {
        return;
      }

      /* Aparelho lento: metade das colunas em vez de travar a página. */
      slowFrames = elapsed > 60 && elapsed < 500 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
      if (slowFrames > 30 && stride === 1) {
        stride = 2;
        slowFrames = 0;
        build();
      }

      lastFrame = now;
      tick();
    }

    function drawStill() {
      for (let step = 0; step < 90; step += 1) {
        tick();
      }
    }

    return {
      init() {
        if (!ctx) {
          return;
        }
        atlas = createAtlas(CELL, ["#dcffe6", "#00ff41", "#00b82f", "#067a24"]);
        build();

        let resizeTimer = 0;
        window.addEventListener("resize", () => {
          /* A barra de endereço do celular muda só a altura: não reinicia a chuva. */
          if (window.innerWidth === lastWidth && window.innerHeight <= canvas.height) {
            return;
          }
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(() => {
            build();
            if (!running) {
              drawStill();
            }
          }, 180);
        });
      },
      start() {
        if (!ctx || running) {
          return;
        }
        running = true;
        lastFrame = 0;
        rafId = window.requestAnimationFrame(loop);
      },
      stop() {
        running = false;
        window.cancelAnimationFrame(rafId);
      },
      drawStill() {
        if (ctx && atlas) {
          drawStill();
        }
      }
    };
  })();

  /* ---------- Abertura: a chuva trava nas letras do nome ---------- */
  const INTRO_SAFETY_MS = 2400; /* igual ao atraso do CSS, que revela o título mesmo se o JS falhar */
  const LOCK_FILL_MS = 1000;
  const LOCK_HOLD_MS = 250;

  async function runTitleLock() {
    const wrap = $(".title-wrap");
    const canvas = $("#title-rain");
    if (!wrap || !canvas) {
      return;
    }

    root.classList.add("rain-loud");
    const titleSpans = $$(".glitch-title .hologram-text");
    const finish = () => {
      root.classList.remove("rain-loud");
      canvas.classList.add("done");
      /* Adianta o fade do CSS para o texto real surgir junto com a saída do canvas. */
      titleSpans.forEach((span) => {
        span.getAnimations()
          .filter((animation) => animation.animationName === "title-resolve" && animation.currentTime < INTRO_SAFETY_MS)
          .forEach((animation) => {
            animation.currentTime = INTRO_SAFETY_MS;
          });
      });
      store.set("sessionStorage", "offsec-intro", "1");
      window.setTimeout(() => {
        canvas.remove();
        /* Sai a regra de entrada: um glitch posterior não pode reiniciar o fade. */
        root.classList.add("no-intro");
      }, 600);
    };

    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => window.setTimeout(resolve, 900))
      ]);
    } catch {
      /* segue com a fonte disponível */
    }

    if (performance.now() > INTRO_SAFETY_MS - 600) {
      finish();
      return;
    }

    const box = wrap.getBoundingClientRect();
    const width = Math.ceil(box.width);
    const height = Math.ceil(box.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const mask = document.createElement("canvas");
    mask.width = width;
    mask.height = height;
    const maskCtx = mask.getContext("2d", { willReadFrequently: true });
    let fontSize = 0;

    titleSpans.forEach((span, index) => {
      const range = document.createRange();
      range.selectNodeContents(span);
      const rect = range.getBoundingClientRect();
      const style = window.getComputedStyle(span);
      fontSize = parseFloat(style.fontSize);

      maskCtx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      if ("letterSpacing" in maskCtx) {
        maskCtx.letterSpacing = style.letterSpacing;
      }
      const metrics = maskCtx.measureText("Hg");
      const ascent = metrics.fontBoundingBoxAscent;
      const descent = metrics.fontBoundingBoxDescent;
      const baseline = rect.top - box.top + (rect.height - (ascent + descent)) / 2 + ascent;

      maskCtx.fillStyle = index === 0 ? "#ffffff" : "#00ff00";
      maskCtx.fillText(span.textContent, rect.left - box.left, baseline);
    });

    const cell = Math.max(5, Math.round(fontSize / 26));
    const pixels = maskCtx.getImageData(0, 0, width, height).data;
    const columns = [];
    const rowCount = Math.ceil(height / cell);

    for (let col = 0; col * cell < width; col += 1) {
      const cells = [];
      for (let row = 0; row < rowCount; row += 1) {
        const x = Math.min(width - 1, col * cell + (cell >> 1));
        const y = Math.min(height - 1, row * cell + (cell >> 1));
        const offset = (y * width + x) * 4;
        if (pixels[offset + 3] > 110) {
          cells.push({ row, ink: pixels[offset] > 128 ? 1 : 2, glyph: randomGlyph() });
        }
      }
      if (cells.length) {
        columns.push({
          x: col * cell,
          cells,
          delay: Math.random() * 400,
          speed: rowCount / (LOCK_FILL_MS - 400 - Math.random() * 150)
        });
      }
    }

    canvas.width = Math.ceil(width * dpr);
    canvas.height = Math.ceil(height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const atlas = createAtlas(cell, ["#ffffff", "#eafff0", "#00ff41"], dpr);
    const startedAt = performance.now();

    function draw(now) {
      const elapsed = now - startedAt;
      if (elapsed >= LOCK_FILL_MS + LOCK_HOLD_MS) {
        finish();
        return;
      }
      window.requestAnimationFrame(draw);

      ctx.clearRect(0, 0, width, height);

      for (const column of columns) {
        const head = (elapsed - column.delay) * column.speed;
        if (head < 0) {
          continue;
        }
        for (const item of column.cells) {
          if (item.row > head) {
            break;
          }
          if (Math.random() < 0.03) {
            item.glyph = randomGlyph();
          }
          ctx.drawImage(atlas.canvas, item.glyph * atlas.size, item.ink * atlas.size, atlas.size, atlas.size, column.x, item.row * cell, cell, cell);
        }
        if (head < rowCount) {
          ctx.drawImage(atlas.canvas, randomGlyph() * atlas.size, 0, atlas.size, atlas.size, column.x, Math.floor(head) * cell, cell, cell);
        }
      }
    }

    window.requestAnimationFrame(draw);
  }

  /* ---------- Glitch no nome ---------- */
  function startGlitch() {
    const targets = $$(".hologram-text");
    const trigger = (target) => {
      if (!motionOn || !root.classList.contains("no-intro") || target.classList.contains("glitching")) {
        return;
      }
      target.classList.add("glitching");
      window.setTimeout(() => target.classList.remove("glitching"), 440);
    };

    const schedule = () => {
      window.setTimeout(() => {
        if (!document.hidden) {
          trigger(targets[Math.floor(Math.random() * targets.length)]);
        }
        schedule();
      }, 4500 + Math.random() * 5000);
    };

    targets.forEach((target) => {
      target.addEventListener("pointerenter", () => trigger(target));
    });
    window.setTimeout(schedule, playIntro ? INTRO_SAFETY_MS + 1200 : 1500);
  }

  /* ---------- Decodificação de títulos ---------- */
  const scrambles = new Map();

  function cancelScrambles() {
    scrambles.forEach(({ frame, finalText }, element) => {
      window.cancelAnimationFrame(frame);
      element.textContent = finalText;
    });
    scrambles.clear();
  }

  function scrambleText(element) {
    if (!element || !motionOn) {
      return;
    }

    /* Um título já em decodificação mantém o texto final original. */
    const running = scrambles.get(element);
    const finalText = running ? running.finalText : element.textContent;
    if (running) {
      window.cancelAnimationFrame(running.frame);
    }

    const duration = 420;
    const startedAt = performance.now();
    const pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_#/";

    const step = (now) => {
      const progress = Math.min(1, Math.max(0, (now - startedAt) / duration));
      const revealed = Math.floor(progress * finalText.length);
      let text = finalText.slice(0, revealed);
      for (let index = revealed; index < finalText.length; index += 1) {
        text += pool[Math.floor(Math.random() * pool.length)];
      }
      element.textContent = text;

      if (progress < 1) {
        scrambles.set(element, { frame: window.requestAnimationFrame(step), finalText });
      } else {
        element.textContent = finalText;
        scrambles.delete(element);
      }
    };

    scrambles.set(element, { frame: window.requestAnimationFrame(step), finalText });
  }

  /* ---------- Mira ---------- */
  function initCrosshair() {
    const crosshair = $("#crosshair");
    if (!crosshair || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    root.classList.add("has-crosshair");

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    window.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) {
        frame = window.requestAnimationFrame(() => {
          crosshair.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
          frame = 0;
        });
      }
    }, { passive: true });

    document.addEventListener("pointerover", (event) => {
      const over = Boolean(event.target.closest && event.target.closest(".clickable"));
      crosshair.classList.toggle("visible", over);
      crosshair.classList.toggle("active", over);
    }, { passive: true });

    root.addEventListener("pointerleave", () => {
      crosshair.classList.remove("visible", "active");
    });
  }

  /* ---------- Transição ---------- */
  const transitionOverlay = $("#transition-overlay");
  let pendingSwap = null;
  let swapTimer = 0;
  let clearTimer = 0;

  function showTransition(callback) {
    window.clearTimeout(swapTimer);
    window.clearTimeout(clearTimer);
    if (pendingSwap) {
      pendingSwap();
      pendingSwap = null;
    }

    if (!motionOn || !transitionOverlay) {
      callback();
      if (transitionOverlay) {
        transitionOverlay.classList.remove("active");
      }
      return;
    }

    transitionOverlay.classList.add("active");
    pendingSwap = callback;
    swapTimer = window.setTimeout(() => {
      pendingSwap = null;
      callback();
    }, 150);
    clearTimer = window.setTimeout(() => {
      transitionOverlay.classList.remove("active");
    }, 400);
  }

  /* ---------- Traduções ---------- */
  const translations = {
    pt: {
      pageTitle: "Vinícius OffSec | Portfólio de Cibersegurança",
      pageDescription: "Portfólio de Vinícius: estudante de Ciência da Computação e estagiário de NOC, com foco em segurança ofensiva, pentest web, análise de vulnerabilidades e automação.",

      skipLink: "Pular para o conteúdo",
      navLabel: "Principal",
      langLabel: "Idioma",
      sessionLabel: "Sessão do terminal",
      menuLabel: "Seções",
      cvLabel: "Currículo",
      motionPause: "Pausar animações",
      motionResume: "Retomar animações",
      heroCta: "Abrir o terminal",
      footerSource: "Código-fonte no GitHub",

      statStatus: "Status",
      statClock: "Hora local",
      statUptime: "Sessão",
      statCommands: "Comandos",

      shellLocal: "sessão local, nada é enviado",
      shellOutputLabel: "Saída do terminal",
      shellInputLabel: "Comando do terminal",

      heroTag: "VULNERABILIDADE ENCONTRADA…",
      heroStatus: "Disponível para oportunidades",

      rootTitle: "ROOT_ACCESS",
      rootText1: "Bem-vindo ao meu portfólio OffSec. Aqui você encontra meu perfil, habilidades técnicas, projetos e formas de contato em uma interface inspirada em terminal cyber.",
      rootText2: "Atuo com monitoramento de redes e infraestrutura em NOC e continuo me desenvolvendo em segurança ofensiva, análise de vulnerabilidades e automação.",

      cvProfileTitle: "PROFESSIONAL_SUMMARY",
      cvProfileText1: "Estudante de Ciência da Computação e estagiário em Monitoramento de Redes (NOC) na IPV7.",
      cvProfileText2: "Experiência prática com monitoramento, triagem de incidentes, infraestrutura e troubleshooting, aliada a estudos em segurança ofensiva, análise de vulnerabilidades e automação.",

      cvSkillsTitle: "TECHNICAL_CAPABILITIES",
      cvArsenalTitle: "CYBER_SECURITY_ARSENAL",

      cvExperienceTitle: "WORK_HISTORY",
      cvExperienceRole: "Estagiário em Monitoramento de Redes (NOC)",
      cvExperienceDate: "JUN 2026 — ATUAL",
      cvExperienceItems: [
        "Monitoramento de equipamentos e serviços de rede, incluindo roteadores, switches, OLTs e servidores.",
        "Identificação e triagem de alarmes e incidentes de infraestrutura.",
        "Testes de conectividade e troubleshooting inicial utilizando ping e traceroute.",
        "Registro e acompanhamento de chamados operacionais.",
        "Apoio às rotinas técnicas do NOC e colaboração com o time de infraestrutura."
      ],

      cvAcademicTitle: "EDUCATION",
      cvAcademicText1: "Ciência da Computação — UniCEUB",
      cvAcademicText2: "Estudos voltados para segurança, programação, redes e infraestrutura.",

      repositoriesTitle: "PROJECT_REPOSITORIES",
      repoJavaTitle: "Estudos Java",
      repoJavaText: "POO, sintaxe, lógica e fundamentos backend.",
      repoPythonTitle: "Estudos Python",
      repoPythonText: "Lógica, automação e base para ferramentas de segurança.",
      repoCamscanTitle: "camscan",
      repoCamscanText: "Scanner automatizado de vulnerabilidades em câmeras IP de redes locais.",
      repoMalwareTitle: "malware-detection-tool",
      repoMalwareText: "Projeto no GitHub para detecção de malware.",

      contactTitle: "SECURE_COMMUNICATION_UPLINK",
      contactEmailTitle: "EMAIL_RELAY",

      skill8: "Redes",

      sh: {
        banner: "Terminal simulado no seu navegador.",
        bannerHint: "Digite help para ver os comandos, ou use as sugestões abaixo.",
        helpTitle: "Comandos disponíveis",
        help: {
          help: "mostra esta lista",
          whoami: "quem é o dono desta sessão",
          ls: "lista arquivos: ls [pasta]",
          cd: "muda de pasta: cd projects",
          cat: "lê um arquivo: cat profile.txt",
          pwd: "mostra a pasta atual",
          open: "abre uma seção ou link: open cv, open skills, open github",
          lang: "troca o idioma: lang en",
          rain: "liga ou desliga as animações: rain off",
          neofetch: "resumo do sistema",
          nmap: "varredura simulada: nmap localhost",
          "uname -a": "versão do sistema",
          date: "data e hora locais",
          history: "comandos usados nesta sessão",
          clear: "limpa a tela (Ctrl+L)"
        },
        notFound: (name) => `comando não encontrado: ${name}. Digite help para ver os comandos.`,
        noSuchPath: (name) => `${name}: arquivo ou pasta não encontrados. Use ls para ver o que existe aqui.`,
        isDir: (name) => `${name}: é uma pasta. Use cd ${name} ou ls ${name}.`,
        notDir: (name) => `${name}: não é uma pasta. Use cat ${name}.`,
        catUsage: "Informe um arquivo: cat profile.txt",
        openUsage: "Informe o destino: open root | cv | skills | arsenal | experience | academic | repositories | contact | github | linkedin | email",
        openUnknown: (name) => `${name}: destino desconhecido. Digite open para ver as opções.`,
        opened: (name) => `Painel ${name} aberto.`,
        openedLink: "Abrindo em nova aba:",
        langUsage: "Use lang pt ou lang en.",
        langChanged: "Idioma alterado para português.",
        rainOn: "Animações ligadas.",
        rainOff: "Animações pausadas.",
        rainUsage: "Use rain on ou rain off.",
        sudo: "vinicius não está no arquivo sudoers. Este incidente será registrado.",
        readOnly: "Permissão negada: sistema de arquivos somente leitura.",
        exit: "Não dá para fechar esta sessão, mas você pode rolar a página e continuar navegando.",
        nmapStart: (target) => `Iniciando varredura simulada em ${target}. Nenhum pacote foi enviado.`,
        nmapScope: (target) => `${target}: fora do escopo. Só faço varredura com autorização; use nmap localhost.`,
        nmapDone: "Varredura concluída: 3 serviços abertos.",
        whoami: "vinicius, estudante de Ciência da Computação e estagiário de NOC, com foco em segurança ofensiva.",
        neofetchHost: "Hospedagem",
        neofetchLang: "Idioma",
        neofetchScreen: "Tela",
        neofetchUptime: "Sessão",
        neofetchFocus: "Foco",
        neofetchFocusValue: "OffSec, pentest web, automação"
      }
    },

    en: {
      pageTitle: "Vinícius OffSec | Cybersecurity Portfolio",
      pageDescription: "Portfolio of Vinícius: Computer Science student and NOC intern focused on offensive security, web pentesting, vulnerability analysis, and automation.",

      skipLink: "Skip to content",
      navLabel: "Main",
      langLabel: "Language",
      sessionLabel: "Terminal session",
      menuLabel: "Sections",
      cvLabel: "Résumé",
      motionPause: "Pause animations",
      motionResume: "Resume animations",
      heroCta: "Open the terminal",
      footerSource: "Source code on GitHub",

      statStatus: "Status",
      statClock: "Local time",
      statUptime: "Session",
      statCommands: "Commands",

      shellLocal: "local session, nothing is sent",
      shellOutputLabel: "Terminal output",
      shellInputLabel: "Terminal command",

      heroTag: "VULNERABILITY DETECTED…",
      heroStatus: "Open to Opportunities",

      rootTitle: "ROOT_ACCESS",
      rootText1: "Welcome to my OffSec portfolio. Here you will find my profile, technical skills, projects, and contact channels in an interface inspired by a cyber terminal.",
      rootText2: "I work with network and infrastructure monitoring in a NOC while continuing to develop my skills in offensive security, vulnerability analysis, and automation.",

      cvProfileTitle: "PROFESSIONAL_SUMMARY",
      cvProfileText1: "Computer Science student and Network Monitoring Intern (NOC) at IPV7.",
      cvProfileText2: "Hands-on experience in monitoring, incident triage, infrastructure, and troubleshooting, combined with studies in offensive security, vulnerability analysis, and automation.",

      cvSkillsTitle: "TECHNICAL_CAPABILITIES",
      cvArsenalTitle: "CYBER_SECURITY_ARSENAL",

      cvExperienceTitle: "WORK_HISTORY",
      cvExperienceRole: "Network Monitoring Intern (NOC)",
      cvExperienceDate: "JUN 2026 — PRESENT",
      cvExperienceItems: [
        "Monitoring network equipment and services, including routers, switches, OLTs, and servers.",
        "Identifying and triaging infrastructure alarms and incidents.",
        "Performing connectivity tests and initial troubleshooting using ping and traceroute.",
        "Logging and following up on operational tickets.",
        "Supporting NOC technical routines and collaborating with the infrastructure team."
      ],

      cvAcademicTitle: "EDUCATION",
      cvAcademicText1: "Computer Science — UniCEUB",
      cvAcademicText2: "Studies focused on security, programming, networking, and infrastructure.",

      repositoriesTitle: "PROJECT_REPOSITORIES",
      repoJavaTitle: "Java Studies",
      repoJavaText: "OOP, syntax, logic, and backend fundamentals.",
      repoPythonTitle: "Python Studies",
      repoPythonText: "Logic, automation, and a foundation for security-related tools.",
      repoCamscanTitle: "camscan",
      repoCamscanText: "Automated vulnerability scanner for IP cameras on local area networks.",
      repoMalwareTitle: "malware-detection-tool",
      repoMalwareText: "GitHub project for malware detection.",

      contactTitle: "SECURE_COMMUNICATION_UPLINK",
      contactEmailTitle: "EMAIL_RELAY",

      skill8: "Networking",

      sh: {
        banner: "Simulated terminal running in your browser.",
        bannerHint: "Type help to see the commands, or use the suggestions below.",
        helpTitle: "Available commands",
        help: {
          help: "shows this list",
          whoami: "who owns this session",
          ls: "lists files: ls [folder]",
          cd: "changes folder: cd projects",
          cat: "reads a file: cat profile.txt",
          pwd: "prints the current folder",
          open: "opens a section or link: open cv, open skills, open github",
          lang: "switches language: lang pt",
          rain: "turns animations on or off: rain off",
          neofetch: "system summary",
          nmap: "simulated scan: nmap localhost",
          "uname -a": "system version",
          date: "local date and time",
          history: "commands used in this session",
          clear: "clears the screen (Ctrl+L)"
        },
        notFound: (name) => `command not found: ${name}. Type help to see the commands.`,
        noSuchPath: (name) => `${name}: no such file or folder. Use ls to see what is here.`,
        isDir: (name) => `${name}: is a folder. Use cd ${name} or ls ${name}.`,
        notDir: (name) => `${name}: is not a folder. Use cat ${name}.`,
        catUsage: "Name a file: cat profile.txt",
        openUsage: "Name a target: open root | cv | skills | arsenal | experience | academic | repositories | contact | github | linkedin | email",
        openUnknown: (name) => `${name}: unknown target. Type open to see the options.`,
        opened: (name) => `${name} panel opened.`,
        openedLink: "Opening in a new tab:",
        langUsage: "Use lang pt or lang en.",
        langChanged: "Language switched to English.",
        rainOn: "Animations on.",
        rainOff: "Animations paused.",
        rainUsage: "Use rain on or rain off.",
        sudo: "vinicius is not in the sudoers file. This incident will be reported.",
        readOnly: "Permission denied: read-only file system.",
        exit: "This session cannot be closed, but you can scroll the page and keep browsing.",
        nmapStart: (target) => `Starting a simulated scan of ${target}. No packets were sent.`,
        nmapScope: (target) => `${target}: out of scope. Scans need authorization; use nmap localhost.`,
        nmapDone: "Scan complete: 3 open services.",
        whoami: "vinicius, Computer Science student and NOC intern focused on offensive security.",
        neofetchHost: "Host",
        neofetchLang: "Language",
        neofetchScreen: "Screen",
        neofetchUptime: "Session",
        neofetchFocus: "Focus",
        neofetchFocusValue: "OffSec, web pentesting, automation"
      }
    }
  };

  let currentLang = "pt";
  const t = () => translations[currentLang];

  function setLanguage(lang) {
    const strings = translations[lang];
    if (!strings) {
      return;
    }
    currentLang = lang;
    cancelScrambles();

    const map = {
      "hero-tag-text": strings.heroTag,
      "hero-status-text": strings.heroStatus,

      "root-title": strings.rootTitle,
      "root-text-1": strings.rootText1,
      "root-text-2": strings.rootText2,

      "cv-profile-title": strings.cvProfileTitle,
      "cv-profile-text-1": strings.cvProfileText1,
      "cv-profile-text-2": strings.cvProfileText2,

      "cv-skills-title": strings.cvSkillsTitle,
      "cv-arsenal-title": strings.cvArsenalTitle,

      "cv-experience-title": strings.cvExperienceTitle,
      "cv-experience-role": strings.cvExperienceRole,
      "cv-experience-date": strings.cvExperienceDate,

      "cv-academic-title": strings.cvAcademicTitle,
      "cv-academic-text-1": strings.cvAcademicText1,
      "cv-academic-text-2": strings.cvAcademicText2,

      "repositories-title": strings.repositoriesTitle,
      "repo-java-title": strings.repoJavaTitle,
      "repo-java-text": strings.repoJavaText,
      "repo-python-title": strings.repoPythonTitle,
      "repo-python-text": strings.repoPythonText,
      "repo-camscan-title": strings.repoCamscanTitle,
      "repo-camscan-text": strings.repoCamscanText,
      "repo-malware-title": strings.repoMalwareTitle,
      "repo-malware-text": strings.repoMalwareText,

      "contact-title": strings.contactTitle,
      "contact-email-title": strings.contactEmailTitle,
      "skill-8": strings.skill8
    };

    Object.entries(map).forEach(([id, text]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = text;
      }
    });

    const experienceList = document.getElementById("cv-experience-list");
    if (experienceList) {
      experienceList.replaceChildren(
        ...strings.cvExperienceItems.map((item) => {
          const listItem = document.createElement("li");
          listItem.textContent = item;
          return listItem;
        })
      );
    }

    $$("[data-i18n]").forEach((element) => {
      element.textContent = strings[element.dataset.i18n];
    });
    $$("[data-i18n-aria]").forEach((element) => {
      element.setAttribute("aria-label", strings[element.dataset.i18nAria]);
    });

    document.title = strings.pageTitle;
    const description = $('meta[name="description"]');
    if (description) {
      description.setAttribute("content", strings.pageDescription);
    }

    root.lang = lang === "pt" ? "pt-BR" : "en";

    $$(".lang-btn").forEach((button) => {
      const active = button.dataset.lang === lang;
      button.classList.toggle("active-lang", active);
      button.setAttribute("aria-pressed", String(active));
    });

    updateMotionLabel();
    updateClock();
    store.set("localStorage", "offsec-lang", lang);
  }

  /* ---------- Navegação ---------- */
  const mainTabs = $$(".main-tab");
  const cvTabs = $$(".cv-tab");
  const mainSections = $$(".main-content-section");
  const cvSections = $$(".cv-content-section");
  const cvSubmenu = $("#cv-submenu");
  const terminalLayout = $(".terminal-main-layout");
  const terminalExeLabel = $("#terminal-exe-label");
  const statusWindows = $("#status-windows");

  const exeLabels = {
    root: ">_ EXECUTING_ROOT.EXE",
    cv: ">_ EXECUTING_CV.EXE",
    repositories: ">_ EXECUTING_PROJECTS.EXE",
    contact: ">_ EXECUTING_CONTACT.EXE"
  };
  const MAIN_NAMES = ["root", "cv", "repositories", "contact"];
  const CV_NAMES = ["profile", "skills", "arsenal", "experience", "academic"];

  let activeMain = "root";
  let activeCv = "profile";

  function getActiveCvTab() {
    return activeCv;
  }

  function routeHash() {
    if (activeMain === "cv") {
      return `#cv/${activeCv}`;
    }
    return `#${activeMain}`;
  }

  function syncUrl(mode) {
    if (mode === "none") {
      return;
    }
    const hash = routeHash();
    if (window.location.hash !== hash) {
      try {
        window.history.pushState(null, "", hash);
      } catch {
        /* navegação segue sem histórico */
      }
    }
  }

  function activateCvTab(tabName, options = {}) {
    activeCv = tabName;

    cvTabs.forEach((tab) => {
      const active = tab.dataset.cv === tabName;
      tab.classList.toggle("active-submenu", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    cvSections.forEach((section) => {
      section.classList.toggle("active-content", section.id === `cv-${tabName}`);
    });

    if (!options.quiet) {
      scrambleText($(`#cv-${tabName} .content-title`));
    }
    if (activeMain === "cv") {
      syncUrl(options.history);
    }
  }

  function applyMain(tabName, options = {}) {
    activeMain = tabName;

    mainTabs.forEach((tab) => {
      const active = tab.dataset.main === tabName;
      tab.classList.toggle("active-link", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    mainSections.forEach((section) => {
      section.classList.toggle("active-content", section.id === `main-${tabName}`);
    });

    if (tabName === "cv") {
      cvSubmenu.classList.remove("hidden");
      terminalLayout.classList.remove("cv-closed");
      activateCvTab(getActiveCvTab() || "profile", { history: "none", quiet: options.quiet });
    } else {
      cvSubmenu.classList.add("hidden");
      terminalLayout.classList.add("cv-closed");
      if (!options.quiet) {
        scrambleText($(`#main-${tabName} .content-title`));
      }
    }

    if (terminalExeLabel) {
      terminalExeLabel.textContent = exeLabels[tabName] || exeLabels.root;
    }
    if (statusWindows) {
      statusWindows.textContent = MAIN_NAMES
        .map((name, index) => `${index}:${name}${name === tabName ? "*" : ""}`)
        .join("  ");
    }

    syncUrl(options.history);
  }

  function activateMainTab(tabName, options = {}) {
    if (tabName === activeMain) {
      syncUrl(options.history);
      return;
    }
    showTransition(() => applyMain(tabName, options));
  }

  /* Setas, Home e End movem o foco entre as abas de cada lista. */
  function bindTabKeys(tabs, activate, vertical) {
    tabs.forEach((tab, index) => {
      tab.addEventListener("keydown", (event) => {
        const next = vertical ? "ArrowDown" : "ArrowRight";
        const prev = vertical ? "ArrowUp" : "ArrowLeft";
        let target = -1;
        if (event.key === next || event.key === "ArrowRight") {
          target = (index + 1) % tabs.length;
        } else if (event.key === prev || event.key === "ArrowLeft") {
          target = (index - 1 + tabs.length) % tabs.length;
        } else if (event.key === "Home") {
          target = 0;
        } else if (event.key === "End") {
          target = tabs.length - 1;
        }
        if (target >= 0) {
          event.preventDefault();
          tabs[target].focus();
          activate(tabs[target]);
        }
      });
    });
  }

  function routeFromHash(hash) {
    const [main, sub] = hash.replace(/^#/, "").split("/");
    if (!MAIN_NAMES.includes(main)) {
      return null;
    }
    return { main, cv: CV_NAMES.includes(sub) ? sub : null };
  }

  function applyRoute(route, options) {
    if (route.cv) {
      activateCvTab(route.cv, { history: "none", quiet: options.quiet });
    }
    if (route.main === activeMain) {
      return;
    }
    if (options.instant) {
      applyMain(route.main, { history: "none", quiet: options.quiet });
    } else {
      activateMainTab(route.main, { history: "none" });
    }
  }

  /* ---------- Painel de sessão ---------- */
  const sessionStart = Date.now();
  let commandCount = 0;

  function formatUptime() {
    const total = Math.floor((Date.now() - sessionStart) / 1000);
    const minutes = String(Math.floor(total / 60)).padStart(2, "0");
    const seconds = String(total % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function updateClock() {
    const clock = $("#stat-clock");
    if (!clock) {
      return;
    }
    const now = new Date();
    const time = new Intl.DateTimeFormat(root.lang || "pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(now);
    clock.textContent = time;
    $("#stat-uptime").textContent = formatUptime();

    const barClock = $("#status-clock");
    if (barClock) {
      barClock.textContent = new Intl.DateTimeFormat(root.lang || "pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short"
      }).format(now);
    }
  }

  function updateNetworkStatus() {
    const status = $("#stat-status");
    if (status) {
      status.textContent = navigator.onLine ? "ONLINE" : "OFFLINE";
      status.classList.toggle("is-offline", !navigator.onLine);
    }
  }

  /* ---------- Controle de animações ---------- */
  function updateMotionLabel() {
    const label = $("#motion-toggle-label");
    if (label) {
      label.textContent = motionOn ? t().motionPause : t().motionResume;
    }
  }

  function setMotion(enabled) {
    motionOn = enabled;
    root.dataset.motion = enabled ? "on" : "off";
    store.set("localStorage", "offsec-motion", enabled ? "on" : "off");
    updateMotionLabel();

    if (enabled) {
      rain.start();
    } else {
      rain.stop();
      cancelScrambles();
    }
  }

  /* ---------- Terminal ---------- */
  const shell = (() => {
    const output = $("#shell-output");
    const form = $("#shell-form");
    const input = $("#shell-input");
    const titleEl = $("#shell-title");
    const promptEl = $("#shell-prompt-text");
    const MAX_LINES = 400;

    const history = [];
    let historyIndex = 0;
    let cwd = [];

    const LINKS = {
      github: "https://github.com/viniciusdrt",
      linkedin: "https://www.linkedin.com/in/viniciusdrt/",
      java: "https://github.com/viniciusdrt/java",
      python: "https://github.com/viniciusdrt/python",
      camscan: "https://github.com/viniciusdrt/camscan",
      "malware-detection-tool": "https://github.com/viniciusdrt/malware-detection-tool"
    };
    const EMAIL = "eu.viniasduarte@gmail.com";

    const pathLabel = () => (cwd.length ? `~/${cwd.join("/")}` : "~");
    const promptText = () => `vinicius@offsec:${pathLabel()}$`;

    function syncPrompt() {
      promptEl.textContent = promptText();
      titleEl.textContent = `vinicius@offsec: ${pathLabel()}`;
    }

    function appendNode(node) {
      output.appendChild(node);
      while (output.childElementCount > MAX_LINES) {
        output.firstElementChild.remove();
      }
      output.scrollTop = output.scrollHeight;
    }

    function print(text, kind) {
      const line = document.createElement("div");
      line.className = kind ? `shell-line is-${kind}` : "shell-line";
      line.textContent = text;
      appendNode(line);
      return line;
    }

    function printLink(label, href, prefix) {
      const line = document.createElement("div");
      line.className = "shell-line";
      if (prefix) {
        line.append(`${prefix} `);
      }
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      link.className = "clickable";
      if (!href.startsWith("mailto:")) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      line.append(link);
      appendNode(line);
    }

    function printCommand(text) {
      const line = document.createElement("div");
      line.className = "shell-line is-command";
      line.dataset.prompt = promptText();
      line.textContent = text;
      appendNode(line);
    }

    function printArt(text) {
      const art = document.createElement("div");
      art.className = "shell-art";
      art.setAttribute("aria-hidden", "true");
      art.textContent = text;
      appendNode(art);
    }

    /* Sistema de arquivos virtual: o conteúdo vem das traduções e da própria página. */
    const listFromPage = (selector) => $$(selector).map((item) => `- ${item.textContent.trim()}`);

    const repoFile = (titleKey, textKey, url) => () => {
      print(t()[titleKey], "heading");
      print(t()[textKey]);
      printLink(url.replace("https://", ""), url);
    };

    const FS = {
      "profile.txt": () => {
        print(t().cvProfileTitle, "heading");
        print(t().cvProfileText1);
        print(t().cvProfileText2);
      },
      "skills.txt": () => {
        print(t().cvSkillsTitle, "heading");
        listFromPage("#cv-skills .skill-card").forEach((item) => print(item));
      },
      "arsenal.txt": () => {
        print(t().cvArsenalTitle, "heading");
        listFromPage("#cv-arsenal .skill-card").forEach((item) => print(item));
      },
      "experience.log": () => {
        print(t().cvExperienceTitle, "heading");
        print(`${t().cvExperienceRole}, IPV7`);
        print(t().cvExperienceDate, "muted");
        t().cvExperienceItems.forEach((item) => print(`- ${item}`));
      },
      "education.txt": () => {
        print(t().cvAcademicTitle, "heading");
        print(t().cvAcademicText1);
        print(t().cvAcademicText2);
      },
      projects: {
        "java.md": repoFile("repoJavaTitle", "repoJavaText", LINKS.java),
        "python.md": repoFile("repoPythonTitle", "repoPythonText", LINKS.python),
        "camscan.md": repoFile("repoCamscanTitle", "repoCamscanText", LINKS.camscan),
        "malware-detection-tool.md": repoFile("repoMalwareTitle", "repoMalwareText", LINKS["malware-detection-tool"])
      },
      contact: {
        "email.txt": () => printLink(EMAIL, `mailto:${EMAIL}`),
        "github.url": () => printLink("github.com/viniciusdrt", LINKS.github),
        "linkedin.url": () => printLink("linkedin.com/in/viniciusdrt", LINKS.linkedin)
      }
    };

    function resolvePath(arg) {
      const raw = arg || "";
      let parts;
      if (raw === "~" || raw.startsWith("~/")) {
        parts = [];
      } else if (raw === "/home/vinicius" || raw.startsWith("/home/vinicius/")) {
        parts = [];
      } else if (raw.startsWith("/")) {
        return null;
      } else {
        parts = cwd.slice();
      }

      const relative = raw.replace(/^(~|\/home\/vinicius)\/?/, "");
      for (const segment of relative.split("/")) {
        if (!segment || segment === ".") {
          continue;
        }
        if (segment === "..") {
          parts.pop();
        } else {
          parts.push(segment);
        }
      }

      let node = FS;
      for (const part of parts) {
        if (typeof node !== "object" || !Object.prototype.hasOwnProperty.call(node, part)) {
          return null;
        }
        node = node[part];
      }
      return { node, parts };
    }

    function goToPanel(main, cv) {
      if (cv) {
        activateCvTab(cv, { history: main === activeMain ? undefined : "none" });
      }
      activateMainTab(main);

      /* No celular o painel fica acima do terminal: mostra o resultado. */
      const box = $("#main-terminal-box");
      if (box && box.getBoundingClientRect().top < 0) {
        box.scrollIntoView({ block: "start" });
      }
    }

    function openLink(url, label, prefix) {
      printLink(label, url, prefix);
      if (url.startsWith("mailto:")) {
        window.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }

    const OPEN_PANELS = {
      root: ["root"],
      cv: ["cv"],
      profile: ["cv", "profile"],
      skills: ["cv", "skills"],
      arsenal: ["cv", "arsenal"],
      experience: ["cv", "experience"],
      academic: ["cv", "academic"],
      education: ["cv", "academic"],
      repositories: ["repositories"],
      projects: ["repositories"],
      contact: ["contact"]
    };

    const COMMANDS = {
      help() {
        print(t().sh.helpTitle, "heading");
        Object.entries(t().sh.help).forEach(([name, description]) => {
          print(`${name.padEnd(10)} ${description}`);
        });
      },
      whoami() {
        print(t().sh.whoami);
      },
      pwd() {
        print(`/home/vinicius${cwd.length ? `/${cwd.join("/")}` : ""}`);
      },
      ls(args) {
        const target = args.find((arg) => !arg.startsWith("-"));
        const resolved = resolvePath(target || ".");
        if (!resolved) {
          print(t().sh.noSuchPath(target), "error");
          return;
        }
        if (typeof resolved.node === "function") {
          print(t().sh.notDir(target), "error");
          return;
        }
        const names = Object.keys(resolved.node)
          .map((name) => (typeof resolved.node[name] === "object" ? `${name}/` : name));
        print(names.join("  "));
      },
      cd(args) {
        const resolved = resolvePath(args[0] || "~");
        if (!resolved) {
          print(t().sh.noSuchPath(args[0]), "error");
          return;
        }
        if (typeof resolved.node === "function") {
          print(t().sh.notDir(args[0]), "error");
          return;
        }
        cwd = resolved.parts;
        syncPrompt();
      },
      cat(args) {
        if (!args[0]) {
          print(t().sh.catUsage, "error");
          return;
        }
        args.forEach((arg) => {
          const resolved = resolvePath(arg);
          if (!resolved) {
            print(t().sh.noSuchPath(arg), "error");
          } else if (typeof resolved.node === "function") {
            resolved.node();
          } else {
            print(t().sh.isDir(arg), "error");
          }
        });
      },
      open(args) {
        const target = (args[0] || "").toLowerCase();
        if (!target) {
          print(t().sh.openUsage, "muted");
          return;
        }
        if (Object.prototype.hasOwnProperty.call(OPEN_PANELS, target)) {
          const [main, cv] = OPEN_PANELS[target];
          goToPanel(main, cv);
          print(t().sh.opened(target), "muted");
          return;
        }
        if (target === "email") {
          openLink(`mailto:${EMAIL}`, EMAIL);
          return;
        }
        if (Object.prototype.hasOwnProperty.call(LINKS, target)) {
          openLink(LINKS[target], LINKS[target].replace("https://", ""), t().sh.openedLink);
          return;
        }
        print(t().sh.openUnknown(args[0]), "error");
      },
      lang(args) {
        if (!translations[args[0]]) {
          print(t().sh.langUsage, "error");
          return;
        }
        setLanguage(args[0]);
        print(t().sh.langChanged, "muted");
      },
      rain(args) {
        if (args[0] === "on") {
          setMotion(true);
          print(t().sh.rainOn, "muted");
        } else if (args[0] === "off") {
          setMotion(false);
          print(t().sh.rainOff, "muted");
        } else {
          print(t().sh.rainUsage, "error");
        }
      },
      neofetch() {
        const s = t().sh;
        printArt("__     __\n\\ \\   / /\n \\ \\ / /\n  \\ V /\n   \\_/  __");
        print("vinicius@offsec", "heading");
        print(`OS         Linux 5.14.0-kali`);
        print(`Shell      offsec-sh 2.0`);
        print(`${s.neofetchHost.padEnd(10)} GitHub Pages`);
        print(`${s.neofetchFocus.padEnd(10)} ${s.neofetchFocusValue}`);
        print(`${s.neofetchLang.padEnd(10)} ${root.lang}`);
        print(`${s.neofetchScreen.padEnd(10)} ${window.innerWidth}x${window.innerHeight}`);
        print(`${s.neofetchUptime.padEnd(10)} ${formatUptime()}`);
      },
      nmap(args) {
        const target = args.find((arg) => !arg.startsWith("-")) || "localhost";
        if (!["localhost", "127.0.0.1"].includes(target.toLowerCase())) {
          print(t().sh.nmapScope(target), "error");
          return;
        }
        print(t().sh.nmapStart(target), "muted");
        print("PORT      STATE  SERVICE", "heading");
        print("25/tcp    open   email");
        print("443/tcp   open   github");
        print("8443/tcp  open   linkedin");
        print(t().sh.nmapDone, "muted");
      },
      uname(args) {
        print(args.includes("-a") ? "Linux v-sec-01 5.14.0-kali #1 SMP x86_64 GNU/Linux" : "Linux");
      },
      date() {
        print(new Intl.DateTimeFormat(root.lang, { dateStyle: "full", timeStyle: "medium" }).format(new Date()));
      },
      echo(args) {
        print(args.join(" "));
      },
      history() {
        history.forEach((entry, index) => print(`${String(index + 1).padStart(4)}  ${entry}`));
      },
      clear() {
        output.replaceChildren();
      },
      sudo() {
        print(t().sh.sudo, "error");
      },
      rm() {
        print(t().sh.readOnly, "error");
      },
      exit() {
        print(t().sh.exit, "muted");
        input.blur();
      }
    };

    function run(raw, options = {}) {
      const text = raw.trim();
      printCommand(text);
      if (!text) {
        return;
      }

      commandCount += 1;
      $("#stat-commands").textContent = String(commandCount);

      if (!options.silentHistory) {
        history.push(text);
        historyIndex = history.length;
      }

      const [name, ...args] = text.split(/\s+/);
      const command = Object.prototype.hasOwnProperty.call(COMMANDS, name.toLowerCase())
        ? COMMANDS[name.toLowerCase()]
        : null;

      if (command) {
        command(args);
      } else {
        print(t().sh.notFound(name), "error");
      }
    }

    function complete() {
      const value = input.value;
      const tokens = value.split(/\s+/);
      const last = tokens[tokens.length - 1];
      let options;

      if (tokens.length === 1) {
        options = Object.keys(COMMANDS);
      } else if (tokens[0] === "open") {
        options = [...Object.keys(OPEN_PANELS), ...Object.keys(LINKS), "email"];
      } else if (tokens[0] === "lang") {
        options = ["pt", "en"];
      } else if (tokens[0] === "rain") {
        options = ["on", "off"];
      } else {
        const slash = last.lastIndexOf("/");
        const base = slash >= 0 ? last.slice(0, slash + 1) : "";
        const resolved = resolvePath(base || ".");
        if (!resolved || typeof resolved.node !== "object") {
          return;
        }
        options = Object.keys(resolved.node).map((name) => {
          const suffix = typeof resolved.node[name] === "object" ? "/" : "";
          return `${base}${name}${suffix}`;
        });
      }

      const matches = options.filter((option) => option.startsWith(last));
      if (matches.length === 1) {
        tokens[tokens.length - 1] = matches[0];
        const trailing = matches[0].endsWith("/") ? "" : " ";
        input.value = tokens.join(" ") + trailing;
      } else if (matches.length > 1) {
        printCommand(value);
        print(matches.join("  "), "muted");
      }
    }

    return {
      init() {
        syncPrompt();
        print(t().sh.banner, "heading");
        print(t().sh.bannerHint, "muted");

        form.addEventListener("submit", (event) => {
          event.preventDefault();
          const value = input.value;
          input.value = "";
          run(value);
        });

        input.addEventListener("keydown", (event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            if (historyIndex > 0) {
              historyIndex -= 1;
              input.value = history[historyIndex];
            }
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            if (historyIndex < history.length - 1) {
              historyIndex += 1;
              input.value = history[historyIndex];
            } else {
              historyIndex = history.length;
              input.value = "";
            }
          } else if (event.key === "Tab" && !event.shiftKey && input.value.trim()) {
            /* Campo vazio deixa o Tab sair: o teclado nunca fica preso aqui. */
            event.preventDefault();
            complete();
          } else if (event.ctrlKey && event.key.toLowerCase() === "l") {
            event.preventDefault();
            output.replaceChildren();
          } else if (event.ctrlKey && event.key.toLowerCase() === "c" && input.selectionStart === input.selectionEnd) {
            printCommand(`${input.value}^C`);
            input.value = "";
          } else if (event.key === "Escape") {
            input.blur();
          }
        });

        $$(".shell-chip").forEach((chip) => {
          chip.addEventListener("click", () => run(chip.dataset.cmd));
        });

        /* Clicar no fundo do terminal foca o campo, sem atrapalhar seleção de texto. */
        output.addEventListener("click", (event) => {
          if (!event.target.closest("a") && !String(window.getSelection())) {
            input.focus({ preventScroll: true });
          }
        });
      },
      echo(text) {
        printCommand(text);
      }
    };
  })();

  /* ---------- Revelação da sessão ---------- */
  function initSessionReveal() {
    const session = $(".session");
    if (!session) {
      return;
    }
    if (!("IntersectionObserver" in window)) {
      session.classList.add("is-live");
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        session.classList.add("is-live");
        observer.disconnect();
      }
    }, { rootMargin: "0px 0px -8% 0px" });
    observer.observe($("#terminal-preview"));
  }

  /* ---------- Inicialização ---------- */
  function init() {
    const footerYear = $("#footer-year");
    if (footerYear) {
      footerYear.textContent = String(new Date().getFullYear());
    }

    const savedLang = store.get("localStorage", "offsec-lang");
    setLanguage(translations[savedLang] ? savedLang : "pt");

    shell.init();
    initCrosshair();
    initSessionReveal();
    startGlitch();
    updateNetworkStatus();
    updateClock();
    window.setInterval(updateClock, 1000);
    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    if (statusWindows) {
      statusWindows.textContent = MAIN_NAMES
        .map((name, index) => `${index}:${name}${index === 0 ? "*" : ""}`)
        .join("  ");
    }

    mainTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        if (tab.dataset.main !== activeMain) {
          shell.echo(`open ${tab.dataset.main}`);
        }
        activateMainTab(tab.dataset.main);
      });
    });

    cvTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        if (tab.dataset.cv !== activeCv) {
          shell.echo(`open ${tab.dataset.cv}`);
        }
        activateCvTab(tab.dataset.cv);
      });
    });

    bindTabKeys(mainTabs, (tab) => activateMainTab(tab.dataset.main), true);
    bindTabKeys(cvTabs, (tab) => activateCvTab(tab.dataset.cv), true);

    $$(".lang-btn").forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.lang));
    });

    const motionToggle = $("#motion-toggle");
    if (motionToggle) {
      motionToggle.addEventListener("click", () => setMotion(!motionOn));
    }

    /* Links diretos: #cv/skills abre o painel e leva até a sessão. */
    const initialRoute = routeFromHash(window.location.hash);
    if (initialRoute) {
      applyRoute(initialRoute, { instant: true, quiet: true });
      $(".session").classList.add("is-live");
      $("#terminal-preview").scrollIntoView();
    }

    window.addEventListener("popstate", () => {
      const hash = window.location.hash;
      const route = routeFromHash(hash);
      if (route) {
        applyRoute(route, {});
      } else if (!hash) {
        applyRoute({ main: "root", cv: null }, {});
      }
    });

    rain.init();
    if (motionOn) {
      rain.start();
    } else {
      rain.drawStill();
    }
    if (playIntro) {
      runTitleLock();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
