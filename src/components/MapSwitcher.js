import React from "react";

const MapSwitcher = ({ styles, activeStyle, onStyleChange }) => {
  return (
    <div className="map-switcher">
      {Object.keys(styles).map((styleId) => (
        <button
          key={styleId}
          className={`style-button ${
            activeStyle === styles[styleId] ? "active" : ""
          }`}
          onClick={() => onStyleChange(styles[styleId])}
        >
          {styleId}
        </button>
      ))}
    </div>
  );
};

export default MapSwitcher;
