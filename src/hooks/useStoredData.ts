/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { useCallback, useEffect, useState } from 'react';
import { subscribeToDataChanges } from '../database/repository';

export interface StoredDataState<T> {
  readonly data: T;
  readonly loading: boolean;
  readonly error: string;
  readonly reload: () => void;
}

export function useStoredData<T>(loader: () => Promise<T>, initialValue: T): StoredDataState<T> {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => subscribeToDataChanges(reload), [reload]);

  useEffect(() => {
    let active = true;
    loader()
      .then((value) => {
        if (!active) return;
        setData(value);
        setError('');
      })
      .catch(() => {
        if (!active) return;
        setError('ไม่สามารถอ่านข้อมูลที่บันทึกในเครื่องได้');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loader, revision]);

  return { data, loading, error, reload };
}
