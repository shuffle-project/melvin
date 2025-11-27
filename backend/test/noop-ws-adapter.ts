export class NoopWsAdapter {
  create() {
    return {}; // dummy server
  }
  bindMessageHandlers() {}
  bindClientConnect() {}
  bindClientDisconnect() {}
  close() {}
  dispose() {}
}
