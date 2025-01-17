import { urlSafe } from "./url"

export async function sha256(str: string) {
  if (typeof window.crypto !== "undefined" && "subtle" in window.crypto) {
    const buffer = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(str))
    return urlSafe(new Uint8Array(buffer))
  }
  return urlSafe(_sha256(str)!)
}

/**
 * Generate sha-256 hash of a string.
 *
 * @link https://geraintluff.github.io/sha256/
 *
 * @param data data to generate hash of
 * @param base64 By default the returned value is base64 encoded. If `false` format will be hex.
 */
function _sha256(data: string, base64 = true) {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount))
  }

  const mathPow = Math.pow
  const maxWord = mathPow(2, 32)
  const lengthProperty = "length"
  let i
  let j
  let result = ""

  const words = [] as number[]
  const asciiBitLength = data[lengthProperty] * 8

  // @ts-ignore
  let hash = (sha256.h = sha256.h || [])
  // @ts-ignore
  const k = (sha256.k = sha256.k || [])
  let primeCounter = k[lengthProperty]
  const isComposite = {} as Record<number, number>
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0
    }
  }
  data += "\x80" // Append ?' bit (plus zero padding)
  while ((data[lengthProperty] % 64) - 56) data += "\x00" // More zero padding
  for (i = 0; i < data[lengthProperty]; i++) {
    j = data.charCodeAt(i)
    if (j >> 8) return // ASCII check: only accept characters in range 0-255
    words[i >> 2] |= j << (((3 - i) % 4) * 8)
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0
  words[words[lengthProperty]] = asciiBitLength

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16))
    const oldHash = hash
    hash = hash.slice(0, 8)

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15]
      const w2 = w[i - 2]
      const a = hash[0]
      const e = hash[4]
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + // S1
        ((e & hash[5]) ^ (~e & hash[6])) + // ch
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + // s0
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | // s1
              0)
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + // S0
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])) // maj

      hash = [(temp1 + temp2) | 0].concat(hash)
      hash[4] = (hash[4] + temp1) | 0
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255
      result += (b < 16 ? 0 : "") + b.toString(16)
    }
  }
  return base64
    ? btoa(
        result
          .match(/\w{2}/g)!
          .map((a) => String.fromCharCode(Number.parseInt(a, 16)))
          .join(""),
      )
    : result
}
