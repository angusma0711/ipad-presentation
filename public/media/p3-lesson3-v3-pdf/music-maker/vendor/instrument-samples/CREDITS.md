# Instrument recordings

The embedded recordings in `js/instrument-samples.js` are actual instrument
samples, not synthesized approximations. `manifest.json` records the pinned
upstream URLs, original byte lengths and SHA-256 checksums for each recording.
Samples are unmodified, apart from base64 encoding for offline delivery.
Playback normalizes each recording to a peak of 0.85, repitches nearby samples,
and applies gain and attack/release envelopes.

- Piano, contrabass and flute: Versilian Studios, VSCO 2 Community Edition,
  distributed by N. P. Brosowsky's [tonejs-instruments collection](https://github.com/nbrosowsky/tonejs-instruments).
- Cello: Freesound contributor **flcellogrl**, “real cello notes” (pack 12408),
  edited and distributed by the same tonejs-instruments collection.
- Those four sample sets are distributed under the collection's
  [Creative Commons Attribution 3.0 licence](https://creativecommons.org/licenses/by/3.0/).
  Original sample-source information is preserved in `upstream-source-info.txt`.
- Bells: medium dynamic glockenspiel recordings from **Sam Gossner / Versilian
  Studios**, [Versilian Community Sample Library (VCSL)](https://github.com/sgossner/VCSL),
  CC0 1.0. Full licence: `VCSL-LICENSE.txt`.

This app uses one recorded dynamic layer per instrument. The existing Dynamics
cards adjust playback gain; they do not switch between different performances.
The string instruments use bowed recordings. Bells are a glockenspiel timbre.
