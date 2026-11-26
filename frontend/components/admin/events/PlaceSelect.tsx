'use client';

import { useEffect, useId, useState, type Ref } from 'react';
import type { Place } from '@/types/event';
import { fetchPlaces } from '@/services/events';
import { buttonClass, inputClass, Spinner } from './FormUI';

export default function PlaceSelect({ value, currentName, onChange, onBlur, inputRef, invalid, describedBy }: {
  value: string; currentName: string; onChange: (place?: Place) => void; onBlur: () => void; inputRef: Ref<HTMLSelectElement>; invalid: boolean; describedBy?: string;
}) {
  const [keyword, setKeyword] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const searchId = useId();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const timer = setTimeout(() => {
      fetchPlaces(keyword, controller.signal).then(results => {
        if (controller.signal.aborted) return;
        setPlaces(results);
        const match = results.find(place => place.id === value);
        if (match) setSelected(match);
      }).catch(() => { if (!controller.signal.aborted) setError('Không tải được địa điểm. Vui lòng thử lại.'); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [keyword, value, retry]);

  const options = selected?.id === value && !places.some(place => place.id === value) ? [selected, ...places] : places;
  return <div className="space-y-2">
    <label htmlFor={searchId} className="sr-only">Tìm địa điểm theo tên hoặc địa chỉ</label>
    <input id={searchId} type="search" value={keyword} onChange={event => setKeyword(event.target.value)} className={inputClass} placeholder="Tìm theo tên hoặc địa chỉ…" />
    <select id="placeId" ref={inputRef} onBlur={onBlur} value={value} onChange={event => {
      const place = options.find(item => item.id === event.target.value);
      setSelected(place);
      onChange(place);
    }} aria-invalid={invalid} aria-describedby={describedBy} aria-busy={loading} className={inputClass}>
      <option value="">Chọn địa điểm có sẵn</option>
      {value && !options.some(place => place.id === value) && <option value={value}>{currentName || `Địa điểm #${value}`}</option>}
      {options.map(place => <option key={place.id} value={place.id}>{place.name} — {place.address}</option>)}
    </select>
    <div role="status" className="text-xs text-slate-500">
      {loading ? <span className="inline-flex items-center gap-2"><Spinner />Đang tìm địa điểm…</span> : !error && places.length === 0 ? 'Không tìm thấy địa điểm phù hợp.' : null}
    </div>
    {error && <div role="alert" className="text-sm text-red-600">{error} <button type="button" className={buttonClass} onClick={() => setRetry(value => value + 1)}>Thử lại</button></div>}
  </div>;
}
