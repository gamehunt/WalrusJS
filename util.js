export function nextCharacter(c) {
    return String.fromCharCode(c.charCodeAt(0) + 1);
}

export function randint(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}
