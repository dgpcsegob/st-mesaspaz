import React, { useState, useCallback } from "react";
import Map from "./components/Map";
import ScrollyPanel from "./components/ScrollyPanel";
import ImagePanel from "./components/ImagePanel";
import VideoPanel from "./components/VideoPanel";
import MapSwitcher from "./components/MapSwitcher";
import { chapters } from "./config/chapters";
import { FaTimes } from "react-icons/fa";
import "./App.css";
import "./components/MapSwitcher.css";

const mapStyles = {
  Claro: "https://www.mapabase.atdt.gob.mx/style_white_3d_places.json",
  Satelital: "https://www.mapabase.atdt.gob.mx/style_satellite.json",
};

function App() {
  const [activeChapterId, setActiveChapterId] = useState(Object.keys(chapters)[0]);
  const [styleUrl, setStyleUrl] = useState(mapStyles.Claro);
  const [isPulsing, setIsPulsing] = useState(false);
  const [globalPhotoUrl, setGlobalPhotoUrl] = useState(null);

  const handleChapterEnter = useCallback((chapterId) => {
    setActiveChapterId(chapterId);
  }, []);

  const handleStyleChange = (newStyle) => {
    setStyleUrl(newStyle);
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 400);
  };

  const activeChapter = chapters[activeChapterId];

  const openPhoto = (url) => {
    setGlobalPhotoUrl(url);
  };

  const closePhoto = () => {
    setGlobalPhotoUrl(null);
  };

  return (
    <div className="app-container">
      <div className="scrolly-column">
        {Object.values(chapters).map((chapter, index) => {
          let classNames = [];
          if (index === 0) classNames.push("is-title-card");
          if (chapter.id === activeChapterId) classNames.push("is-active");

          if (chapter.imageUrl) {
            return (
              <ImagePanel
                key={chapter.id}
                imageUrl={chapter.imageUrl}
                title={chapter.title}
                description={chapter.description}
                stats={chapter.stats}
                chapterId={chapter.id}
                onChapterEnter={handleChapterEnter}
                photoUrl={chapter.photoUrl}
                onOpenPhoto={openPhoto}
              />
            );
          }

          if (chapter.videoUrl) {
            return (
              <VideoPanel
                key={chapter.id}
                videoUrl={chapter.videoUrl}
                chapterId={chapter.id}
                onChapterEnter={handleChapterEnter}
              />
            );
          }

          return (
            <ScrollyPanel
              key={chapter.id}
              chapter={chapter}
              onChapterEnter={handleChapterEnter}
              className={classNames.join(" ")}
              onOpenPhoto={openPhoto}
            />
          );
        })}
      </div>

      {activeChapter && !activeChapter.imageUrl && activeChapter.location && (
        <div className={`map-column ${isPulsing ? "is-pulsing" : ""}`}>
          <MapSwitcher
            styles={mapStyles}
            activeStyle={styleUrl}
            onStyleChange={handleStyleChange}
          />
          <Map
            location={activeChapter.location}
            activeChapterId={activeChapterId}
            styleUrl={styleUrl}
          />
        </div>
      )}

      {globalPhotoUrl && (
        <div className="photo-overlay" onClick={closePhoto}>
          <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-photo" onClick={closePhoto}>
              <FaTimes />
            </button>
            <img src={globalPhotoUrl} alt="Fotografía" />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
