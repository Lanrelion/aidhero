async function check() {
  const r = await fetch('http://localhost:3000/en');
  const text = await r.text();
  const matches = text.match(/<link[^>]*stylesheet[^>]*>/g);
  console.log('Stylesheets:', matches);
}
check();
