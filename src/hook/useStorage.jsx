import { useState, useEffect } from "react";
import storageService from "../utils/storageService";

export default function useStorage(storageKey, initialValue) {
    const savedData = storageService.getItem(storageKey, null);

    const [data, setData] = useState(savedData !== null ? savedData : initialValue);

    useEffect(() => {
        storageService.setItem(storageKey, data);
    }, [storageKey, data]);

    return [data, setData];
}
