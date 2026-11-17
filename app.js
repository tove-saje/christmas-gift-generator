// ---------- Build the option chips ----------
document.querySelectorAll('.chips').forEach(box => {
  const name = box.dataset.name;
  box.innerHTML = box.dataset.opts.split('|').map((o, i) => {
    const [label, val] = o.includes('=') ? o.split('=') : [o, o.toLowerCase()];
    return `<label><input type="radio" name="${name}" value="${val}" ${i === 0 ? 'required' : ''}><span>${label}</span></label>`;
  }).join('');
});

// ---------- Snow ----------
const snow = document.getElementById('snow');
for (let i = 0; i < 30; i++) {
  const f = document.createElement('div');
  f.className = 'flake';
  f.textContent = '❄';
  f.style.left = Math.random() * 100 + '%';
  f.style.fontSize = 8 + Math.random() * 14 + 'px';
  f.style.animationDuration = 8 + Math.random() * 10 + 's';
  f.style.animationDelay = -Math.random() * 15 + 's';
  snow.appendChild(f);
}

// ---------- Matching ----------
const strip = w => w.replace(/(ing|s)$/, '');
const words = t => t.toLowerCase().match(/[a-z']+/g) || [];
// does keyword k appear in text?
function hit(k, text) {
  if (k.includes(' ')) return text.toLowerCase().includes(k);
  return words(text).some(w => w === k || strip(w) === strip(k));
}

function rank(a) {
  const out = [];
  for (const g of GIFTS) {
    if (g.price > a.budget) continue;
    if (g.only && !g.only.includes(a.who)) continue;
    if (g.not && g.not.includes(a.who)) continue;
    // skip anything they hate
    if (a.hates.some(h => g.kw.some(k => hit(k, h)) || hit(h, g.name))) continue;

    let s = Math.random() * 2; // a little shuffle so "more" stays fresh
    const loved = a.loves.filter(l => g.kw.some(k => hit(k, l)));
    s += loved.length * 4;
    if (g.kw.some(k => hit(k, a.facts))) s += 2;

    s += a.taste === 'mix' ? 1 : g.taste === a.taste ? 3 : 0;
    s += g.social === 'both' ? 1 : g.social === a.social ? 3 : a.social === 'both' ? 1 : -2;
    if (g.g) s += a.gender === 'any' ? 0 : g.g === a.gender ? 1 : -8;
    s += (g.price / a.budget); // lean towards using the budget

    if (a.difficulty === 'has everything' || a.difficulty === 'impossible to please') {
      if (g.x || g.taste === 'quirky') s += 2;       // experiences & consumables
    } else if (a.difficulty === 'picky') {
      if (g.taste === 'quirky') s -= 2;              // keep it safe
    }
    out.push({ g, s, loved });
  }
  return out.sort((x, y) => y.s - x.s);
}

// ---------- Reason text ----------
const WHO = { friend: 'your friend', sister: 'your sister', brother: 'your brother', mom: 'your mom',
              dad: 'your dad', partner: 'your partner', colleague: 'your colleague', other: 'them' };
const VIBE = { out: 'someone who is always out and about', home: 'a homebody', both: 'their balanced lifestyle' };

function reason(item, a) {
  let r = `A great pick for ${WHO[a.who]}: ${item.g.why}.`;
  if (item.loved.length) r += ` They love ${item.loved[0]}, so this should land well.`;
  else if (item.g.social === a.social && a.social !== 'both') r += ` Ideal for ${VIBE[a.social]}.`;
  return r;
}

// ---------- UI ----------
let answers, ranked, offset;
const $ = id => document.getElementById(id);

function show() {
  const batch = ranked.slice(offset, offset + 5);
  $('list').innerHTML = batch.map(item => `
    <article class="gift">
      <div class="pic">${item.g.emoji}</div>
      <div>
        <h3>${item.g.name}</h3>
        <div class="price">~$${item.g.price}</div>
        <p>${reason(item, answers)}</p>
        <a class="shop" target="_blank" rel="noopener"
           href="https://www.amazon.com/s?k=${encodeURIComponent(item.g.name)}">Shop on Amazon →</a>
      </div>
    </article>`).join('');
  $('more').hidden = ranked.length <= 5;
}

$('quiz').addEventListener('submit', e => {
  e.preventDefault();
  const v = n => document.querySelector(`input[name="${n}"]:checked`).value;
  const vals = cls => [...document.querySelectorAll('.' + cls)].map(i => i.value.trim()).filter(Boolean);
  answers = {
    who: v('who'), gender: v('gender'), social: v('social'), taste: v('taste'),
    difficulty: v('difficulty'), budget: Number($('budget').value),
    loves: vals('love'), hates: vals('hate'), facts: $('facts').value.trim()
  };
  ranked = rank(answers);
  offset = 0;
  $('quiz').hidden = true;
  $('results').hidden = false;
  $('note').textContent = '';
  if (!ranked.length) {
    $('list').innerHTML = '<p class="note">Nothing fits that budget. Try raising it a little!</p>';
    $('more').hidden = true;
  } else show();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('more').addEventListener('click', () => {
  offset += 5;
  $('note').textContent = '';
  if (offset >= ranked.length) {           // ran out: reshuffle and go again
    ranked = rank(answers);
    offset = 0;
    $('note').textContent = "That's all our best matches. Here's a fresh shuffle!";
  }
  show();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('restart').addEventListener('click', () => {
  $('results').hidden = true;
  $('quiz').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
