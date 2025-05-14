import { useState, useEffect } from 'react';

export default function useStorage(storageKey, initialValue) {

    const savedData = JSON.parse(localStorage.getItem(storageKey));

    const [data, setData] = useState(savedData ? savedData : initialValue);

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(data));
    }, [storageKey, data]);

    return [data, setData];
}
