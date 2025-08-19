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
    <div
      className="mx-0 mb-3 rounded-xl p-3 shadow-md flex items-center justify-between"
      style={{
        backgroundImage: "linear-gradient(to right, #8B5CF6, #EC4899)",
        color: "#fff",
      }}
    >
      <p className="text-sm font-medium" style={{ color: "#fff" }}>
        🙌 Hjelp oss å vokse! <span className="font-semibold">Del Stallplass.no</span> med andre
        hestevenner 🐴
      </p>
      <button
        onClick={handleShare}
        className="ml-3 shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          color: "#fff",
        }}
      >
        Del nå
      </button>
    </div>
  );
}
