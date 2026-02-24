#!/usr/bin/env python3
import argparse
from faster_whisper import WhisperModel


def transcribe_with_model(model, input_path, lang, beam):
    return model.transcribe(
        input_path,
        language=lang,
        vad_filter=True,
        beam_size=beam,
    )


def main() -> int:
    p = argparse.ArgumentParser(description="Transcribe audio with faster-whisper")
    p.add_argument("--input", required=True)
    p.add_argument("--model", default="medium")
    p.add_argument("--lang", default=None)
    p.add_argument("--beam", type=int, default=5)
    args = p.parse_args()

    mode = "cpu/int8"
    model = WhisperModel(args.model, device="cpu", compute_type="int8")

    # Try GPU first, but fallback if either load or inference fails.
    try:
      gpu_model = WhisperModel(args.model, device="cuda", compute_type="float16")
      try:
          segments, info = transcribe_with_model(gpu_model, args.input, args.lang, args.beam)
          model = None
          mode = "cuda/float16"
      except Exception:
          segments, info = transcribe_with_model(model, args.input, args.lang, args.beam)
    except Exception:
      segments, info = transcribe_with_model(model, args.input, args.lang, args.beam)

    text = " ".join(seg.text.strip() for seg in segments).strip()
    detected = getattr(info, "language", None)
    prob = getattr(info, "language_probability", None)
    print(text)
    if detected:
        print(f"\n[lang={detected} prob={prob} mode={mode}]")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
