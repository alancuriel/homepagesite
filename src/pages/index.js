import React from "react"

import "../styles/global.css"

import settings from "../../static/home-config.json"

export default function Home() {
  return (
    <div className="container">
      <div
        className="content"
        style={{
          width: settings.style.consoleWidth,
          height: settings.style.consoleHeight,
          borderRadius: settings.style.consoleBorderRadius,
          backdropFilter: "blur(" + settings.style.consoleBlurStrength + ")",
          WebkitBackdropFilter:
            "blur(" + settings.style.consoleBlurStrength + ")",
          backgroundColor: settings.style.consoleBackgroundColor,
        }}
      >
        <p
          className="shell"
          style={{
            color: settings.style.consoleUsernameColor,
          }}
        >
          {settings.general.username}~&nbsp;
          <input
            className="consoleInput"
            spellCheck="false"
            style={{ color: settings.style.consoleTextColor }}
          ></input>
        </p>
      </div>
    </div>
  )
}
