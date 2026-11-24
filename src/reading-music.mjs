/** Optional local music, supplied by a host using the Baroque room's transport. */
export class ReadingMusic {
  constructor(config, onState) {
    this.config = config;
    this.onState = onState;
    this.version = 0;
  }

  get playing() { return Boolean(this.pending || this.transport?.playing); }

  async start(piece, volume) {
    if (this.pending) return;
    if (this.transport && this.current === piece.id) {
      await this.transport.play();
      this.onState(this.transport.playing);
      return;
    }

    this.stop();
    // Start Web Audio in the user's tap, before loading any score data or modules.
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Context) throw new Error('Audio playback is unavailable here.');
    const context = new Context();
    this.context = context;
    const version = ++this.version;
    this.abort = new AbortController();
    this.pending = true;

    try {
      const activated = context.resume();
      const [library, response] = await Promise.all([
        import(this.config.module),
        fetch(piece.notes, {signal: this.abort.signal, credentials: 'same-origin'}),
        activated,
      ]);
      if (!response.ok) throw new Error('The selected piece could not load.');
      const study = await response.json();
      if (version !== this.version) return;
      const transport = new library.KeyboardTransport(() => {}, () => this.onState(false));
      transport.load(study);
      transport.setTimbre('piano');
      transport.setVolume(volume / 100);
      transport.initialize(context);
      this.transport = transport;
      this.current = piece.id;
      await transport.play();
      if (version === this.version) this.onState(transport.playing);
    } catch (error) {
      if (version !== this.version) return;
      this.stop();
      throw error;
    } finally {
      if (version === this.version) this.pending = false;
    }
  }

  setVolume(volume) {
    this.transport?.setVolume(volume / 100);
  }

  pause() {
    if (this.pending) this.stop();
    else {
      this.transport?.pause();
      this.onState(false);
    }
  }

  stop() {
    this.version++;
    this.pending = false;
    this.abort?.abort();
    if (this.transport) void this.transport.dispose().catch(() => {});
    else if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {});
    this.transport = this.context = null;
    this.current = '';
    this.onState(false);
  }
}
