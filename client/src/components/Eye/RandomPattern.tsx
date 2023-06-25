import React, { useEffect, useState } from 'react';
import paper, { Point, Path, Color, Gradient, GradientStop } from 'paper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPalette } from '@fortawesome/free-solid-svg-icons';

interface PatternProps {
  backgroundColor: string,
  handleBackgroundColorChange: (color: string) => void;
}

const useRandomPattern = (colorRange) => {
  useEffect(() => {
    const values = {
      paths: 50,
      minPoints: 5,
      maxPoints: 15,
      minRadius: 30,
      maxRadius: 90,
    };

    const hitOptions = {
      segments: true,
      stroke: true,
      fill: true,
      tolerance: 5,
    };

    const generatePaths = () => {
      const radiusDelta = values.maxRadius - values.minRadius;
      const pointsDelta = values.maxPoints - values.minPoints;
      const canvasWidth = paper.view.size.width;
      const canvasHeight = paper.view.size.height;

      for (let i = 0; i < values.paths; i++) {
        const radius = (values.minRadius + Math.random() * radiusDelta) * 2;
        const points = values.minPoints + Math.floor(Math.random() * pointsDelta);
        const position = new Point(
          Math.random() * canvasWidth,
          Math.random() * canvasHeight
        );
        const path = generateRandomShape(position, radius, points);

        const gradient = new Gradient({
          stops: [
            new GradientStop(generateRandomColor(), 0),
            new GradientStop(generateRandomColor(), 1),
          ],
        });
        const gradientRadius = Math.max(path.bounds.width, path.bounds.height) * 0.5;
        const gradientOrigin = path.bounds.center.subtract([gradientRadius, gradientRadius]);
        const gradientDestination = path.bounds.center.add([gradientRadius, gradientRadius]);
        path.fillColor = new Color(gradient, gradientOrigin, gradientDestination);

        path.strokeColor = generateRandomColor();
        path.strokeWidth = Math.random() * 4 - 2;
        path.shadowColor = new Color(0, 0, 0, 0.1);
        path.shadowBlur = 10;
        path.shadowOffset = new Point(0, 4);
        path.smooth();
      }
    };

    const generateRandomShape = (center, maxRadius, sides) => {
      const path = new Path();
      path.closed = true;

      for (let i = 0; i < sides; i++) {
        const delta = new Point({
          length: maxRadius * 0.5 + Math.random() * maxRadius * 0.5,
          angle: (360 / sides) * i,
        });
        path.add(center.add(delta));
      }

      path.smooth();
      return path;
    };

    const generateRandomColor = () => {
      const { minHue, maxHue, minSaturation, maxSaturation, minLightness, maxLightness } = colorRange;
      const hue = minHue + Math.random() * (maxHue - minHue);
      const saturation = minSaturation + Math.random() * (maxSaturation - minSaturation);
      const lightness = minLightness + Math.random() * (maxLightness - minLightness);
      return new Color({ hue, saturation, lightness });
    };

    let segment = null;
    let path = null;
    let movePath = false;

    const handleMouseDown = (e) => {
      segment = path = null;
      const hitResult = paper.project.hitTest(e.point, hitOptions);
      if (!hitResult) return;

      if (e.modifiers.shift) {
        if (hitResult.type === 'segment') {
          hitResult.segment.remove();
        }
        return;
      }

      if (hitResult) {
        path = hitResult.item;
        if (hitResult.type === 'segment') {
          segment = hitResult.segment;
        } else if (hitResult.type === 'stroke') {
          const location = hitResult.location;
          segment = path.insert(location.index + 1, e.point);
          path.smooth();
        }
      }
      movePath = hitResult.type === 'fill';
      if (movePath) {
        paper.project.activeLayer.addChild(hitResult.item);
      };
    };

    const handleMouseMove = (e) => {
      paper.project.activeLayer.selected = false;
      if (e.item) {
        e.item.selected = true;
      }
    };

    const handleMouseDrag = (e) => {
      if (segment) {
        segment.point = segment.point.add(e.delta);
        path.smooth();
      } else if (path) {
        path.position = path.position.add(e.delta);
      }
    };

    paper.setup('canvas');

    generatePaths();

    paper.view.onMouseDown = handleMouseDown;
    paper.view.onMouseMove = handleMouseMove;
    paper.view.onMouseDrag = handleMouseDrag;

    return () => {
      paper.view.onMouseDown = null;
      paper.view.onMouseMove = null;
      paper.view.onMouseDrag = null;
      paper.project.remove();
    };
  }, [colorRange]);
};

const RandomPattern: React.FC<PatternProps> = ({ backgroundColor, handleBackgroundColorChange }) => {
  const [colorRange, setColorRange] = useState({
    minHue: 0,
    maxHue: 360,
    minSaturation: 0,
    maxSaturation: 1,
    minLightness: 0.4,
    maxLightness: 0.8,
  });

  useRandomPattern(colorRange);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '5%' }}>
        {/* Hue Sliders */}
        <div style={{ padding: '1rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <input
              type="color"
              id="bg-color"
              value={backgroundColor}
              onChange={handleBackgroundColorChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              style={{ padding: '0.5rem', color: 'white', fontSize: '2.5rem', background: 'none', border: 'none' }}
              onClick={() => document.getElementById('bg-color')?.click()}
            >
              <FontAwesomeIcon icon={faPalette} />
            </button>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>Hue</div>
          <div style={{ marginBottom: '0.5rem' }}>
            <input
              type="range"
              min="0"
              max="360"
              value={colorRange.minHue}
              onChange={(e) =>
                setColorRange((prevRange) => ({
                  ...prevRange,
                  minHue: parseInt(e.target.value),
                }))
              }
            />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <input
              type="range"
              min="0"
              max="360"
              value={colorRange.maxHue}
              onChange={(e) =>
                setColorRange((prevRange) => ({
                  ...prevRange,
                  maxHue: parseInt(e.target.value),
                }))
              }
            />
          </div>
        </div>
        {/* Saturation Sliders */}
        <div style={{ padding: '1rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>Saturation</div>
          <div style={{ marginBottom: '0.5rem' }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={colorRange.minSaturation}
              onChange={(e) =>
                setColorRange((prevRange) => ({
                  ...prevRange,
                  minSaturation: parseFloat(e.target.value),
                }))
              }
            />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={colorRange.maxSaturation}
              onChange={(e) =>
                setColorRange((prevRange) => ({
                  ...prevRange,
                  maxSaturation: parseFloat(e.target.value),
                }))
              }
            />
          </div>
        </div>
        {/* Lightness Sliders */}
        <div style={{ padding: '1rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>Lightness</div>
          <div style={{ marginBottom: '0.5rem' }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={colorRange.minLightness}
              onChange={(e) =>
                setColorRange((prevRange) => ({
                  ...prevRange,
                  minLightness: parseFloat(e.target.value),
                }))
              }
            />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={colorRange.maxLightness}
              onChange={(e) =>
                setColorRange((prevRange) => ({
                  ...prevRange,
                  maxLightness: parseFloat(e.target.value),
                }))
              }
            />
          </div>
        </div>
      </div>
      <div>
        <canvas id="canvas" style={{ width: '100vw', height: '100vh', backgroundColor }} />
      </div>
    </div>
  );

};

export default RandomPattern;
