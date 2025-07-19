import React from "react";
import Discord from "@/icons/Discord.astro";
import Facebook from "@/icons/Facebook.astro";
import GitHub from "@/icons/GitHub.astro";
import Instagram from "@/icons/Instagram.astro";
import Link from "@/icons/Link.astro";
import LinkedIn from "@/icons/LinkedIn.astro";
import Mail from "@/icons/Mail.astro";
import Map from "@/icons/Map.astro";
import Medium from "@/icons/Medium.astro";
import Spotify from "@/icons/Spotify.astro";
import TikTok from "@/icons/TikTok.astro";
import Twitch from "@/icons/Twitch.astro";
import WhatsApp from "@/icons/WhatsApp.astro";
import X from "@/icons/X.astro";
import Steam from "@/icons/Steam.astro";
import YouTube from "@/icons/YouTube.astro";

const SOCIAL_ICONS = {
  Discord,
  Facebook,
  GitHub,
  Instagram,
  Link,
  LinkedIn,
  Mail,
  Map,
  Medium,
  Spotify,
  TikTok,
  Twitch,
  WhatsApp,
  X,
  Steam,
  YouTube
};

export default function SocialLinks({ socials }) {
  return (
    <div className="container">
      {socials.map(({ network, url }, idx) => {
        const Icon = SOCIAL_ICONS[network];
        return (
          <a
            key={network + idx}
            href={url}
            aria-label={`Viziteaza profilul de ${network}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => {
              e.preventDefault();
              const win = window.open("about:blank", "_blank");
              if (win) {
                setTimeout(() => {
                  win.location = url;
                }, 3000); // delay de 3 secunde
              }
            }}
          >
            <Icon />
          </a>
        );
      })}
    </div>
  );
}