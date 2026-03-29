const canvas = document.getElementById("matrix-canvas");
const crosshair = document.getElementById("crosshair");
const devsecText = document.querySelector(".name-green");
const transitionOverlay = document.getElementById("transition-overlay");
const terminalExeLabel = document.getElementById("terminal-exe-label");

if (canvas) {
  const ctx = canvas.getContext("2d");

  const chars = "アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const fontSize = 18;
  let columns = 0;
  let drops = [];

  function setupMatrix() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(1);
  }

  function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00ff41";
    ctx.font = `${fontSize}px VT323`;

    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }

      drops[i]++;
    }
  }

  setupMatrix();
  window.addEventListener("resize", setupMatrix);
  setInterval(drawMatrix, 55);
}

/* mira */
if (crosshair) {
  window.addEventListener("mousemove", (event) => {
    crosshair.style.left = `${event.clientX}px`;
    crosshair.style.top = `${event.clientY}px`;
  });

  function bindClickableHover() {
    const clickableElements = document.querySelectorAll(".clickable");

    clickableElements.forEach((element) => {
      element.addEventListener("mouseenter", () => {
        crosshair.classList.add("visible");
        crosshair.classList.add("active");
      });

      element.addEventListener("mouseleave", () => {
        crosshair.classList.remove("active");
        crosshair.classList.remove("visible");
      });
    });
  }

  bindClickableHover();
}

/* glitch no DEVSEC */
if (devsecText) {
  function randomGlitch() {
    const glitchX = (Math.random() - 0.5) * 2;
    const glitchY = (Math.random() - 0.5) * 2;

    devsecText.style.transform = `translate(${glitchX}px, ${glitchY}px)`;

    setTimeout(() => {
      devsecText.style.transform = "translate(0, 0)";
    }, 80);
  }

  setInterval(() => {
    if (Math.random() > 0.7) {
      randomGlitch();
    }
  }, 700);
}

/* transição forte */
function showTransition(callback) {
  if (transitionOverlay) {
    transitionOverlay.classList.add("active");
  }

  setTimeout(() => {
    callback();
  }, 170);

  setTimeout(() => {
    if (transitionOverlay) {
      transitionOverlay.classList.remove("active");
    }
  }, 520);
}

/* navegação principal */
const mainTabs = document.querySelectorAll(".main-tab");
const cvTabs = document.querySelectorAll(".cv-tab");
const mainSections = document.querySelectorAll(".main-content-section");
const cvSections = document.querySelectorAll(".cv-content-section");
const cvSubmenu = document.getElementById("cv-submenu");

const exeLabels = {
  root: ">_ EXECUTING_ROOT.EXE",
  cv: ">_ EXECUTING_CV.EXE",
  repositories: ">_ EXECUTING_PROJECTS.EXE",
  contact: ">_ EXECUTING_CONTACT.EXE"
};

function activateMainTab(tabName) {
  showTransition(() => {
    mainTabs.forEach((tab) => {
      tab.classList.toggle("active-link", tab.dataset.main === tabName);
    });

    mainSections.forEach((section) => {
      section.classList.toggle("active-content", section.id === `main-${tabName}`);
    });

const terminalLayout = document.querySelector(".terminal-main-layout");

if (tabName === "cv") {
  cvSubmenu.classList.remove("hidden");
  terminalLayout.classList.remove("cv-closed");
  activateCvTab(getActiveCvTab() || "profile");
} else {
  cvSubmenu.classList.add("hidden");
  terminalLayout.classList.add("cv-closed");
}

    if (terminalExeLabel) {
      terminalExeLabel.textContent = exeLabels[tabName] || ">_ EXECUTING_ROOT.EXE";
    }
  });
}

function getActiveCvTab() {
  const active = document.querySelector(".cv-tab.active-submenu");
  return active ? active.dataset.cv : null;
}

function activateCvTab(tabName) {
  cvTabs.forEach((tab) => {
    tab.classList.toggle("active-submenu", tab.dataset.cv === tabName);
  });

  cvSections.forEach((section) => {
    section.classList.toggle("active-content", section.id === `cv-${tabName}`);
  });
}

mainTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activateMainTab(tab.dataset.main);
  });
});

cvTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activateCvTab(tab.dataset.cv);
  });
});

/* estado inicial */
const terminalLayout = document.querySelector(".terminal-main-layout");

if (cvSubmenu) {
  cvSubmenu.classList.add("hidden");
}

if (terminalLayout) {
  terminalLayout.classList.add("cv-closed");
}

