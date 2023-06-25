import React, { useEffect, useRef } from 'react';
import p5 from 'p5';
import { FaSave } from 'react-icons/fa';

const GenerativeArt = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Create p5 sketch
    const sketch = (p) => {
      let paths = [];
      let painting = false;
      let next = 0;
      let current;
      let previous;

      p.setup = () => {
        const container = document.querySelector('.body-container');
        const canvasWidth = container?.clientWidth;
        const canvasHeight = container?.clientHeight;
        p.createCanvas(canvasWidth, canvasHeight, p.WEBGL).parent(canvasRef.current);
        p.background(61, 57, 131); // Set background color to #3d3983
        current = p.createVector(0, 0, 0);
        previous = p.createVector(0, 0, 0);
      };

      p.draw = () => {
        p.background(61, 57, 131); // Set background color to #3d3983

        if (p.millis() > next && painting) {
          current.x = p.mouseX - p.width / 2;
          current.y = p.mouseY - p.height / 2;
          current.z = p.random(-100, 100);

          let force = p5.Vector.sub(current, previous);
          force.mult(0.05);

          paths[paths.length - 1].add(current, force);

          next = p.millis() + p.random(100);

          previous.x = current.x;
          previous.y = current.y;
          previous.z = current.z;
        }

        p.orbitControl();
        p.translate(0, 0, -p.width / 2);

        for (let i = 0; i < paths.length; i++) {
          paths[i].update();
          paths[i].display();
        }
      };

      p.mousePressed = () => {
        next = 0;
        painting = true;
        previous.x = p.mouseX - p.width / 2;
        previous.y = p.mouseY - p.height / 2;
        previous.z = p.random(-100, 100);
        paths.push(new Path());
      };

      p.mouseReleased = () => {
        painting = false;
      };

      class Path {
        constructor() {
          this.particles = [];
          this.hue = p.random(100);
        }

        add(position, force) {
          this.particles.push(new Particle(position, force, this.hue));
        }

        update() {
          for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].update();
          }
        }

        display() {
          for (let i = this.particles.length - 1; i >= 0; i--) {
            if (this.particles[i].lifespan <= 0) {
              this.particles.splice(i, 1);
            } else {
              this.particles[i].display(this.particles[i + 1]);
            }
          }
        }
      }

      class Particle {
        constructor(position, force, hue) {
          this.position = p.createVector(position.x, position.y, position.z);
          this.velocity = p.createVector(force.x, force.y, force.z);
          this.drag = 0.95;
          this.lifespan = 255;
        }

        update() {
          this.position.add(this.velocity);
          this.velocity.mult(this.drag);
          this.lifespan--;
        }

        display(other) {
          p.stroke(240, 107, 128, this.lifespan); // Set art color to #f06b80
          p.fill(240, 107, 128, this.lifespan / 2);

          p.push();
          p.translate(this.position.x, this.position.y, this.position.z);
          p.sphere(8);
          p.pop();

          if (other) {
            p.line(
              this.position.x,
              this.position.y,
              this.position.z,
              other.position.x,
              other.position.y,
              other.position.z
            );
          }
        }
      }
    };

    // Create new p5 instance
    new p5(sketch);
  }, []);

  const handleSave = () => {
    const canvas = canvasRef.current.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL();
      link.download = 'generative_art.png';
      link.click();
    }
  };

  return (
    <div className='body-container' style={{ position: 'relative' }}>
      <div ref={canvasRef} style={{ position: 'relative', zIndex: '1', marginTop: '20px' }}>
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            zIndex: '2',
            cursor: 'pointer',
          }}
          onClick={handleSave}
        >
          <FaSave size={48} />
        </div>
      </div>
    </div>
  );
};

export default GenerativeArt;
