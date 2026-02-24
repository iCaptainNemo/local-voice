#!/usr/bin/env python3
import argparse
import os
from pathlib import Path
from faster_whisper import WhisperModel


def ensure_cuda_dll_path():
    base = Path.home() / 'voice' / 'stt' / '.venv' / 'Lib' / 'site-packages' / 'nvidia'
    bins = [
        base / 'cublas' / 'bin',
        base / 'cudnn' / 'bin',
    ]
    existing = [str(p) for p in bins if p.exists()]
    if existing:
        os.environ['PATH'] = ';'.join(existing + [os.environ.get('PATH', '')])


def transcribe_with_model(model, input_path, lang, beam):
    return model.transcribe(
        input_path,
        language=lang,
        vad_filter=True,
        beam_size=beam,
    )


def main() -> int:
    p = argparse.ArgumentParser(description='Transcribe audio with faster-whisper')
    p.add_argument('--input', required=True)
    p.add_argument('--model', default='small')
    p.add_argument('--lang', default=None)
    p.add_argument('--beam', type=int, default=5)
    args = p.parse_args()

    ensure_cuda_dll_path()

    mode = 'cpu/int8'
    cpu_model = WhisperModel(args.model, device='cpu', compute_type='int8')

    try:
        gpu_model = WhisperModel(args.model, device='cuda', compute_type='float16')
        try:
            segments, info = transcribe_with_model(gpu_model, args.input, args.lang, args.beam)
            mode = 'cuda/float16'
        except Exception:
            segments, info = transcribe_with_model(cpu_model, args.input, args.lang, args.beam)
    except Exception:
        segments, info = transcribe_with_model(cpu_model, args.input, args.lang, args.beam)

    text = ' '.join(seg.text.strip() for seg in segments).strip()
    detected = getattr(info, 'language', None)
    prob = getattr(info, 'language_probability', None)
    print(text)
    if detected:
        print(f'\n[lang={detected} prob={prob} mode={mode}]')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

