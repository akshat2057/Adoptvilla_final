"use client";
import { useEffect, useState } from "react";
const storageKey = "adoptvilla-saved-pets-v1";
function readDeviceSaves() {
    var _a;
    try {
        const value = JSON.parse((_a = window.localStorage.getItem(storageKey)) !== null && _a !== void 0 ? _a : "[]");
        return Array.isArray(value) ? value.map(String) : [];
    }
    catch (_b) {
        return [];
    }
}
function writeDeviceSaves(ids) {
    window.localStorage.setItem(storageKey, JSON.stringify([...new Set(ids)]));
}
export default function PetActions({ petId, petName, demo }) {
    const [saved, setSaved] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [notice, setNotice] = useState("");
    useEffect(() => {
        const localTimer = window.setTimeout(() => setSaved(readDeviceSaves().includes(petId)), 0);
        fetch("/api/platform?resource=saved-pets")
            .then(async (response) => {
            var _a;
            if (!response.ok)
                return;
            const data = await response.json();
            setAuthenticated(true);
            const serverIds = (_a = data.petIds) !== null && _a !== void 0 ? _a : [];
            const merged = [...new Set([...readDeviceSaves(), ...serverIds])];
            writeDeviceSaves(merged);
            setSaved(merged.includes(petId));
        })
            .catch(() => undefined);
        return () => window.clearTimeout(localTimer);
    }, [petId]);
    const toggleSaved = async () => {
        const next = !saved;
        const previousIds = readDeviceSaves();
        const nextIds = next ? [...new Set([...previousIds, petId])] : previousIds.filter((id) => id !== petId);
        setSaved(next);
        writeDeviceSaves(nextIds);
        setNotice(next
            ? authenticated ? "Saved to your Adoptvilla account." : "Saved on this device. Sign in to keep it across devices."
            : "Removed from saved pets.");
        if (!authenticated)
            return;
        try {
            const response = await fetch("/api/platform", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ action: "toggle-saved-pet", petId, saved: next }),
            });
            if (!response.ok)
                throw new Error();
        }
        catch (_a) {
            setSaved(!next);
            writeDeviceSaves(previousIds);
            setNotice("We could not update your account. Please try again.");
        }
    };
    const share = async () => {
        const shareData = { title: `${petName} on Adoptvilla`, text: `See ${petName}’s adoption profile on Adoptvilla.`, url: window.location.href };
        try {
            if (navigator.share)
                await navigator.share(shareData);
            else {
                await navigator.clipboard.writeText(window.location.href);
                setNotice("Profile link copied.");
            }
        }
        catch (_a) {
            // A cancelled native share sheet does not need an error.
        }
    };
    return <div className="public-pet-actions">
    <button className={saved ? "saved" : ""} onClick={toggleSaved} aria-pressed={saved}>
      {saved ? "♥ Saved" : "♡ Save pet"}
    </button>
    <button onClick={share}>Share profile</button>
    {!demo && <a className="primary" href={`/login?return_to=${encodeURIComponent(`/dashboard?tab=Pet Fit Guide&petId=${petId}`)}`}>Check my compatibility →</a>}
    {demo && <a className="primary" href="/login?return_to=%2Fdashboard%3Ftab%3DPet%2520Fit%2520Guide">Build my compatibility profile →</a>}
    {notice && <p role="status">{notice}</p>}
  </div>;
}
