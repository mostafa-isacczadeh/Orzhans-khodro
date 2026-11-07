const HEIC_BRANDS = [
  "heic", "heix", "hevc", "hevx",
  "heim", "heis", "hevm", "hevs",
];

const HEIF_BRANDS = [
  "mif1", "msf1", "heif", "heis",
  ...HEIC_BRANDS,
];

const MP4_BRANDS = [
  "isom", "iso2", "iso3", "iso4", "iso5", "iso6",
  "iso7", "iso8", "iso9", "isoA", "isoB",
  "mp41", "mp42", "avc1", "M4V ", "MSNV",
  "dash", "3gp4", "3gp5", "3gp6", "3ge6",
  "3gg6", "F4V ", "F4P ", "mmp4",
];

function getFtypBrands(buf: Buffer): string[] {
  if (buf.length < 16 || buf.toString("ascii", 4, 8) !== "ftyp") {
    return [];
  }

  let boxSize = buf.readUInt32BE(0);
  let headerSize = 8;

  if (boxSize === 1) {
    if (buf.length < 24) return [];

    const extendedSize = buf.readBigUInt64BE(8);
    if (extendedSize > BigInt(Number.MAX_SAFE_INTEGER)) return [];

    boxSize = Number(extendedSize);
    headerSize = 16;
  } else if (boxSize === 0) {
    return [];
  }

  if (boxSize < headerSize + 8 || boxSize > buf.length) {
    return [];
  }

  const payloadStart = headerSize;
  const payloadLength = boxSize - payloadStart;

  if (payloadLength < 8 || (payloadLength - 8) % 4 !== 0) {
    return [];
  }

  const brands: string[] = [
    buf.toString("ascii", payloadStart, payloadStart + 4),
  ];

  for (
    let i = payloadStart + 8;
    i + 4 <= boxSize;
    i += 4
  ) {
    brands.push(buf.toString("ascii", i, i + 4));
  }

  return brands;
}

export function hasValidMagicBytes(
  mime: string,
  buf: Buffer,
): boolean {
  if (mime === "image/jpeg") {
    return (
      buf.length >= 3 &&
      buf[0] === 0xff &&
      buf[1] === 0xd8 &&
      buf[2] === 0xff
    );
  }

  if (mime === "image/png") {
    return (
      buf.length >= 8 &&
      buf.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      )
    );
  }

  if (mime === "image/webp") {
    return (
      buf.length >= 12 &&
      buf.toString("ascii", 0, 4) === "RIFF" &&
      buf.toString("ascii", 8, 12) === "WEBP"
    );
  }

  if (mime === "image/heic") {
    const brands = getFtypBrands(buf);
    return HEIC_BRANDS.some((brand) => brands.includes(brand));
  }

  if (mime === "image/heif") {
    const brands = getFtypBrands(buf);
    return HEIF_BRANDS.some((brand) => brands.includes(brand));
  }

  if (mime === "video/webm") {
    return (
      buf.length >= 8 &&
      buf.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) &&
      buf.subarray(4, Math.min(buf.length, 512)).includes(Buffer.from("webm"))
    );
  }

  const brands = getFtypBrands(buf);

  if (mime === "video/quicktime") {
    return brands.includes("qt  ");
  }

  if (mime === "video/3gpp") {
    return brands.some((brand) => /^3g[pq][0-9a-z ]$/.test(brand));
  }

  if (mime === "video/mp4") {
    return brands.some((brand) => MP4_BRANDS.includes(brand));
  }

  return false;
}
