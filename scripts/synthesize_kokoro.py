#!/usr/bin/env python3
import argparse
from pathlib import Path
import soundfile as sf
from kokoro_onnx import Kokoro


def main() -> int:
    p = argparse.ArgumentParser(description="Synthesize speech with Kokoro ONNX")
    p.add_argument("--text", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--voice", default="af_sarah")
    p.add_argument("--lang", default="en-us")
    p.add_argument("--speed", type=float, default=1.0)
    p.add_argument("--model", required=True)
    p.add_argument("--voices", required=True)
    args = p.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    kokoro = Kokoro(args.model, args.voices)
    samples, sample_rate = kokoro.create(
        args.text,
        voice=args.voice,
        speed=args.speed,
        lang=args.lang,
    )
    sf.write(str(out_path), samples, sample_rate)
    print(str(out_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
