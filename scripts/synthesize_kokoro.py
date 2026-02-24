#!/usr/bin/env python3
import argparse
from pathlib import Path
import time
import soundfile as sf
from kokoro_onnx import Kokoro


def main() -> int:
    p = argparse.ArgumentParser(description='Synthesize speech with Kokoro ONNX')
    p.add_argument('--text', required=True)
    p.add_argument('--out', required=True)
    p.add_argument('--voice', default='af_sarah')
    p.add_argument('--lang', default='en-us')
    p.add_argument('--speed', type=float, default=1.0)
    p.add_argument('--model', required=True)
    p.add_argument('--voices', required=True)
    p.add_argument('--compute', default='auto', choices=['auto', 'gpu', 'cpu'])
    args = p.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    t0 = time.perf_counter()
    # NOTE: current kokoro-onnx API does not expose provider selection in constructor.
    # Runtime provider selection is handled internally by onnxruntime environment.
    kokoro = Kokoro(args.model, args.voices)
    t1 = time.perf_counter()
    samples, sample_rate = kokoro.create(args.text, voice=args.voice, speed=args.speed, lang=args.lang)
    t2 = time.perf_counter()

    sf.write(str(out_path), samples, sample_rate)
    print(str(out_path))
    print(f'[kokoro compute_request={args.compute} load_ms={(t1-t0)*1000:.0f} synth_ms={(t2-t1)*1000:.0f}]')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
