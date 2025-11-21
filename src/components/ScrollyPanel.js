import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { FaCamera } from "react-icons/fa";
import "./ScrollyPanel.css";

const ScrollyPanel = ({ chapter, onChapterEnter, className, onOpenPhoto }) => {
  const { ref, inView } = useInView({ threshold: 0.5 });

  useEffect(() => {
    if (inView) {
      onChapterEnter(chapter.id);
    }
  }, [inView, chapter.id, onChapterEnter]);

  const panelClasses = `scrolly-panel ${className || ""}`;

  const renderTitle = () => {
    if (chapter.id === "titulo") {
      return (
        <div className="logo-container">
          <img src="data/images/goberw.png" alt="Secretaría de Gobernación" className="gobernacion-logo" />
          <div className="custom-title">
            <div className="main-title">MESAS DE PAZ</div>
            <div className="subtitle-bold">CELAYA, GUANAJUATO</div>
            <div className="subtitle-bold">DIRECCIÓN GENERAL DE</div>
            <div className="subtitle-bold">PARTICIPACIÓN Y CONSULTAS</div>
            <div className="subtitle-light">Noviembre 2024 - Julio 2025</div>
          </div>
          <div className="flecha-container">
            <svg className="flecha-svg" viewBox="0 0 32 10">
              <path d="M1 1L16 9L31 1" stroke="white" strokeWidth="2" />
            </svg>
          </div>
        </div>
      );
    }
    return <h2>{chapter.title}</h2>;
  };

  return (
    <section ref={ref} className={panelClasses}>
      <div className="scrolly-panel-content">
        {renderTitle()}

        {chapter.photoUrl && chapter.id !== "titulo" && (
          <button className="camera-button" onClick={() => onOpenPhoto(chapter.photoUrl)} aria-label="Ver imagen">
            <FaCamera />
          </button>
        )}

        {chapter.description && (
          <div dangerouslySetInnerHTML={{ __html: formatDescription(chapter.description) }} />
        )}

        {chapter.stats && (
          <ul className="styled-list">
            {chapter.stats.map((stat, index) => (
              <li key={index}>
                <span className="icon">&#8226;</span> {stat.value && <strong>{stat.value}</strong>} {stat.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

function formatDescription(text) {
  if (!text) return "";
  let paragraphs = text.split(/\n\s*\n/);
  return paragraphs
    .map(paragraph => {
      const isList = paragraph.trim().startsWith("- ");
      if (!isList) return `<p>${paragraph.trim()}</p>`;
      const items = paragraph
        .split("\n")
        .map(item => item.trim().replace(/^- /, ""))
        .filter(Boolean);
      const listItems = items.map(item => `<li><span class="icon">&#8226;</span> ${item}</li>`).join("");
      return `<ul class="styled-list">${listItems}</ul>`;
    })
    .join("");
}

export default ScrollyPanel;