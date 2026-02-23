#!/usr/bin/env python3
import argparse
from faster_whisper import WhisperModel


def main() -> int:
    p = argparse.ArgumentParser(description="Transcribe audio with faster-whisper")
    p.add_argument("--input", required=True)
    p.add_argument("--model", default="medium")
    p.add_argument("--device", default="cpu")
    p.add_argument("--compute", default="int8")
    p.add_argument("--lang", default=None)
    p.add_argument("--beam", type=int, default=5)
    args = p.parse_args()

    model = WhisperModel(args.model, device=args.device, compute_type=args.compute)
    segments, info = model.transcribe(
        args.input,
        language=args.lang,
        vad_filter=True,
        beam_size=args.beam,
    )
    text = " ".join(seg.text.strip() for seg in segments).strip()
    detected = getattr(info, "language", None)
    prob = getattr(info, "language_probability", None)
    print(text)
    if detected:
        print(f"\n[lang={detected} prob={prob}]")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
