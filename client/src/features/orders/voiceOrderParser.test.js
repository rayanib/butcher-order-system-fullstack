import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeVoiceTranscript,
  normalizeVoiceDigits,
  parseArabicNumber,
  parseVoiceOrder,
} from "./voiceOrderParser.js";

test("normalizes Arabic and Persian digits", () => {
  assert.equal(normalizeVoiceDigits("٠٥۰،٥"), "050.5");
});

test("parses numeric and spoken quantities", () => {
  assert.equal(parseArabicNumber("٢.٥ كغم"), 2.5);
  assert.equal(parseArabicNumber("نصف كيلو"), 0.5);
});

test("extracts a basic Arabic order draft", () => {
  const draft = parseVoiceOrder(
    "احمد 0501234567 شاورما ٢ كيلو بدون بهار بعد نص ساعة"
  );

  assert.equal(draft.name, "احمد");
  assert.equal(draft.phone, "0501234567");
  assert.equal(draft.item.name, "شاورما");
  assert.equal(draft.item.kg, 2);
  assert.equal(draft.pickupTime, "بعد 30 دقيقة");
  assert.equal(draft.orderNote, "بدون بهار");
});

test("merges final and live transcripts without duplicating text", () => {
  assert.equal(mergeVoiceTranscript("احمد شاورما", "شاورما"), "احمد شاورما");
  assert.equal(mergeVoiceTranscript("احمد", "شاورما"), "احمد شاورما");
});
