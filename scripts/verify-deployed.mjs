const url = process.env.PAGES_URL;
const revision = process.env.GITHUB_SHA;
if (!url || !revision) throw new Error('PAGES_URL and GITHUB_SHA are required');
let found = false;
for (let i = 0; i < 12; i++) {
  const response = await fetch(`${url}?revision=${revision}`, {
    cache: 'no-store',
  });
  const body = await response.text();
  if (response.ok && body.includes(`content="${revision}"`)) {
    found = true;
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 5000));
}
if (!found)
  throw new Error('Published Pages does not contain this commit revision');
console.log('Published revision verified');
