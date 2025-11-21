import React, { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import "./VideoPanel.css";

const VideoPanel = ({ videoUrl, onChapterEnter, chapterId }) => {
  const videoRef = useRef(null);
  const [ref, inView] = useInView({ threshold: 0.8 });
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    const handleUserInteraction = () => {
      setUserInteracted(true);
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
      window.removeEventListener("scroll", handleUserInteraction);
    };

    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("keydown", handleUserInteraction);
    window.addEventListener("scroll", handleUserInteraction);

    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
      window.removeEventListener("scroll", handleUserInteraction);
    };
  }, []);

  useEffect(() => {
    onChapterEnter(chapterId);
    const video = videoRef.current;
    if (!video) return;

    if (inView) {
      video.pause();
      video.currentTime = 0;

      if (userInteracted) {
        video.muted = false;
        video.play().catch(() => {});
      } else {
        video.muted = true;
        video.play().catch(() => {});
      }
    } else {
      video.pause();
    }
  }, [inView, onChapterEnter, chapterId, userInteracted]);

  return (
    <section ref={ref} className="video-panel">
      <div className="video-wrapper">
        <video
          ref={videoRef}
          preload="auto"
          width="100%"
          height="auto"
          controls="on="
          playsInline
        >
          <source src={videoUrl} type="video/mp4" />
          Tu navegador no soporta la reproducción de video.
        </video>
      </div>
    </section>
  );
};

export default VideoPanel;
