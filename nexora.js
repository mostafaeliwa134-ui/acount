const modal = document.querySelector('#modal');
const content = document.querySelector('#dialog-content');
const descriptions = {
 design: ['Design faster', 'Go from a spark of inspiration to a polished interface. Bring your team’s ideas together, explore directions, and keep your design system in sync.'],
 build: ['Build smarter', 'Give your best work more room. Organize tasks, simplify repetitive workflows, and keep every project moving with a shared workspace.'],
 grow: ['Grow together', 'Turn shared insights into your next big step. Track team progress, collaborate across projects, and see the impact of your work.'],
 resources: ['A little inspiration. A lot of possibility.', 'Explore the Nexora workflow: start with an idea, build it with your team, and track your progress. Discover our product features below.'],
 download: ['Your next workspace, on the go.', 'The Nexora mobile app is coming soon for iOS and Android. Join the launch list and we’ll let you know when it’s ready.']
};
document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => {
 const type = button.dataset.dialog;
 if (type === 'signup' || type === 'sales' || type === 'login') {
 const title = type === 'signup' ? 'Make room for what’s next.' : type === 'sales' ? 'Let’s build something great.' : 'Welcome back.';
 content.innerHTML = `<p class="eyebrow">NEXORA WORKSPACE</p><h2>${title}</h2><p>${type === 'sales' ? 'Tell us a little about your team. This demo saves your request on this device.' : 'Explore your next workspace. This is a local demo; no account or remote service is connected.'}</p><form data-form="${type}">${type !== 'login' ? '<label for="name">Your name</label><input id="name" name="name" autocomplete="name" required placeholder="Alex Morgan">' : ''}<label for="email">Work email</label><input id="email" name="email" type="email" autocomplete="email" required placeholder="alex@company.com">${type === 'login' ? '<label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required minlength="8" placeholder="At least 8 characters">' : ''}<button class="button primary" type="submit">${type === 'sales' ? 'Save contact request' : type === 'login' ? 'Continue to demo' : 'Create demo workspace'} <span>→</span></button></form>`;
 } else if (type === 'video') {
 content.innerHTML = '<p class="eyebrow">MEET NEXORA</p><h2>From idea to impact.</h2><p>A quick look at a brighter workflow.</p><div class="demo-preview"><ol><li><b>Imagine.</b> Bring your ideas into one place.</li><li><b>Create.</b> Design and build with your team.</li><li><b>Grow.</b> Track progress and move forward.</li></ol></div><p>Product walkthrough preview. A video is not yet available.</p>';
 } else if (type === 'pricing') {
 content.innerHTML = '<p class="eyebrow">SIMPLE BY DESIGN</p><h2>Start with possibility.</h2><p>Explore the interface with a free local demo.</p><div class="price">Free <small>/ demo workspace</small></div><p>Project organization · Team progress preview · Mobile-ready design</p><p>Commercial plans and payments are not available in this demo.</p>';
 } else {
 const [title, description] = descriptions[type];
 content.innerHTML = `<p class="eyebrow">BUILT FOR YOUR NEXT STEP</p><h2>${title}</h2><p>${description}</p>${type === 'download' ? '<form data-form="download"><label for="notify-email">Email address</label><input id="notify-email" name="email" type="email" required placeholder="you@company.com"><button class="button primary">Save my interest →</button><p>Your interest is saved on this device only.</p></form>' : '<a class="button primary" href="#solutions" data-dismiss>Explore the features →</a>'}`;
 }
 modal.showModal();
}));
document.querySelector('.close-modal').addEventListener('click', () => modal.close());
modal.addEventListener('click', event => { if (event.target === modal || event.target.closest('[data-dismiss]')) modal.close(); });
content.addEventListener('submit', event => {
 event.preventDefault();
 const form = event.target;
 const type = form.dataset.form;
 const email = new FormData(form).get('email');
 if (type !== 'login') { try { localStorage.setItem(`nexora-${type}`, JSON.stringify({email, date: new Date().toISOString()})); } catch {} }
 content.innerHTML = `<p class="eyebrow">YOU’RE ALL SET</p><h2>${type === 'login' ? 'Welcome to the demo.' : 'Your next step starts here.'}</h2><p class="success">${type === 'sales' ? 'Your contact request has been saved on this device. No message has been sent.' : type === 'download' ? 'Your interest has been saved on this device. We have not subscribed you to a mailing list.' : type === 'login' ? 'You’re exploring the local Nexora demo. No authentication was performed.' : 'Your demo workspace interest has been saved on this device.'}</p><button class="button primary" data-dismiss>Keep exploring →</button>`;
});
const menu = document.querySelector('.menu-toggle');
menu.addEventListener('click', () => { const open = document.querySelector('#navigation').classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); menu.textContent = open ? '×' : '☰'; });
document.querySelectorAll('#navigation a, #navigation button').forEach(link => link.addEventListener('click', () => {document.querySelector('#navigation').classList.remove('open'); menu.setAttribute('aria-expanded','false'); menu.textContent='☰';}));
document.querySelector('#year').textContent = new Date().getFullYear();
