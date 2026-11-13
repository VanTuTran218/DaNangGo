export type FavoriteStatus = 'idle' | 'loading' | 'ready' | 'error';
export interface FavoriteSnapshot {
  owner: string | null;
  status: FavoriteStatus;
  ids: ReadonlySet<number>;
  pending: ReadonlySet<number>;
  error: string | null;
  revision: number;
}
export interface FavoriteTransport {
  getIds(signal: AbortSignal): Promise<number[]>;
  set(placeId: number, saved: boolean, signal: AbortSignal): Promise<void>;
}
export const initialFavorites: FavoriteSnapshot = {
  owner: null, status: 'idle', ids: new Set(), pending: new Set(), error: null, revision: 0,
};
export const validPlaceId = (id: number) => Number.isInteger(id) && id > 0 && id <= 2147483647;

/** Account-scoped state shared by every button. Server-confirmed updates only. */
export class FavoritesStore {
  private snapshot: FavoriteSnapshot = initialFavorites;
  private listeners = new Set<() => void>();
  private generation = 0;
  private readVersion = 0;
  private reading?: AbortController;
  private writes = new Map<number, AbortController>();
  private refreshAfterWrites = false;
  private transport: FavoriteTransport;
  constructor(transport: FavoriteTransport) { this.transport = transport; }
  getSnapshot = () => this.snapshot;
  getSession = () => this.generation;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(update: Partial<FavoriteSnapshot>) {
    this.snapshot = { ...this.snapshot, ...update };
    this.listeners.forEach(listener => listener());
  }
  changeOwner(owner: string | null) {
    this.generation++; this.readVersion++;
    this.reading?.abort(); this.writes.forEach(controller => controller.abort());
    this.writes.clear(); this.refreshAfterWrites = false;
    this.publish({ owner, status: owner ? 'idle' : 'ready', ids: new Set(), pending: new Set(), error: null, revision: 0 });
  }
  async reload(): Promise<boolean> {
    const owner = this.snapshot.owner;
    if (!owner) return false;
    if (this.writes.size) { this.refreshAfterWrites = true; return false; }
    this.reading?.abort();
    const controller = new AbortController(); this.reading = controller;
    const version = ++this.readVersion, generation = this.generation;
    this.publish({ status: 'loading', error: null });
    try {
      const ids = await this.transport.getIds(controller.signal);
      if (controller.signal.aborted || generation !== this.generation || version !== this.readVersion) return false;
      if (!Array.isArray(ids) || !ids.every(validPlaceId)) throw new Error('Danh sách yêu thích từ máy chủ không hợp lệ.');
      this.publish({ ids: new Set(ids), status: 'ready', error: null, revision: this.snapshot.revision + 1 });
      return true;
    } catch (error) {
      if (controller.signal.aborted || generation !== this.generation || version !== this.readVersion) return false;
      this.publish({ status: 'error', error: error instanceof Error ? error.message : 'Không tải được yêu thích. Bạn thử lại nhé.' });
      return false;
    } finally { if (this.reading === controller) this.reading = undefined; }
  }
  async setFavorite(placeId: number, saved: boolean): Promise<boolean> {
    if (!this.snapshot.owner || this.snapshot.status !== 'ready' || !validPlaceId(placeId) || this.writes.has(placeId) || this.refreshAfterWrites) return false;
    const generation = this.generation, controller = new AbortController();
    this.writes.set(placeId, controller);
    this.publish({ pending: new Set(this.writes.keys()), error: null });
    let succeeded = false;
    try {
      await this.transport.set(placeId, saved, controller.signal);
      if (generation !== this.generation || controller.signal.aborted) return false;
      const ids = new Set(this.snapshot.ids);
      if (saved) ids.add(placeId); else ids.delete(placeId);
      this.publish({ ids, revision: this.snapshot.revision + 1 });
      succeeded = true;
    } catch (error) {
      if (generation !== this.generation || controller.signal.aborted) return false;
      // A lost response can occur after the server committed: re-read before another change.
      this.refreshAfterWrites = true;
      this.publish({ error: error instanceof Error ? error.message : 'Không cập nhật được yêu thích.' });
    } finally {
      if (generation === this.generation && this.writes.get(placeId) === controller) {
        this.writes.delete(placeId); this.publish({ pending: new Set(this.writes.keys()) });
        if (!this.writes.size && this.refreshAfterWrites) {
          this.refreshAfterWrites = false;
          await this.reload();
        }
      }
    }
    return succeeded && generation === this.generation;
  }
  toggle = (placeId: number) => this.setFavorite(placeId, !this.snapshot.ids.has(placeId));
}
