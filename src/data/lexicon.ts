export interface LexiconEntry {
  term: string;
  category: 'html' | 'css' | 'js';
  code: string;
  description: string;
  swedishTerms: string[];
  links: {
    mdn: string;
    w3s: string;
    dev: string;
  };
}

export const lexiconData: LexiconEntry[] = [
  {
    term: 'font-size',
    category: 'css',
    code: 'font-size: 16px;',
    description: 'Ändrar storleken på texten.',
    swedishTerms: ['textstorlek', 'storlek på text', 'stora bokstäver', 'text'],
    links: {
      mdn: 'https://developer.mozilla.org/sv-SE/docs/Web/CSS/font-size',
      w3s: 'https://www.w3schools.com/cssref/pr_font_font-size.php',
      dev: 'https://devdocs.io/css/font-size'
    }
  },
  {
    term: 'text-transform',
    category: 'css',
    code: 'text-transform: uppercase;',
    description: 'Styr om texten ska vara versaler (STORA) eller gemener (små).',
    swedishTerms: ['stora bokstäver', 'små bokstäver', 'caps', 'versaler'],
    links: {
      mdn: 'https://developer.mozilla.org/sv-SE/docs/Web/CSS/text-transform',
      w3s: 'https://www.w3schools.com/cssref/pr_text_text-transform.php',
      dev: 'https://devdocs.io/css/text-transform'
    }
  },
  {
    term: 'background-color',
    category: 'css',
    code: 'background-color: #000000;',
    description: 'Ändrar bakgrundsfärgen på ett element.',
    swedishTerms: ['bakgrundsfärg', 'färg bakom', 'fyllning', 'bakgrund'],
    links: {
      mdn: 'https://developer.mozilla.org/sv-SE/docs/Web/CSS/background-color',
      w3s: 'https://www.w3schools.com/cssref/pr_background-color.php',
      dev: 'https://devdocs.io/css/background-color'
    }
  },
  {
    term: 'color',
    category: 'css',
    code: 'color: #ffffff;',
    description: 'Ändrar färgen på texten.',
    swedishTerms: ['textfärg', 'färg på text', 'färg'],
    links: {
      mdn: 'https://developer.mozilla.org/sv-SE/docs/Web/CSS/color',
      w3s: 'https://www.w3schools.com/cssref/pr_text_color.php',
      dev: 'https://devdocs.io/css/color'
    }
  },
  {
    term: 'border-radius',
    category: 'css',
    code: 'border-radius: 8px;',
    description: 'Gör hörnen på ett element runda.',
    swedishTerms: ['runda hörn', 'rundade hörn', 'kantlinje', 'cirkel'],
    links: {
      mdn: 'https://developer.mozilla.org/sv-SE/docs/Web/CSS/border-radius',
      w3s: 'https://www.w3schools.com/cssref/css3_pr_border-radius.php',
      dev: 'https://devdocs.io/css/border-radius'
    }
  },
  {
    term: 'margin',
    category: 'css',
    code: 'margin: 20px;',
    description: 'Skapar mellanrum UTANFÖR ett element.',
    swedishTerms: ['mellanrum', 'avstånd', 'marginal', 'luft'],
    links: {
      mdn: 'https://developer.mozilla.org/sv-SE/docs/Web/CSS/margin',
      w3s: 'https://www.w3schools.com/cssref/pr_margin.php',
      dev: 'https://devdocs.io/css/margin'
    }
  },
  {
    term: 'padding',
    category: 'css',
    code: 'padding: 20px;',
    description: 'Skapar mellanrum INUTI ett element (mellan kanten och innehållet).',
    swedishTerms: ['inre mellanrum', 'utfyllnad', 'luft inuti', 'mellanrum'],
    links: {
      mdn: 'https://developer.mozilla.org/sv-SE/docs/Web/CSS/padding',
      w3s: 'https://www.w3schools.com/cssref/pr_padding.php',
      dev: 'https://devdocs.io/css/padding'
    }
  },
  {
    term: 'display: flex',
    category: 'css',
    code: 'display: flex;\njustify-content: center;\nalign-items: center;',
    description: 'Det moderna sättet att centrera och lägga ut element snyggt.',
    swedishTerms: ['centrera', 'mitten', 'layout', 'rad', 'kolumn'],
    links: {
      mdn: 'https://developer.mozilla.org/sv-SE/docs/Web/CSS/flex',
      w3s: 'https://www.w3schools.com/css/css3_flexbox.asp',
      dev: 'https://devdocs.io/css/flex'
    }
  },
  {
    term: 'button',
    category: 'html',
    code: '<button>Klicka här</button>',
    description: 'Skapar en knapp som användaren kan klicka på.',
    swedishTerms: ['knapp', 'klick', 'skicka'],
    links: {
      mdn: 'https://developer.mozilla.org/sv-SE/docs/Web/HTML/Element/button',
      w3s: 'https://www.w3schools.com/tags/tag_button.asp',
      dev: 'https://devdocs.io/html/elements/button'
    }
  },
  {
    term: 'a (länk)',
    category: 'html',
    code: '<a href="https://google.com">Gå till Google</a>',
    description: 'Skapar en hyperlänk till en annan sida.',
    swedishTerms: ['länk', 'länka', 'adress'],
    links: {
      mdn: 'https://developer.mozilla.org/sv-SE/docs/Web/HTML/Element/a',
      w3s: 'https://www.w3schools.com/tags/tag_a.asp',
      dev: 'https://devdocs.io/html/elements/a'
    }
  },
  {
    term: 'img (bild)',
    category: 'html',
    code: '<img src="bild.jpg" alt="Beskrivning">',
    description: 'Lägger till en bild på din webbsida.',
    swedishTerms: ['bild', 'fotografi', 'ikon', 'image'],
    links: {
      mdn: 'https://developer.mozilla.org/sv-SE/docs/Web/HTML/Element/img',
      w3s: 'https://www.w3schools.com/tags/tag_img.asp',
      dev: 'https://devdocs.io/html/elements/img'
    }
  },
  {
    term: 'display: grid',
    category: 'css',
    code: 'display: grid;\ngrid-template-columns: 1fr 1fr 1fr;\ngap: 20px;',
    description: 'Det mest kraftfulla sättet att bygga avancerade layouter med rader och kolumner.',
    swedishTerms: ['rutnät', 'grid', 'kolumner', 'rader', 'layout'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout',
      w3s: 'https://www.w3schools.com/css/css_grid.asp',
      dev: 'https://devdocs.io/css/grid'
    }
  },
  {
    term: 'position',
    category: 'css',
    code: 'position: absolute;\ntop: 0;\nright: 0;',
    description: 'Bestämmer hur ett element ska placeras (t.ex. flyta ovanpå eller låsas fast i hörnet).',
    swedishTerms: ['positionering', 'flytta', 'låsa fast', 'lager', 'ovanpå'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/CSS/position',
      w3s: 'https://www.w3schools.com/cssref/pr_class_position.php',
      dev: 'https://devdocs.io/css/position'
    }
  },
  {
    term: 'z-index',
    category: 'css',
    code: 'z-index: 100;',
    description: 'Bestämmer ordningen i djupled - vilket element som hamnar "längst fram".',
    swedishTerms: ['lager', 'ordning', 'ovanpå', 'under', 'djupled'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/CSS/z-index',
      w3s: 'https://www.w3schools.com/cssref/pr_pos_z-index.php',
      dev: 'https://devdocs.io/css/z-index'
    }
  },
  {
    term: 'transition',
    category: 'css',
    code: 'transition: all 0.3s ease;',
    description: 'Gör så att ändringar (t.ex. färgbyte vid hover) sker mjukt istället för direkt.',
    swedishTerms: ['mjuk', 'övergång', 'animering', 'fajda', 'glida'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/CSS/transition',
      w3s: 'https://www.w3schools.com/css/css3_transitions.asp',
      dev: 'https://devdocs.io/css/transition'
    }
  },
  {
    term: 'transform',
    category: 'css',
    code: 'transform: rotate(45deg) scale(1.2);',
    description: 'Används för att rotera, förstora eller flytta element utan att påverka layouten runtomkring.',
    swedishTerms: ['rotera', 'snurra', 'skala', 'förstora', 'vinkla'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/CSS/transform',
      w3s: 'https://www.w3schools.com/css/css3_2dtransforms.asp',
      dev: 'https://devdocs.io/css/transform'
    }
  },
  {
    term: '@media (Media Queries)',
    category: 'css',
    code: '@media (max-width: 600px) {\n  .container {\n    flex-direction: column;\n  }\n}',
    description: 'Gör att sidan ser olika ut beroende på skärmstorlek (för mobiler/surfplattor).',
    swedishTerms: ['mobil', 'responsiv', 'skärmstorlek', 'anpassa'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries',
      w3s: 'https://www.w3schools.com/css/css_rwd_mediaqueries.asp',
      dev: 'https://devdocs.io/css/media_queries'
    }
  },
  {
    term: 'fetch (Hämta data)',
    category: 'js',
    code: 'fetch("api-länk")\n  .then(response => response.json())\n  .then(data => console.log(data));',
    description: 'Används för att hämta information från andra servrar (t.ex. väder eller nyheter).',
    swedishTerms: ['hämta', 'ladda', 'api', 'server', 'data'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch',
      w3s: 'https://www.w3schools.com/js/js_api_fetch.asp',
      dev: 'https://devdocs.io/javascript/global_objects/fetch'
    }
  },
  {
    term: 'localStorage',
    category: 'js',
    code: 'localStorage.setItem("namn", "SparkCode");\nconst n = localStorage.getItem("namn");',
    description: 'Sparar information i webbläsaren även om man stänger ner eller laddar om sidan.',
    swedishTerms: ['spara', 'minne', 'databas', 'persistent'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage',
      w3s: 'https://www.w3schools.com/jsref/prop_win_localstorage.asp',
      dev: 'https://devdocs.io/javascript/api/storage/localstorage'
    }
  },
  {
    term: 'addEventListener',
    category: 'js',
    code: 'knapp.addEventListener("click", () => {\n  alert("Klickade!");\n});',
    description: 'Gör koden levande genom att "lyssna" efter klick, knapptryck eller skroll.',
    swedishTerms: ['klick', 'lyssna', 'event', 'händelse', 'interagera'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener',
      w3s: 'https://www.w3schools.com/jsref/met_element_addeventlistener.asp',
      dev: 'https://devdocs.io/javascript/api/eventtarget/addeventlistener'
    }
  },
  {
    term: 'flex-direction',
    category: 'css',
    code: 'flex-direction: column; /* Staplar på höjden */',
    description: 'Bestämmer om element i en Flexbox ska ligga i rad (row) eller staplas (column).',
    swedishTerms: ['stapla', 'rad', 'lodrätt', 'vågrätt', 'riktning'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/CSS/flex-direction',
      w3s: 'https://www.w3schools.com/cssref/css3_pr_flex-direction.php',
      dev: 'https://devdocs.io/css/flex-direction'
    }
  },
  {
    term: 'justify-content',
    category: 'css',
    code: 'justify-content: space-between; /* Sprid ut jämnt */',
    description: 'Fördelar utrymmet mellan element längs huvudaxeln i en flex-box.',
    swedishTerms: ['sprid ut', 'mellanrum', 'centrera', 'fördela'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content',
      w3s: 'https://www.w3schools.com/cssref/css3_pr_justify-content.php',
      dev: 'https://devdocs.io/css/justify-content'
    }
  },
  {
    term: 'opacity',
    category: 'css',
    code: 'opacity: 0.5; /* Halvgenomskinlig */',
    description: 'Styr hur genomskinligt ett element är (0 = osynligt, 1 = helt synligt).',
    swedishTerms: ['genomskinlig', 'osynlig', 'transparens', 'fajda'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/CSS/opacity',
      w3s: 'https://www.w3schools.com/cssref/pr_opacity.php',
      dev: 'https://devdocs.io/css/opacity'
    }
  },
  {
    term: 'filter: blur',
    category: 'css',
    code: 'filter: blur(5px); /* Suddig bild */',
    description: 'Lägger till effekter som suddighet (blur), gråskala eller högre kontrast.',
    swedishTerms: ['suddig', 'effekt', 'blur', 'svartvitt', 'kontrast'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/CSS/filter',
      w3s: 'https://www.w3schools.com/cssref/css3_pr_filter.php',
      dev: 'https://devdocs.io/css/filter'
    }
  },
  {
    term: 'overflow',
    category: 'css',
    code: 'overflow: auto; /* Lägg till scroll om det behövs */',
    description: 'Bestämmer vad som händer om innehållet är större än rutan (t.ex. lägga till scrollbar).',
    swedishTerms: ['scroll', 'rulla', 'klippa', 'innehåll', 'ruta'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/CSS/overflow',
      w3s: 'https://www.w3schools.com/cssref/pr_pos_overflow.php',
      dev: 'https://devdocs.io/css/overflow'
    }
  },
  {
    term: 'box-shadow',
    category: 'css',
    code: 'box-shadow: 0 4px 10px rgba(0,0,0,0.5);',
    description: 'Lägger till en skugga runt ett element för att ge det djup.',
    swedishTerms: ['skugga', 'djup', 'lyfta', 'glow'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow',
      w3s: 'https://www.w3schools.com/cssref/css3_pr_box-shadow.php',
      dev: 'https://devdocs.io/css/box-shadow'
    }
  },
  {
    term: 'form (formulär)',
    category: 'html',
    code: '<form action="/logga-in">\n  <input type="text">\n  <button>Skicka</button>\n</form>',
    description: 'Används för att samla in data från användaren (t.ex. inloggningsfält).',
    swedishTerms: ['formulär', 'input', 'skicka', 'användardata'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form',
      w3s: 'https://www.w3schools.com/html/html_forms.asp',
      dev: 'https://devdocs.io/html/elements/form'
    }
  },
  {
    term: 'input (inmatning)',
    category: 'html',
    code: '<input type="text" placeholder="Skriv här...">',
    description: 'Skapar en ruta där användaren kan skriva in text, lösenord eller välja datum.',
    swedishTerms: ['skriva', 'textruta', 'lösenord', 'fält'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input',
      w3s: 'https://www.w3schools.com/tags/tag_input.asp',
      dev: 'https://devdocs.io/html/elements/input'
    }
  },
  {
    term: 'video',
    category: 'html',
    code: '<video src="film.mp4" controls width="320"></video>',
    description: 'Lägger till en videospelare med knappar för start/paus på sidan.',
    swedishTerms: ['video', 'film', 'klipp', 'spela'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video',
      w3s: 'https://www.w3schools.com/tags/tag_video.asp',
      dev: 'https://devdocs.io/html/elements/video'
    }
  },
  {
    term: 'iframe',
    category: 'html',
    code: '<iframe src="https://wikipedia.org"></iframe>',
    description: 'Visa en helt annan webbsida inuti din egna sida (t.ex. en karta eller YouTube-klipp).',
    swedishTerms: ['fönster', 'integrera', 'karta', 'extern'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe',
      w3s: 'https://www.w3schools.com/tags/tag_iframe.asp',
      dev: 'https://devdocs.io/html/elements/iframe'
    }
  },
  {
    term: 'console.log',
    category: 'js',
    code: 'console.log("Variabeln är:", x);',
    description: 'Det viktigaste verktyget för att felsöka. Skriver ut text i DEBUG-panelen.',
    swedishTerms: ['logga', 'skriva ut', 'felsöka', 'kontrollera', 'debug'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/API/console/log',
      w3s: 'https://www.w3schools.com/jsref/met_console_log.asp',
      dev: 'https://devdocs.io/javascript/api/console/log'
    }
  },
  {
    term: 'document.querySelector',
    category: 'js',
    code: 'const btn = document.querySelector(".min-knapp");',
    description: 'Sättet man väljer ut ett element från HTML för att kunna styra det med kod.',
    swedishTerms: ['välja', 'hitta', 'id', 'klass', 'peka ut'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector',
      w3s: 'https://www.w3schools.com/jsref/met_document_queryselector.asp',
      dev: 'https://devdocs.io/javascript/api/document/queryselector'
    }
  },
  {
    term: 'JSON.parse & JSON.stringify',
    category: 'js',
    code: 'const obj = JSON.parse(text);\nconst text = JSON.stringify(obj);',
    description: 'Omvandlar text till läsbara objekt för koden, och tvärtom.',
    swedishTerms: ['omvandla', 'text', 'format', 'objekt', 'data'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON',
      w3s: 'https://www.w3schools.com/js/js_json.asp',
      dev: 'https://devdocs.io/javascript/global_objects/json'
    }
  },
  {
    term: 'pkg add (Virtual Package Manager)',
    category: 'js',
    code: 'pkg add <namn>',
    description: 'Installerar externa bibliotek (React, GSAP, etc.) direkt i ditt projekt via CDN.',
    swedishTerms: ['installera', 'bibliotek', 'library', 'paket', 'terminal', 'kommandon'],
    links: {
      mdn: 'https://esm.sh',
      w3s: 'https://www.w3schools.com/js/js_versions.asp',
      dev: 'https://devdocs.io/javascript/'
    }
  },
  {
    term: 'snapshot save (Time Traveler)',
    category: 'js',
    code: 'snapshot save',
    description: 'Sparar ett tillstånd av din kod för att senare kunna jämföra ändringar med Visual Diff.',
    swedishTerms: ['spara version', 'checkpoint', 'historik', 'diff', 'terminal', 'kommandon'],
    links: {
      mdn: 'https://git-scm.com/docs/git-commit',
      w3s: 'https://www.w3schools.com/git/git_commit.asp',
      dev: 'https://devdocs.io/git/'
    }
  },
  {
    term: 'bridge connect (Command Bridge)',
    category: 'js',
    code: 'bridge connect',
    description: 'Kopplar ihop SparkCode med din dators lokala agent för att aktivera backend-kraft.',
    swedishTerms: ['anslut maskin', 'lokal brygga', 'system', 'terminal', 'offline', 'kommandon'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API',
      w3s: 'https://www.w3schools.com/nodejs/nodejs_filesystem.asp',
      dev: 'https://devdocs.io/javascript/'
    }
  },
  {
    term: 'logs clear (The Pulse)',
    category: 'js',
    code: 'logs clear',
    description: 'Rensar alla aktiva debug-loggar från din Live Pulse-monitor.',
    swedishTerms: ['rensa loggar', 'tömma', 'debug', 'terminal', 'kommandon'],
    links: {
      mdn: 'https://developer.mozilla.org/en-US/docs/Web/API/console/clear',
      w3s: 'https://www.w3schools.com/jsref/met_console_clear.asp',
      dev: 'https://devdocs.io/javascript/api/console/clear'
    }
  }
];
