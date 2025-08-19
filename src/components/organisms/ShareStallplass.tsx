import React from "react";

export default function ShareStallplass() {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Stallplass.no 🐴",
          text: "Sjekk ut Stallplass.no – finn og del stallplasser, hester og tjenester!",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Deling avbrutt", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Lenken er kopiert til utklippstavlen 📋");
      } catch (err) {
        console.error("Kunne ikke kopiere lenke", err);
      }
    }
  };

  return (
    <div className="mx-0 mb-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 p-3 text-white shadow-md flex items-center justify-between">
      <p className="text-sm font-medium">
        🙌 Hjelp oss å vokse! <span className="font-semibold">Del Stallplass.no</span> med andre
        hestevenner 🐴
      </p>
      <button
        onClick={handleShare}
        className="ml-3 shrink-0 rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition"
      >
        Del nå
      </button>
    </div>
  );
}