const translations = {
  pt: {
    heroTag: "VULNERABILIDADE ENCONTRADA...",
    heroStatus: "Disponível para oportunidades",

    rootTitle: "ROOT_ACCESS",
    rootText1: "Bem-vindo ao meu portfólio OffSec. Aqui você encontra meu perfil, habilidades técnicas, projetos e formas de contato em uma interface inspirada em terminal cyber.",
    rootText2: "Meu foco está em segurança ofensiva, pentest web, automação e evolução prática constante na área de cibersegurança.",

    cvProfileTitle: "PROFESSIONAL_SUMMARY",
    cvProfileText1: "Estudante de Ciência da Computação com foco em segurança ofensiva, pentest web, automação e análise de vulnerabilidades.",
    cvProfileText2: "Buscando evoluir tecnicamente através de projetos práticos, laboratórios, estudos constantes e desenvolvimento de soluções com foco em segurança.",

    cvSkillsTitle: "TECHNICAL_CAPABILITIES",

    cvArsenalTitle: "CYBER_SECURITY_ARSENAL",

    cvExperienceTitle: "WORK_HISTORY",
    cvExperienceText1: "No momento, estou construindo base prática com estudos, laboratórios, projetos pessoais e desenvolvimento técnico contínuo.",
    cvExperienceText2: "Meu foco atual é fortalecer portfólio, repertório técnico e experiência aplicável em segurança e infraestrutura.",

    cvAcademicTitle: "EDUCATION",
    cvAcademicText1: "Ciência da Computação — UniCEUB",
    cvAcademicText2: "Estudos voltados para segurança, programação, redes e infraestrutura.",

    repositoriesTitle: "PROJECT_REPOSITORIES",
    repoJavaTitle: "Estudos Java",
    repoJavaText: "POO, sintaxe, lógica e fundamentos backend.",
    repoPythonTitle: "Estudos Python",
    repoPythonText: "Lógica, automação e base para ferramentas de segurança.",

    contactTitle: "SECURE_COMMUNICATION_UPLINK",
    contactEmailTitle: "EMAIL_RELAY",

    skill7: "Redes"
  },

  en: {
    heroTag: "VULNERABILITY DETECTED...",
    heroStatus: "Open to Opportunities",

    rootTitle: "ROOT_ACCESS",
    rootText1: "Welcome to my OffSec portfolio. Here you will find my profile, technical skills, projects, and contact channels in an interface inspired by a cyber terminal.",
    rootText2: "My focus is offensive security, web pentesting, automation, and continuous practical growth in cybersecurity.",

    cvProfileTitle: "PROFESSIONAL_SUMMARY",
    cvProfileText1: "Computer Science student focused on offensive security, web pentesting, automation, and vulnerability analysis.",
    cvProfileText2: "Currently improving through practical projects, labs, continuous study, and solution building with a security-oriented mindset.",

    cvSkillsTitle: "TECHNICAL_CAPABILITIES",

    cvArsenalTitle: "CYBER_SECURITY_ARSENAL",

    cvExperienceTitle: "WORK_HISTORY",
    cvExperienceText1: "At the moment, I am building practical experience through studies, labs, personal projects, and continuous technical development.",
    cvExperienceText2: "My current goal is to strengthen my portfolio, technical background, and real-world skills applicable to security and infrastructure.",

    cvAcademicTitle: "EDUCATION",
    cvAcademicText1: "Computer Science — UniCEUB",
    cvAcademicText2: "Studies focused on security, programming, networking, and infrastructure.",

    repositoriesTitle: "PROJECT_REPOSITORIES",
    repoJavaTitle: "Java Studies",
    repoJavaText: "OOP, syntax, logic, and backend fundamentals.",
    repoPythonTitle: "Python Studies",
    repoPythonText: "Logic, automation, and a foundation for security-related tools.",

    contactTitle: "SECURE_COMMUNICATION_UPLINK",
    contactEmailTitle: "EMAIL_RELAY",

    skill7: "Networking"
  }
};

function setLanguage(lang) {
  const map = {
    "hero-tag-text": translations[lang].heroTag,
    "hero-status-text": translations[lang].heroStatus,

    "root-title": translations[lang].rootTitle,
    "root-text-1": translations[lang].rootText1,
    "root-text-2": translations[lang].rootText2,

    "cv-profile-title": translations[lang].cvProfileTitle,
    "cv-profile-text-1": translations[lang].cvProfileText1,
    "cv-profile-text-2": translations[lang].cvProfileText2,

    "cv-skills-title": translations[lang].cvSkillsTitle,
    "cv-arsenal-title": translations[lang].cvArsenalTitle,

    "cv-experience-title": translations[lang].cvExperienceTitle,
    "cv-experience-text-1": translations[lang].cvExperienceText1,
    "cv-experience-text-2": translations[lang].cvExperienceText2,

    "cv-academic-title": translations[lang].cvAcademicTitle,
    "cv-academic-text-1": translations[lang].cvAcademicText1,
    "cv-academic-text-2": translations[lang].cvAcademicText2,

    "repositories-title": translations[lang].repositoriesTitle,
    "repo-java-title": translations[lang].repoJavaTitle,
    "repo-java-text": translations[lang].repoJavaText,
    "repo-python-title": translations[lang].repoPythonTitle,
    "repo-python-text": translations[lang].repoPythonText,

    "contact-title": translations[lang].contactTitle,
    "contact-email-title": translations[lang].contactEmailTitle,
    "skill-7": translations[lang].skill7
  };

  Object.entries(map).forEach(([id, text]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text;
    }
  });

  document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
}

const langButtons = document.querySelectorAll(".lang-btn");

langButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const lang = button.dataset.lang;

    langButtons.forEach((btn) => btn.classList.remove("active-lang"));
    button.classList.add("active-lang");

    setLanguage(lang);
  });
});

setLanguage("pt");