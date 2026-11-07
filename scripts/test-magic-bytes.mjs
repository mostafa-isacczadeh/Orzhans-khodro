import test from "node:test";
import assert from "node:assert/strict";
import { hasValidMagicBytes } from "../src/lib/magic-bytes.ts";

const ftyp = (brand) => {
  const b = Buffer.alloc(16);
  b.writeUInt32BE(16, 0);
  b.write("ftyp", 4);
  b.write(brand, 8);
  return b;
};

const samples = [
  ["image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0xe0])],
  ["image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  ["image/webp", Buffer.from("RIFF0000WEBP")],
  ["image/heic", ftyp("heic")],
  ["image/heif", ftyp("mif1")],
  ["video/mp4", ftyp("isom")],
  ["video/quicktime", ftyp("qt  ")],
  ["video/webm", Buffer.concat([
    Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
    Buffer.from("webm"),
  ])],
  ["video/3gpp", ftyp("3gp4")],
];

test("تمام ۹ فرمت معتبر پذیرفته شوند", () => {
  for (const [mime, buffer] of samples) {
    assert.equal(
      hasValidMagicBytes(mime, buffer),
      true,
      `${mime} باید پذیرفته شود`
    );
  }
});

test("محتوای جعلی با MIME مجاز رد شود", () => {
  const fake = Buffer.from("this is not a valid media signature");

  for (const [mime] of samples) {
    assert.equal(
      hasValidMagicBytes(mime, fake),
      false,
      `${mime} نباید محتوای جعلی را بپذیرد`
    );
  }
});

test("فایل خالی و امضای ناقص رد شوند", () => {
  for (const [mime] of samples) {
    assert.equal(hasValidMagicBytes(mime, Buffer.alloc(0)), false);
    assert.equal(hasValidMagicBytes(mime, Buffer.from([0x00])), false);
  }
});

test("MIME ناشناخته رد شود", () => {
  assert.equal(
    hasValidMagicBytes("application/octet-stream", Buffer.from("anything")),
    false
  );
});
