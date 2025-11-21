import React, { useRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { FaCamera } from "react-icons/fa";
import "./ImagePanel.css";

const ImagePanel = ({
  imageUrl,
  title,
  description,
  stats,
  onChapterEnter,
  chapterId,
  photoUrl,
  onOpenPhoto,
}) => {
  const textRef = useRef(null);
  const [ref, inView] = useInView({ threshold: 0.3 });

  useEffect(() => {
    if (inView && onChapterEnter) {
      onChapterEnter(chapterId);
    }
    if (textRef.current) {
      textRef.current.style.opacity = inView ? "1" : "0";
      textRef.current.style.transform = inView ? "translateY(0)" : "translateY(20px)";
    }
  }, [inView, onChapterEnter, chapterId]);

  return (
    <section
      ref={ref}
      className={`image-panel-fixed ${inView ? "in-view" : ""}`}
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      <div ref={textRef} className="panel-content">
        {photoUrl && (
          <div className="camera-button" onClick={() => onOpenPhoto(photoUrl)}>
            <FaCamera />
          </div>
        )}
        {title && <h2>{title}</h2>}
        {description && <p>{description}</p>}
        {stats && (
          <ul className="styled-list">
            {stats.map((stat, index) => (
              <li key={index}>
                <span className="icon">&#8226;</span>{" "}
                {stat.value && <strong>{stat.value}</strong>} {stat.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default ImagePanel;
