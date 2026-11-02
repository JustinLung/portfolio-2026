import { browser } from '$app/environment';

if (browser) {
	console.log(`
    _.-''''-._
  .'  o    o  '.
 /    \\    /    \\
|    .-""""-.    |
|   /  ____  \\   |
 \\  | / == \\ |  /
  '.| \\____/ |.'
    '.______.'

    git commit -m "fix typo"
    git commit -m "fix the fix"
    git commit -m "actually fix it this time"
    git commit -m "please work"
    git commit -m "it works, don't touch it"
    `);
}
