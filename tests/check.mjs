// Dependency-free checks for the portfolio. Exits 1 and names the failing check.
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
const r = f => readFileSync(f, 'utf8');
const fail = [];
const check = (name, ok) => { if (!ok) fail.push(name); };
const shipped = ['index.html', 'projects.html', '404.html', 'styles.css', 'main.js'];
const html = r('index.html'), css = r('styles.css');
const proj = existsSync('projects.html') ? r('projects.html') : '';

const banned = [/Austin/i, /Texas/i, /\bTX\b/, /Round Rock/i, /Venezuela/i, /Maracaibo/i, /gmail\.com/i,
  /contact@techvesolutions\.com/i, /pentest/i, /penetration/i, /whatsapp/i,
  /\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/, /\+\d[\d\s().-]{8,}/];
check('banned-strings', shipped.every(f => {
  const t = r(f).replaceAll('UT Austin McCombs School of Business', ''); // only allowed phrase
  return banned.every(re => !re.test(t));
}));
check('email-exact', html.includes('mailto:hello@christophersuarez.net'));
check('resume-link', html.includes('href="/Christopher-Suarez-Resume.pdf"') && existsSync('Christopher-Suarez-Resume.pdf'));
const ids = ['top', 'glance', 'cable', 'office', 'shield', 'builder', 'contact'];
const pos = ids.map(i => html.indexOf(`id="${i}"`));
check('section-ids', pos.every((p, i) => p >= 0 && (i === 0 || p > pos[i - 1])));
check('one-h1', (html.match(/<h1[\s>]/g) || []).length === 1);
check('img-alt', (html.match(/<img\b[^>]*>/g) || []).every(t => /\balt="[^"]+"/.test(t)));
check('reduced-motion-block-present', css.includes('prefers-reduced-motion: reduce'));
check('reveal-hidden-only-under-js', [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].every(([, sel, body]) =>
  !/opacity:\s*0\s*(;|$)/.test(body) || !sel.includes('.reveal') || sel.trim().split(',').every(s => s.trim().startsWith('.js'))));
check('js-size', readFileSync('main.js').length <= 12288);
check('cname-intact', ['christophersuarez.net\n', 'christophersuarez.net'].includes(r('CNAME')));
const tracked = execSync('git ls-files').toString().split('\n');
check('no-copy-md-shipped', !tracked.includes('copy.md') && !tracked.includes('resume.html'));

// Projects page (2026-11-25): personal labs only, same CSP, linked from the story and the sitemap.
check('projects-page', proj !== '' && (proj.match(/<h1[\s>]/g) || []).length === 1);
check('projects-16-labs', (proj.match(/<li class="lab/g) || []).length === 16);
check('projects-csp', proj.includes(html.match(/<meta http-equiv="Content-Security-Policy"[^>]*>/)[0]));
check('projects-canonical', proj.includes('<link rel="canonical" href="https://christophersuarez.net/projects">'));
check('projects-personal-only', !/Cobrao|Saires|TechVe Solutions takes/i.test(proj.replace(/<footer[\s\S]*$/, '')));
check('projects-linked', html.includes('href="/projects"'));
check('projects-in-sitemap', r('sitemap.xml').includes('https://christophersuarez.net/projects<'));

if (fail.length) { console.error('FAILED: ' + fail.join(', ')); process.exit(1); }
console.log('all checks passed');
