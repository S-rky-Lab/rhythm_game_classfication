import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

const KEY_LENGTH = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;

function deriveKey(
  password: string,
  salt: string,
  keyLength: number,
  cost: number,
  blockSize: number,
  parallelization: number
) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      keyLength,
      {
        N: cost,
        r: blockSize,
        p: parallelization,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey as Buffer);
      }
    );
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await deriveKey(
    password,
    salt,
    KEY_LENGTH,
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION
  );

  return [
    "scrypt",
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt,
    derivedKey.toString("hex"),
  ].join("$");
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, cost, blockSize, parallelization, salt, hash] =
    storedHash.split("$");

  if (
    algorithm !== "scrypt" ||
    !/^\d+$/.test(cost ?? "") ||
    !/^\d+$/.test(blockSize ?? "") ||
    !/^\d+$/.test(parallelization ?? "") ||
    !salt ||
    !/^[0-9a-f]+$/i.test(hash ?? "")
  ) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const costValue = Number(cost);
  const blockSizeValue = Number(blockSize);
  const parallelizationValue = Number(parallelization);
  if (
    !Number.isSafeInteger(costValue) ||
    !Number.isSafeInteger(blockSizeValue) ||
    !Number.isSafeInteger(parallelizationValue) ||
    costValue < 2 ||
    blockSizeValue < 1 ||
    parallelizationValue < 1 ||
    expected.length === 0
  ) {
    return false;
  }

  const derivedKey = await deriveKey(
    password,
    salt,
    expected.length,
    costValue,
    blockSizeValue,
    parallelizationValue
  );

  return (
    derivedKey.length === expected.length &&
    timingSafeEqual(derivedKey, expected)
  );
}
